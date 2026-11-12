import { ConflictException, ServiceUnavailableException } from '@nestjs/common';
import { EventEmitter } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { Esp32Controller } from '../esp32.controller';
import { ProductIdentificationsService } from '../../product-identifications/product-identifications.service';
import { ProductIdentificationsRepository } from '../../product-identifications/product-identifications.repository';
import { User } from '../../users/entities/user.entity';
import { Cm2000Service } from '../services/cm2000.service';
import { DoorService } from '../services/door.service';
import { SerialService } from '../services/serial.service';

jest.mock('node:timers/promises', () => ({ setTimeout: jest.fn() }));

describe('RFID flow endpoint', () => {
  const serial = {
    events: new EventEmitter(),
    isConnected: true,
    listPorts: jest.fn(),
    connect: jest.fn(),
  };
  const door = { open: jest.fn(), close: jest.fn(), state: 'open' };
  const reader = Object.assign(
    new Cm2000Service(
      serial as unknown as SerialService,
      door as unknown as DoorService,
    ),
    {
      stopAllOperations: jest.fn(),
      selectAntenna: jest.fn(),
      inventory: jest.fn(),
      startInventory: jest.fn(),
    },
  );
  const repository = { findProductsByRfidValuesForBusiness: jest.fn() };
  const identifications = new ProductIdentificationsService(
    repository as unknown as ProductIdentificationsRepository,
  );
  const controller = new Esp32Controller(reader, identifications);
  const user = { authorization: { businessId: 7 } } as User;
  const product = { id: '12', business_id: '7', name: 'Café' };
  const tag = { epc: 'CAFE00000001000000000002', antenna: 4, rssiRaw: 100 };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetAllMocks();
    serial.events.removeAllListeners();
    reader.events.removeAllListeners();
    serial.isConnected = true;
    repository.findProductsByRfidValuesForBusiness.mockResolvedValue([
      { ...product, identification_value: '00000001' },
    ]);
    serial.listPorts.mockResolvedValue([{ path: '/dev/ttyUSB0' }]);
    serial.connect.mockResolvedValue(undefined);
    door.open.mockResolvedValue(undefined);
    door.close.mockResolvedValue(undefined);
    reader.stopAllOperations.mockResolvedValue(undefined);
    reader.selectAntenna.mockResolvedValue(undefined);
    reader.inventory.mockImplementation(async () => {
      reader.events.emit('tag', tag);
      reader.events.emit('tag', tag);
      return [tag];
    });
    jest.mocked(delay).mockImplementation(
      (ms, value, options) =>
        new Promise((resolve, reject) => {
          const signal = options?.signal;
          const abort = () => {
            clearTimeout(timer);
            signal?.removeEventListener('abort', abort);
            reject(signal?.reason);
          };
          const timer = setTimeout(() => {
            signal?.removeEventListener('abort', abort);
            resolve(value);
          }, ms);
          signal?.addEventListener('abort', abort, { once: true });
          if (signal?.aborted) abort();
        }) as ReturnType<typeof delay>,
    );
  });

  afterEach(() => jest.useRealTimers());

  it('runs the complete sequence and returns deduplicated EPCs only after the final opening ACK', async () => {
    let confirmOpening!: () => void;
    door.open.mockResolvedValueOnce(undefined).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          confirmOpening = resolve;
        }),
    );
    const finished = controller.runFlow(user);
    let completed = false;
    void finished.then(() => {
      completed = true;
    });
    await jest.advanceTimersByTimeAsync(9999);
    expect(door.close).not.toHaveBeenCalled();
    expect(reader.inventory).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);
    expect(door.close).toHaveBeenCalledTimes(1);
    expect(reader.selectAntenna).toHaveBeenCalledWith(4);
    reader.events.emit('tag', { ...tag, epc: 'SECOND' });
    await jest.advanceTimersByTimeAsync(5000);
    expect(door.open).toHaveBeenCalledTimes(2);
    expect(completed).toBe(false);
    confirmOpening();
    await expect(finished).resolves.toEqual({
      products: [
        { epc: tag.epc, product },
        { epc: 'SECOND', product: null },
      ],
      total: 2,
      door: 'open',
    });
    expect(reader.events.listenerCount('tag')).toBe(0);
    expect(serial.events.eventNames()).toEqual([]);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('waits for the closing ACK before selecting an antenna or reading', async () => {
    let confirmClosing!: () => void;
    door.close.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          confirmClosing = resolve;
        }),
    );
    const finished = controller.runFlow(user);
    await jest.advanceTimersByTimeAsync(15_000);
    expect(reader.selectAntenna).not.toHaveBeenCalled();
    expect(reader.inventory).not.toHaveBeenCalled();
    confirmClosing();
    await jest.advanceTimersByTimeAsync(5000);
    await finished;
  });

  it('rejects overlapping flow and read-tag requests throughout the hold without disturbing the active operation', async () => {
    const finished = controller.runFlow(user);
    await jest.advanceTimersByTimeAsync(1000);
    await expect(controller.runFlow(user)).rejects.toBeInstanceOf(
      ConflictException,
    );
    await expect(controller.readTag()).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(reader.stopAllOperations).toHaveBeenCalledTimes(1);
    expect(door.open).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(14_000);
    await finished;
  });

  it('rejects a flow while read-tag is active', async () => {
    const finished = controller.readTag();
    await jest.advanceTimersByTimeAsync(0);
    await expect(controller.runFlow(user)).rejects.toBeInstanceOf(
      ConflictException,
    );
    await jest.advanceTimersByTimeAsync(5000);
    await finished;
    expect(door.close).not.toHaveBeenCalled();
  });

  it('releases the reservation after failure so the next flow can finish', async () => {
    door.open.mockRejectedValueOnce(new Error('Sin ACK'));
    await expect(controller.runFlow(user)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    const finished = controller.runFlow(user);
    await jest.advanceTimersByTimeAsync(15_000);
    await expect(finished).resolves.toEqual({
      products: [{ epc: tag.epc, product }],
      total: 1,
      door: 'open',
    });
  });

  it.each(['disconnected', 'transportError', 'abort'])(
    'cleans up on %s during the hold without closing or reopening',
    async (event) => {
      const cancellation = new AbortController();
      const finished = reader.runFlow(cancellation.signal);
      const assertion = expect(finished).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
      await jest.advanceTimersByTimeAsync(1000);
      if (event === 'abort') cancellation.abort();
      else serial.events.emit(event);
      await assertion;
      expect(door.open).toHaveBeenCalledTimes(1);
      expect(door.close).not.toHaveBeenCalled();
      expect(reader.events.listenerCount('tag')).toBe(0);
      expect(serial.events.eventNames()).toEqual([]);
      expect(jest.getTimerCount()).toBe(0);
    },
  );

  it.each(['closing', 'inventory', 'final opening'])(
    'returns 503 instead of success on failed %s',
    async (stage) => {
      if (stage === 'closing')
        door.close.mockRejectedValueOnce(new Error('Sin ACK'));
      if (stage === 'inventory')
        reader.inventory.mockRejectedValueOnce(
          new Error('Inventario incompleto'),
        );
      if (stage === 'final opening')
        door.open
          .mockResolvedValueOnce(undefined)
          .mockRejectedValueOnce(new Error('Sin ACK'));
      const assertion = expect(controller.runFlow(user)).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
      await jest.advanceTimersByTimeAsync(15_000);
      await assertion;
      expect(reader.events.listenerCount('tag')).toBe(0);
      if (stage !== 'final opening') expect(door.open).toHaveBeenCalledTimes(1);
    },
  );
});
