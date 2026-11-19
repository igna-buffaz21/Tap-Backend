import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter } from 'node:events';
import { ConflictException, ServiceUnavailableException } from '@nestjs/common';
import { Esp32Module } from '../esp32.module';
import { DatabaseModule } from '../../../database/database.module';
import { DatabaseService } from '../../../database/database.service';
import { Esp32Controller } from '../esp32.controller';
import { Cm2000Service } from '../services/cm2000.service';
import { DoorService } from '../services/door.service';
import { SerialService } from '../services/serial.service';
import { SensorService } from '../services/sensor.service';
import type { MessageEvent } from '@nestjs/common';

describe('ESP32 controller with the shared reader service', () => {
  let module: TestingModule;
  let controller: Esp32Controller;
  let reader: Cm2000Service;
  const serial = {
    events: new EventEmitter(),
    isConnected: true,
    listPorts: jest.fn(),
    connect: jest.fn(),
  };
  const door = { state: 'open', open: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    serial.isConnected = true;
    module = await Test.createTestingModule({
      imports: [DatabaseModule, Esp32Module.forApi()],
    })
      .overrideProvider(DatabaseService)
      .useValue({ query: jest.fn() })
      .overrideProvider(SerialService)
      .useValue(serial)
      .overrideProvider(DoorService)
      .useValue(door)
      .compile();
    controller = module.get(Esp32Controller);
    reader = module.get(Cm2000Service);
    jest.spyOn(reader, 'stopAllOperations').mockResolvedValue(undefined);
    jest.useFakeTimers();
  });

  afterEach(async () => {
    await module.close();
    jest.useRealTimers();
    serial.events.removeAllListeners();
  });

  it('returns the unique tag from the module service after five seconds', async () => {
    const tag = { epc: 'E2000017221101441890ABCD', antenna: 4, rssiRaw: 100 };
    jest.spyOn(reader, 'startInventory').mockImplementation(() => {
      reader.events.emit('tag', tag);
    });
    const response = controller.readTag();
    await jest.advanceTimersByTimeAsync(5000);
    await expect(response).resolves.toEqual({ found: true, tag });
  });

  it('returns no tag if more than one EPC is detected', async () => {
    jest.spyOn(reader, 'startInventory').mockImplementation(() => {
      reader.events.emit('tag', { epc: 'ONE', antenna: 4, rssiRaw: 100 });
      reader.events.emit('tag', { epc: 'TWO', antenna: 4, rssiRaw: 100 });
    });
    const response = controller.readTag();
    await jest.advanceTimersByTimeAsync(5000);
    await expect(response).resolves.toEqual({ found: false, tag: null });
  });

  it('exposes concurrent requests as conflict errors', async () => {
    jest.spyOn(reader, 'startInventory').mockImplementation(() => undefined);
    const first = controller.readTag();
    await expect(controller.readTag()).rejects.toBeInstanceOf(
      ConflictException,
    );
    await jest.advanceTimersByTimeAsync(5000);
    await first;
  });

  it('exposes hardware failure as service unavailable', async () => {
    jest.spyOn(reader, 'startInventory').mockImplementation(() => {
      throw new Error('Hardware desconectado');
    });
    await expect(controller.readTag()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('streams the current state, confirms after 1 second and sends a fresh snapshot on reconnect', async () => {
    const events: MessageEvent[] = [];
    const subscription = controller
      .sensorEvents()
      .subscribe((event) => events.push(event));
    await jest.advanceTimersByTimeAsync(0);
    expect(events[0]).toEqual({
      type: 'sensor',
      data: { detected: null, confirmed: false, ready: false, busy: false },
    });
    serial.events.emit('frame', 0x12, Buffer.from([1]));
    expect(events.at(-1)).toEqual({
      type: 'sensor',
      data: { detected: true, confirmed: false, ready: false, busy: false },
    });
    await jest.advanceTimersByTimeAsync(999);
    expect((events.at(-1)!.data as { ready: boolean }).ready).toBe(false);
    await jest.advanceTimersByTimeAsync(1);
    const ready = {
      type: 'sensor',
      data: { detected: true, confirmed: true, ready: true, busy: false },
    };
    expect(events.at(-1)).toEqual(ready);
    subscription.unsubscribe();
    const reconnected: MessageEvent[] = [];
    const next = controller
      .sensorEvents()
      .subscribe((event) => reconnected.push(event));
    expect(reconnected[0]).toEqual(ready);
    module.get(SensorService).consumeDetection();
    expect(reconnected.at(-1)).toEqual({
      type: 'sensor',
      data: { detected: true, confirmed: true, ready: false, busy: false },
    });
    next.unsubscribe();
  });

  it('does not announce readiness for brief detection and removes each subscriber independently', async () => {
    const sensor = module.get(SensorService);
    const baseline = serial.events.listenerCount('disconnected');
    const first = jest.fn();
    const second = jest.fn();
    const one = controller.sensorEvents().subscribe(first);
    const two = controller.sensorEvents().subscribe(second);
    await jest.advanceTimersByTimeAsync(0);
    serial.events.emit('frame', 0x12, Buffer.from([1]));
    await jest.advanceTimersByTimeAsync(900);
    serial.events.emit('frame', 0x12, Buffer.from([0]));
    one.unsubscribe();
    const calls = first.mock.calls.length;
    await jest.advanceTimersByTimeAsync(100);
    expect(second).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ready: true }),
      }),
    );
    serial.events.emit('frame', 0x12, Buffer.from([1]));
    await jest.advanceTimersByTimeAsync(1000);
    expect(first).toHaveBeenCalledTimes(calls);
    expect(second).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ready: true }),
      }),
    );
    two.unsubscribe();
    expect(sensor.events.listenerCount('status')).toBe(0);
    expect(reader.events.listenerCount('flowProgress')).toBe(0);
    expect(serial.events.listenerCount('disconnected')).toBe(baseline);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('streams heartbeat and flow stages without exposing EPCs, and reports availability after a read', async () => {
    const events: MessageEvent[] = [];
    const subscription = controller
      .sensorEvents()
      .subscribe((event) => events.push(event));
    await jest.advanceTimersByTimeAsync(0);
    reader.events.emit('flowProgress', {
      stage: 'reopening',
      epcs: ['PRIVATE-EPC'],
    });
    expect(events.at(-1)).toEqual({
      type: 'flow',
      data: { stage: 'reopening' },
    });
    jest.spyOn(reader, 'startInventory').mockImplementation(() => undefined);
    const reading = controller.readTag();
    expect(events.at(-1)).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ busy: true, ready: false }),
      }),
    );
    await jest.advanceTimersByTimeAsync(5000);
    await reading;
    expect(events.at(-1)).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ busy: false }),
      }),
    );
    await jest.advanceTimersByTimeAsync(10_000);
    expect(events.at(-1)).toEqual({ type: 'heartbeat', data: {} });
    subscription.unsubscribe();
    expect(jest.getTimerCount()).toBe(0);
  });

  it.each(['disconnected', 'transportError'])(
    'closes the stream and clears resources on %s',
    async (event) => {
      const messages: MessageEvent[] = [];
      const complete = jest.fn();
      const subscription = controller
        .sensorEvents()
        .subscribe({ next: (message) => messages.push(message), complete });
      await jest.advanceTimersByTimeAsync(0);
      serial.isConnected = false;
      serial.events.emit(event);
      expect(messages.at(-1)).toEqual(
        expect.objectContaining({ type: 'hardwareError' }),
      );
      expect(complete).toHaveBeenCalledTimes(1);
      expect(subscription.closed).toBe(true);
      expect(module.get(SensorService).events.listenerCount('status')).toBe(0);
      expect(jest.getTimerCount()).toBe(0);
    },
  );

  it('reports connection failure inside the stream and completes', async () => {
    serial.isConnected = false;
    serial.listPorts.mockResolvedValue([]);
    const messages: MessageEvent[] = [];
    const subscription = controller
      .sensorEvents()
      .subscribe((message) => messages.push(message));
    await jest.advanceTimersByTimeAsync(0);
    expect(messages.at(-1)).toEqual(
      expect.objectContaining({ type: 'hardwareError' }),
    );
    expect(subscription.closed).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
  });
});
