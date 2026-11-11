import { EventEmitter } from 'node:events';
import { ConflictException, ServiceUnavailableException } from '@nestjs/common';
import { Cm2000Service } from '../services/cm2000.service';
import { DoorService } from '../services/door.service';
import { SerialService } from '../services/serial.service';

describe('Single RFID read', () => {
  const serial = {
    events: new EventEmitter(),
    isConnected: true,
    listPorts: jest.fn(),
    connect: jest.fn(),
  };
  const door = { state: null as string | null, open: jest.fn() };
  const reader = Object.assign(
    new Cm2000Service(
      serial as unknown as SerialService,
      door as unknown as DoorService,
    ),
    { stopAllOperations: jest.fn(), startInventory: jest.fn() },
  );
  const tag = { epc: 'E2000017221101441890ABCD', antenna: 4, rssiRaw: 100 };
  const run = (path?: string, signal?: AbortSignal) =>
    reader.readSingleTag(path, signal);

  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetAllMocks();
    serial.events.removeAllListeners();
    reader.events.removeAllListeners();
    serial.isConnected = true;
    door.state = null;
    door.open.mockResolvedValue(undefined);
    reader.stopAllOperations.mockResolvedValue(undefined);
    serial.listPorts.mockResolvedValue([{ path: '/dev/ttyUSB0' }]);
    serial.connect.mockResolvedValue(undefined);
  });

  afterEach(() => jest.useRealTimers());

  it.each(['closed', null])(
    'opens a %p door and waits for ACK before reading',
    async (state) => {
      door.state = state;
      let confirm!: () => void;
      door.open.mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            confirm = resolve;
          }),
      );
      const finished = run();
      await jest.advanceTimersByTimeAsync(0);
      expect(reader.startInventory).not.toHaveBeenCalled();
      confirm();
      await jest.advanceTimersByTimeAsync(0);
      expect(reader.startInventory).toHaveBeenCalledWith({ antenna: 4 });
      reader.events.emit('tag', tag);
      await jest.advanceTimersByTimeAsync(5000);
      await expect(finished).resolves.toEqual({ found: true, tag });
      expect(reader.stopAllOperations).toHaveBeenCalledTimes(2);
      expect(reader.events.listenerCount('tag')).toBe(0);
      expect(jest.getTimerCount()).toBe(0);
    },
  );

  it('keeps an already open door open and counts repeated EPCs only once', async () => {
    door.state = 'open';
    reader.startInventory.mockImplementationOnce(() => {
      reader.events.emit('tag', tag);
      reader.events.emit('tag', tag);
    });
    const finished = run();
    let complete = false;
    void finished.then(() => {
      complete = true;
    });
    await jest.advanceTimersByTimeAsync(4999);
    expect(complete).toBe(false);
    await jest.advanceTimersByTimeAsync(1);
    await expect(finished).resolves.toEqual({ found: true, tag });
    expect(door.open).not.toHaveBeenCalled();
  });

  it.each([2, 3])(
    'returns no tag when %i distinct EPCs appear in the same round',
    async (count) => {
      reader.startInventory.mockImplementationOnce(() => {
        for (let index = 0; index < count; index++) {
          reader.events.emit('tag', { ...tag, epc: `EPC${index}` });
        }
      });
      const finished = run();
      await jest.advanceTimersByTimeAsync(5000);
      await expect(finished).resolves.toEqual({ found: false, tag: null });
    },
  );

  it('rejects ambiguity when a second EPC appears near the end of the window', async () => {
    reader.startInventory.mockImplementationOnce(() =>
      reader.events.emit('tag', tag),
    );
    const finished = run();
    await jest.advanceTimersByTimeAsync(4999);
    reader.events.emit('tag', { ...tag, epc: 'OTHER' });
    reader.events.emit('tag', tag);
    await jest.advanceTimersByTimeAsync(1);
    await expect(finished).resolves.toEqual({ found: false, tag: null });
  });

  it('returns null after five seconds without a tag and ignores later readings', async () => {
    const finished = run();
    let complete = false;
    void finished.then(() => {
      complete = true;
    });
    await jest.advanceTimersByTimeAsync(4999);
    expect(complete).toBe(false);
    await jest.advanceTimersByTimeAsync(1);
    reader.events.emit('tag', tag);
    await expect(finished).resolves.toEqual({ found: false, tag: null });
    expect(reader.stopAllOperations).toHaveBeenCalledTimes(2);
  });

  it('waits for pending reader work before returning', async () => {
    let drain!: () => void;
    reader.stopAllOperations
      .mockResolvedValueOnce(undefined)
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            drain = resolve;
          }),
      );
    reader.startInventory.mockImplementationOnce(() =>
      reader.events.emit('tag', tag),
    );
    const finished = run();
    let complete = false;
    void finished.then(() => {
      complete = true;
    });
    await jest.advanceTimersByTimeAsync(5000);
    expect(complete).toBe(false);
    reader.events.emit('tag', { ...tag, epc: 'TOO_LATE' });
    drain();
    await expect(finished).resolves.toEqual({ found: true, tag });
  });

  it('uses an explicit port without auto-detection', async () => {
    serial.isConnected = false;
    reader.startInventory.mockImplementationOnce(() =>
      reader.events.emit('tag', tag),
    );
    const finished = run('/dev/ttyUSB1');
    await jest.advanceTimersByTimeAsync(5000);
    await finished;
    expect(serial.connect).toHaveBeenCalledWith('/dev/ttyUSB1');
    expect(serial.listPorts).not.toHaveBeenCalled();
  });

  it('auto-connects when exactly one serial port is available', async () => {
    serial.isConnected = false;
    reader.startInventory.mockImplementationOnce(() =>
      reader.events.emit('tag', tag),
    );
    const finished = run();
    await jest.advanceTimersByTimeAsync(5000);
    await finished;
    expect(serial.connect).toHaveBeenCalledWith('/dev/ttyUSB0');
  });

  it('requires a port when auto-detection is ambiguous', async () => {
    serial.isConnected = false;
    serial.listPorts.mockResolvedValue([
      { path: '/dev/ttyUSB0' },
      { path: '/dev/ttyUSB1' },
    ]);
    await expect(run()).rejects.toThrow('Se necesita un único puerto');
    expect(serial.connect).not.toHaveBeenCalled();
    expect(door.open).not.toHaveBeenCalled();
  });

  it('does not start reading when the door ACK fails', async () => {
    door.open.mockRejectedValueOnce(new Error('Sin ACK'));
    await expect(run()).rejects.toThrow('Sin ACK');
    expect(reader.startInventory).not.toHaveBeenCalled();
  });

  it('rejects a concurrent request without stopping or opening the active reader', async () => {
    let confirm!: () => void;
    door.open.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          confirm = resolve;
        }),
    );
    const first = run();
    await jest.advanceTimersByTimeAsync(0);
    await expect(run()).rejects.toBeInstanceOf(ConflictException);
    expect(reader.stopAllOperations).toHaveBeenCalledTimes(1);
    expect(door.open).toHaveBeenCalledTimes(1);
    confirm();
    await jest.advanceTimersByTimeAsync(5000);
    await expect(first).resolves.toEqual({ found: false, tag: null });
  });

  it('releases the reader after failure so another request can succeed', async () => {
    door.open.mockRejectedValueOnce(new Error('Sin ACK'));
    await expect(run()).rejects.toBeInstanceOf(ServiceUnavailableException);
    reader.startInventory.mockImplementationOnce(() =>
      reader.events.emit('tag', tag),
    );
    const next = run();
    await jest.advanceTimersByTimeAsync(5000);
    await expect(next).resolves.toEqual({ found: true, tag });
  });

  it.each([
    'operationError',
    'disconnected',
    'transportError',
    'abort',
    'startFailure',
  ])('reports %s as an error and cleans up the reader', async (event) => {
    const cancellation = new AbortController();
    reader.startInventory.mockImplementationOnce(() => {
      if (event === 'operationError') reader.events.emit(event, 'Error RFID');
      else if (event === 'abort') cancellation.abort();
      else if (event === 'startFailure') throw new Error('Reader busy');
      else serial.events.emit(event);
    });
    await expect(run(undefined, cancellation.signal)).rejects.toThrow();
    expect(reader.stopAllOperations).toHaveBeenCalledTimes(2);
    expect(reader.events.listenerCount('tag')).toBe(0);
    expect(reader.events.listenerCount('operationError')).toBe(0);
    expect(serial.events.listenerCount('disconnected')).toBe(0);
    expect(serial.events.listenerCount('transportError')).toBe(0);
    expect(jest.getTimerCount()).toBe(0);
  });
});
