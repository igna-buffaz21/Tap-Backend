import { EventEmitter } from 'node:events';
import type { Interface } from 'node:readline/promises';
import { runEsp32Console } from '../../../common/scripts/esp32-console';
import { Cm2000Service } from '../services/cm2000.service';
import { DoorService } from '../services/door.service';
import { SerialService } from '../services/serial.service';

describe('ESP32 console', () => {
  const serial = {
    isConnected: true,
    connect: jest.fn(),
    disconnect: jest.fn(),
    listPorts: jest.fn(),
  };
  const door = { open: jest.fn(), close: jest.fn(), state: null };
  const reader = {
    events: new EventEmitter(),
    isInventoryRunning: false,
    stopAllOperations: jest.fn(),
    startInventory: jest.fn(),
    getPower: jest.fn(),
    startTemperatureMonitoring: jest.fn(),
    writeEpc: jest.fn(),
  };

  function run(answers: string[]) {
    const bus = new EventEmitter();
    const terminal = Object.assign(bus, {
      question: jest.fn(() => {
        const answer = answers.shift();
        if (answer === undefined) bus.emit('close');
        return Promise.resolve(answer ?? '');
      }),
    });
    const finished = runEsp32Console(
      terminal as unknown as Interface,
      serial as unknown as SerialService,
      door as unknown as DoorService,
      reader as unknown as Cm2000Service,
    );
    return { terminal, finished };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    serial.isConnected = true;
    reader.events.removeAllListeners();
    reader.stopAllOperations.mockResolvedValue(undefined);
    door.open.mockResolvedValue(undefined);
    door.close.mockResolvedValue(undefined);
    reader.getPower.mockResolvedValue([20, 20, 20, 20]);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'table').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('does not enter the door menu until pending RFID work has completed', async () => {
    let release!: () => void;
    reader.stopAllOperations.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    const { terminal, finished } = run(['4', '1', '0', '0']);
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(terminal.question.mock.calls).toHaveLength(1);
    expect(door.open).not.toHaveBeenCalled();
    release();
    await finished;
    expect(door.open).toHaveBeenCalledTimes(1);
  });

  it('waits for the door ACK before accepting another menu action', async () => {
    let release!: () => void;
    door.open.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    const { terminal, finished } = run(['4', '1', '0', '5', '5', '0', '0']);
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(terminal.question.mock.calls).toHaveLength(2);
    expect(reader.getPower).not.toHaveBeenCalled();
    release();
    await finished;
    expect(reader.getPower).toHaveBeenCalledTimes(1);
  });

  it('drains continuous inventory and automatic temperature before switching to the door', async () => {
    let release!: () => void;
    reader.stopAllOperations.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    const { finished } = run([
      '5',
      '3',
      '150',
      '11',
      '5',
      '0',
      '4',
      '1',
      '0',
      '0',
    ]);
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(reader.startInventory).toHaveBeenCalledWith({
      antenna: 1,
      pauseMs: 150,
    });
    expect(reader.startTemperatureMonitoring).toHaveBeenCalledWith(5, 1);
    expect(door.open).not.toHaveBeenCalled();
    release();
    await finished;
    expect(door.open).toHaveBeenCalledTimes(1);
  });

  it('rejects disconnected hardware actions', async () => {
    serial.isConnected = false;
    await run(['4', '5', '0']).finished;
    expect(door.open).not.toHaveBeenCalled();
    expect(reader.getPower).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      'Error:',
      expect.stringContaining('Conectá primero'),
    );
  });

  it('drains pending RFID work and removes listeners on EOF', async () => {
    const { finished } = run(['5', '3', '150']);
    await finished;
    expect(reader.stopAllOperations).toHaveBeenCalled();
    expect(reader.events.eventNames()).toEqual([]);
    expect(door.open).not.toHaveBeenCalled();
  });

  it('reports failures and stops RFID before accepting a door action', async () => {
    reader.getPower.mockRejectedValueOnce(
      new Error('Sin respuesta del lector.'),
    );
    await run(['5', '5', '4', '2', '0', '0']).finished;
    expect(console.error).toHaveBeenCalledWith(
      'Error:',
      'Sin respuesta del lector.',
    );
    expect(door.close).toHaveBeenCalledTimes(1);
    expect(reader.stopAllOperations.mock.invocationCallOrder[1]).toBeLessThan(
      door.close.mock.invocationCallOrder[0],
    );
  });
});
