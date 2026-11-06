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
    selectAntenna: jest.fn(),
    setPower: jest.fn(),
    getTemperature: jest.fn(),
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
    serial.listPorts.mockResolvedValue([]);
    serial.connect.mockImplementation(async () => {
      serial.isConnected = true;
    });
    reader.events.removeAllListeners();
    reader.stopAllOperations.mockResolvedValue(undefined);
    door.open.mockResolvedValue(undefined);
    door.close.mockResolvedValue(undefined);
    reader.setPower.mockResolvedValue([20, 20, 20, 20]);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'table').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('drains RFID and waits for the closing ACK before exiting with 0', async () => {
    let drained!: () => void;
    let confirmed!: () => void;
    reader.stopAllOperations.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          drained = resolve;
        }),
    );
    door.close.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          confirmed = resolve;
        }),
    );
    const { terminal, finished } = run(['0']);
    let exited = false;
    void finished.then(() => {
      exited = true;
    });
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(door.close).not.toHaveBeenCalled();
    drained();
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(door.close).toHaveBeenCalledTimes(1);
    expect(exited).toBe(false);
    expect(terminal.question).toHaveBeenCalledTimes(1);
    confirmed();
    await finished;
    expect(console.log).toHaveBeenCalledWith(
      'Puerta cerrada confirmada. Saliendo.',
    );
  });

  it('keeps the menu open after a failed exit closure and allows reconnecting', async () => {
    door.close.mockImplementationOnce(async () => {
      serial.isConnected = false;
      throw new Error('Sin ACK de puerta.');
    });
    const { terminal, finished } = run(['0', '2', '/dev/ttyUSB0', '0']);
    await finished;
    expect(terminal.question).toHaveBeenCalledTimes(4);
    expect(serial.connect).toHaveBeenCalledWith('/dev/ttyUSB0');
    expect(door.close).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenCalledWith('Error:', 'Sin ACK de puerta.');
    expect(console.log).toHaveBeenCalledWith(
      'Puerta cerrada confirmada. Saliendo.',
    );
  });

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
    const { terminal, finished } = run([
      '4',
      '1',
      '0',
      '5',
      '1',
      '16',
      '0',
      '0',
    ]);
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(terminal.question.mock.calls).toHaveLength(2);
    expect(reader.setPower).not.toHaveBeenCalled();
    release();
    await finished;
    expect(reader.setPower).toHaveBeenCalledTimes(1);
  });

  it('drains continuous inventory before switching to the door', async () => {
    let release!: () => void;
    reader.stopAllOperations
      .mockResolvedValueOnce(undefined)
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            release = resolve;
          }),
      );
    const { finished } = run(['5', '3', '0', '4', '1', '0', '0']);
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(reader.startInventory).toHaveBeenCalledWith({
      antenna: 4,
      pauseMs: 150,
    });
    expect(door.open).not.toHaveBeenCalled();
    release();
    await finished;
    expect(door.open).toHaveBeenCalledTimes(1);
  });

  it('always uses ANT4 for power, temperature and continuous EPC reading', async () => {
    await run(['5', '1', '16', '4', '3', '0', '0']).finished;
    expect(reader.selectAntenna).toHaveBeenCalledWith(4);
    expect(reader.setPower).toHaveBeenCalledWith(4, 16);
    expect(reader.getTemperature).toHaveBeenCalledWith(4);
    expect(reader.startInventory).toHaveBeenCalledWith({
      antenna: 4,
      pauseMs: 150,
    });
  });

  it('stops EPC reading from the same menu option', async () => {
    reader.isInventoryRunning = true;
    try {
      await run(['5', '3', '0', '0']).finished;
      expect(reader.startInventory).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Lectura EPC detenida.');
    } finally {
      reader.isInventoryRunning = false;
    }
  });

  it('connects automatically to the only USB serial port before showing the menu', async () => {
    serial.isConnected = false;
    serial.listPorts.mockResolvedValue([
      { path: '/dev/ttyS0' },
      { path: '/dev/ttyUSB0', vendorId: '10C4' },
    ]);
    await run(['4', '1', '0', '0']).finished;
    expect(serial.connect).toHaveBeenCalledWith('/dev/ttyUSB0');
    expect(serial.connect.mock.invocationCallOrder[0]).toBeLessThan(
      door.open.mock.invocationCallOrder[0],
    );
  });

  it('keeps manual connection available when multiple USB ports are present', async () => {
    serial.isConnected = false;
    serial.listPorts.mockResolvedValue([
      { path: '/dev/ttyUSB0' },
      { path: '/dev/ttyUSB1' },
    ]);
    await run(['2', '/dev/ttyUSB1', '0']).finished;
    expect(serial.connect).toHaveBeenCalledTimes(1);
    expect(serial.connect).toHaveBeenCalledWith('/dev/ttyUSB1');
    expect(console.error).toHaveBeenCalledWith(
      'Conexión automática:',
      expect.stringContaining('varios puertos'),
    );
  });

  it('keeps the menu available after an automatic connection failure', async () => {
    serial.isConnected = false;
    serial.listPorts.mockResolvedValue([{ path: '/dev/ttyACM0' }]);
    serial.connect.mockRejectedValueOnce(
      new Error('No se pudo preparar la conexión serial.'),
    );
    await run(['0']).finished;
    expect(console.error).toHaveBeenCalledWith(
      'Conexión automática:',
      'No se pudo preparar la conexión serial.',
    );
    expect(reader.events.eventNames()).toEqual([]);
  });

  it('rejects disconnected hardware actions', async () => {
    serial.isConnected = false;
    await run(['4', '5', '0']).finished;
    expect(door.open).not.toHaveBeenCalled();
    expect(reader.setPower).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      'Error:',
      expect.stringContaining('Conectá primero'),
    );
  });

  it('drains pending RFID work and removes listeners on EOF', async () => {
    const { finished } = run(['5', '3']);
    await finished;
    expect(reader.stopAllOperations).toHaveBeenCalled();
    expect(reader.events.eventNames()).toEqual([]);
    expect(door.open).not.toHaveBeenCalled();
  });

  it('reports failures and stops RFID before accepting a door action', async () => {
    reader.setPower.mockRejectedValueOnce(
      new Error('Sin respuesta del lector.'),
    );
    await run(['5', '1', '16', '4', '2', '0', '0']).finished;
    expect(console.error).toHaveBeenCalledWith(
      'Error:',
      'Sin respuesta del lector.',
    );
    expect(door.close).toHaveBeenCalledTimes(2);
    expect(reader.stopAllOperations.mock.invocationCallOrder[1]).toBeLessThan(
      door.close.mock.invocationCallOrder[0],
    );
  });
});
