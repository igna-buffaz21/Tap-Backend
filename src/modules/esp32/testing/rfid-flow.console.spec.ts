import { EventEmitter } from 'node:events';
import type { Interface } from 'node:readline/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { runRfidFlowConsole } from '../../../common/scripts/rfid-flow-console';
import { Cm2000Service } from '../services/cm2000.service';
import { DoorService } from '../services/door.service';
import { SerialService } from '../services/serial.service';
import { SensorService } from '../services/sensor.service';

jest.mock('node:timers/promises', () => ({ setTimeout: jest.fn() }));

describe('RFID automated flow console', () => {
  const serial = {
    events: new EventEmitter(),
    isConnected: true,
    listPorts: jest.fn(),
    connect: jest.fn(),
  };
  const sensor = new SensorService(serial as unknown as SerialService);
  const door = { open: jest.fn(), close: jest.fn() };
  const reader = Object.assign(
    new Cm2000Service(
      serial as unknown as SerialService,
      door as unknown as DoorService,
      sensor,
    ),
    {
      stopAllOperations: jest.fn(),
      selectAntenna: jest.fn(),
      inventory: jest.fn(),
    },
  );

  function detect(state: boolean | null) {
    Reflect.set(sensor, 'detected', state);
    sensor.events.emit('change', state);
  }

  function run() {
    const terminal = new EventEmitter();
    const finished = runRfidFlowConsole(
      terminal as unknown as Interface,
      serial as unknown as SerialService,
      door as unknown as DoorService,
      reader,
    );
    return { terminal, finished };
  }

  function tag(epc: string) {
    reader.events.emit('tag', { epc, antenna: 4, rssiRaw: 100 });
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetAllMocks();
    Reflect.set(sensor, 'detected', null);
    sensor.events.removeAllListeners();
    serial.isConnected = true;
    serial.events.removeAllListeners();
    reader.events.removeAllListeners();
    serial.listPorts.mockResolvedValue([{ path: '/dev/ttyUSB0' }]);
    serial.connect.mockResolvedValue(undefined);
    reader.stopAllOperations.mockResolvedValue(undefined);
    reader.selectAntenna.mockResolvedValue(undefined);
    reader.inventory.mockImplementation(async () => {
      tag('E2000017221101441890ABCD');
      tag('E2000017221101441890ABCD');
      tag('E2000017221101441890ABCE');
      return [];
    });
    door.open.mockResolvedValue(undefined);
    door.close.mockResolvedValue(undefined);
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
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('opens automatically, confirms for 1s, waits 3s and reads for 5s', async () => {
    const { terminal, finished } = run();
    await jest.advanceTimersByTimeAsync(0);
    expect(door.open).toHaveBeenCalledTimes(1);
    expect(door.close).not.toHaveBeenCalled();
    detect(true);
    await jest.advanceTimersByTimeAsync(999);
    expect(door.open).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);
    expect(door.open).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(2999);
    expect(door.close).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);
    expect(door.close).toHaveBeenCalledTimes(1);
    expect(reader.selectAntenna).toHaveBeenCalledWith(4);
    await jest.advanceTimersByTimeAsync(4999);
    expect(door.open).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);
    expect(door.open).toHaveBeenCalledTimes(3);
    expect(console.log).toHaveBeenCalledWith('Total de EPC únicos: 2\n');
    terminal.emit('close');
    await finished;
    expect(sensor.events.eventNames()).toEqual([]);
    expect(serial.events.eventNames()).toEqual([]);
  });

  it('discards brief detection and restarts the full confirmation time', async () => {
    const { terminal, finished } = run();
    await jest.advanceTimersByTimeAsync(0);
    detect(true);
    await jest.advanceTimersByTimeAsync(900);
    detect(false);
    await jest.advanceTimersByTimeAsync(5000);
    expect(door.open).toHaveBeenCalledTimes(1);
    detect(true);
    await jest.advanceTimersByTimeAsync(999);
    expect(door.open).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);
    expect(door.open).toHaveBeenCalledTimes(1);
    terminal.emit('close');
    await finished;
    expect(door.close).not.toHaveBeenCalled();
  });

  it('does not retrigger until the object is removed and detected again', async () => {
    const { terminal, finished } = run();
    await jest.advanceTimersByTimeAsync(0);
    detect(true);
    await jest.advanceTimersByTimeAsync(9000);
    expect(door.open).toHaveBeenCalledTimes(3);
    await jest.advanceTimersByTimeAsync(20_000);
    expect(door.close).toHaveBeenCalledTimes(1);
    detect(false);
    detect(true);
    await jest.advanceTimersByTimeAsync(1000);
    expect(door.open).toHaveBeenCalledTimes(3);
    terminal.emit('close');
    await finished;
  });

  it('continues the confirmed flow if the object leaves during the 3 second wait', async () => {
    const { terminal, finished } = run();
    await jest.advanceTimersByTimeAsync(0);
    detect(true);
    await jest.advanceTimersByTimeAsync(1000);
    detect(false);
    await jest.advanceTimersByTimeAsync(3000);
    expect(door.close).toHaveBeenCalledTimes(1);
    terminal.emit('close');
    await finished;
  });

  it.each([500, 1500])(
    'cancels on EOF at %sms without closing or reading',
    async (ms) => {
      const { terminal, finished } = run();
      await jest.advanceTimersByTimeAsync(0);
      detect(true);
      await jest.advanceTimersByTimeAsync(ms);
      terminal.emit('close');
      await finished;
      await jest.advanceTimersByTimeAsync(5000);
      expect(door.close).not.toHaveBeenCalled();
      expect(reader.inventory).not.toHaveBeenCalled();
      expect(sensor.events.eventNames()).toEqual([]);
    },
  );

  it('stops on a transport failure during confirmation', async () => {
    const { finished } = run();
    const rejected = expect(finished).rejects.toThrow(
      'Se perdió la comunicación',
    );
    await jest.advanceTimersByTimeAsync(0);
    detect(true);
    await jest.advanceTimersByTimeAsync(500);
    serial.events.emit('disconnected');
    await rejected;
    expect(door.close).not.toHaveBeenCalled();
    expect(sensor.events.eventNames()).toEqual([]);
  });

  it('waits for closing ACK when exiting with 0', async () => {
    const { terminal, finished } = run();
    await jest.advanceTimersByTimeAsync(0);
    let confirm!: () => void;
    door.close.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          confirm = resolve;
        }),
    );
    terminal.emit('line', '0');
    let exited = false;
    void finished.then(() => {
      exited = true;
    });
    await jest.advanceTimersByTimeAsync(0);
    expect(door.close).toHaveBeenCalledTimes(1);
    expect(exited).toBe(false);
    confirm();
    await finished;
    expect(console.log).toHaveBeenCalledWith(
      'Puerta cerrada confirmada. Saliendo.',
    );
  });

  it('rejects ambiguous ports before opening', async () => {
    serial.isConnected = false;
    serial.listPorts.mockResolvedValue([
      { path: '/dev/ttyUSB0' },
      { path: '/dev/ttyUSB1' },
    ]);
    await expect(run().finished).rejects.toThrow('único puerto');
    expect(door.open).not.toHaveBeenCalled();
  });

  it('stops without reopening when inventory fails', async () => {
    reader.inventory.mockRejectedValueOnce(new Error('Inventario incompleto.'));
    const { finished } = run();
    const rejected = expect(finished).rejects.toThrow('Inventario incompleto.');
    await jest.advanceTimersByTimeAsync(0);
    detect(true);
    await jest.advanceTimersByTimeAsync(4000);
    await rejected;
    expect(door.open).toHaveBeenCalledTimes(1);
    expect(console.log).not.toHaveBeenCalledWith(
      expect.stringContaining('FLUJO FINALIZADO'),
    );
  });
});
