import { EventEmitter } from 'node:events';
import type { Interface } from 'node:readline/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { runRfidFlowConsole } from '../../../common/scripts/rfid-flow-console';
import { Cm2000Service } from '../services/cm2000.service';
import { DoorService } from '../services/door.service';
import { SerialService } from '../services/serial.service';

jest.mock('node:timers/promises', () => ({ setTimeout: jest.fn() }));

describe('RFID automated flow console', () => {
  const serial = {
    events: new EventEmitter(),
    isConnected: true,
    listPorts: jest.fn(),
    connect: jest.fn(),
  };
  const door = { open: jest.fn(), close: jest.fn() };
  const reader = {
    events: new EventEmitter(),
    stopAllOperations: jest.fn(),
    selectAntenna: jest.fn(),
    inventory: jest.fn(),
  };

  function run(answers: string[]) {
    const terminal = Object.assign(new EventEmitter(), {
      question: jest.fn(async () => {
        const answer = answers.shift();
        if (answer === undefined) terminal.emit('close');
        return answer ?? '';
      }),
    });
    const finished = runRfidFlowConsole(
      terminal as unknown as Interface,
      serial as unknown as SerialService,
      door as unknown as DoorService,
      reader as unknown as Cm2000Service,
    );
    return { terminal, finished };
  }

  function tag(epc: string) {
    reader.events.emit('tag', { epc, antenna: 4, rssiRaw: 100 });
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetAllMocks();
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

  it('connects and waits for the closing ACK before exiting with 0', async () => {
    serial.isConnected = false;
    let confirm!: () => void;
    door.close.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          confirm = resolve;
        }),
    );
    const { terminal, finished } = run(['0']);
    let exited = false;
    void finished.then(() => {
      exited = true;
    });
    await jest.advanceTimersByTimeAsync(0);
    expect(serial.connect).toHaveBeenCalledWith('/dev/ttyUSB0');
    expect(door.close).toHaveBeenCalledTimes(1);
    expect(reader.stopAllOperations.mock.invocationCallOrder[0]).toBeLessThan(
      door.close.mock.invocationCallOrder[0],
    );
    expect(terminal.question).toHaveBeenCalledTimes(1);
    expect(exited).toBe(false);
    confirm();
    await finished;
    expect(console.log).toHaveBeenCalledWith(
      'Puerta cerrada confirmada. Saliendo.',
    );
  });

  it('returns to the menu if closing on exit fails and only exits after confirmation', async () => {
    door.close.mockRejectedValueOnce(new Error('Sin ACK de puerta.'));
    const { terminal, finished } = run(['0', '0']);
    await finished;
    expect(terminal.question).toHaveBeenCalledTimes(2);
    expect(door.close).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenCalledWith(
      'No se pudo confirmar el cierre; no se salió:',
      'Sin ACK de puerta.',
    );
    expect(
      jest
        .mocked(console.log)
        .mock.calls.filter(
          ([message]) => message === 'Puerta cerrada confirmada. Saliendo.',
        ),
    ).toHaveLength(1);
  });

  it('waits for ACKs, holds the door for 10 seconds, reads for 5 seconds and reports unique EPCs', async () => {
    const { terminal, finished } = run(['1', '0']);
    await jest.advanceTimersByTimeAsync(9999);
    expect(door.open).toHaveBeenCalledTimes(1);
    expect(door.close).not.toHaveBeenCalled();
    expect(reader.inventory).not.toHaveBeenCalled();
    expect(terminal.question).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);
    expect(door.close).toHaveBeenCalledTimes(1);
    expect(reader.selectAntenna).toHaveBeenCalledWith(4);
    await jest.advanceTimersByTimeAsync(4999);
    expect(door.open).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);
    await finished;
    expect(door.open).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenCalledWith('Total de EPC únicos: 2\n');
    expect(console.log).toHaveBeenCalledWith('1. E2000017221101441890ABCD');
    expect(console.log).toHaveBeenCalledWith('2. E2000017221101441890ABCE');
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('FLUJO FINALIZADO'),
    );
    expect(reader.events.eventNames()).toEqual([]);
    expect(serial.events.eventNames()).toEqual([]);
  });

  it('waits for opening confirmation before starting the 10 second hold', async () => {
    let confirm!: () => void;
    door.open.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          confirm = resolve;
        }),
    );
    const { terminal, finished } = run(['1', '0']);
    await jest.advanceTimersByTimeAsync(20_000);
    expect(door.close).not.toHaveBeenCalled();
    expect(terminal.question).toHaveBeenCalledTimes(1);
    confirm();
    await jest.advanceTimersByTimeAsync(15_000);
    await finished;
    expect(door.close).toHaveBeenCalledTimes(2);
  });

  it.each(['initial opening', 'closing', 'final opening'])(
    'does not finish after failed %s',
    async (stage) => {
      if (stage === 'initial opening')
        door.open.mockRejectedValueOnce(new Error('Sin ACK.'));
      if (stage === 'closing')
        door.close.mockRejectedValueOnce(new Error('Sin ACK.'));
      if (stage === 'final opening')
        door.open
          .mockResolvedValueOnce(undefined)
          .mockRejectedValueOnce(new Error('Sin ACK.'));
      const { finished } = run(['1']);
      await jest.advanceTimersByTimeAsync(15_000);
      await finished;
      expect(console.error).toHaveBeenCalledWith('Flujo detenido:', 'Sin ACK.');
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('FLUJO FINALIZADO'),
      );
      if (stage === 'initial opening')
        expect(door.close).not.toHaveBeenCalled();
      if (stage !== 'final opening')
        expect(reader.inventory).not.toHaveBeenCalled();
    },
  );

  it('does not reopen or report success when an inventory round fails', async () => {
    reader.inventory.mockRejectedValueOnce(new Error('Inventario incompleto.'));
    const { finished } = run(['1']);
    await jest.advanceTimersByTimeAsync(15_000);
    await finished;
    expect(door.open).toHaveBeenCalledTimes(1);
    expect(console.log).not.toHaveBeenCalledWith(
      expect.stringContaining('INFORME DE LECTURA'),
    );
    expect(console.error).toHaveBeenCalledWith(
      'Flujo detenido:',
      'Inventario incompleto.',
    );
  });

  it('drains the last round but excludes tags received after the reading window', async () => {
    let completeRound!: () => void;
    reader.inventory.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          completeRound = resolve;
        }),
    );
    const { finished } = run(['1', '0']);
    await jest.advanceTimersByTimeAsync(10_000);
    tag('E2000017221101441890ABCD');
    await jest.advanceTimersByTimeAsync(5000);
    tag('E2000017221101441890ABCE');
    expect(door.open).toHaveBeenCalledTimes(1);
    completeRound();
    await finished;
    expect(console.log).toHaveBeenCalledWith('Total de EPC únicos: 1\n');
    expect(door.open).toHaveBeenCalledTimes(2);
  });

  it('starts a fresh EPC collection on each execution', async () => {
    const { finished } = run(['1', '1', '0']);
    await jest.advanceTimersByTimeAsync(15_000);
    reader.inventory.mockResolvedValue([]);
    await jest.advanceTimersByTimeAsync(15_000);
    await finished;
    expect(console.log).toHaveBeenCalledWith('Total de EPC únicos: 0\n');
    expect(door.open).toHaveBeenCalledTimes(4);
  });

  it('stops immediately on a disconnect during the hold', async () => {
    const { finished } = run(['1']);
    await jest.advanceTimersByTimeAsync(1000);
    serial.events.emit('disconnected');
    await finished;
    expect(door.close).not.toHaveBeenCalled();
    expect(reader.inventory).not.toHaveBeenCalled();
    expect(serial.events.eventNames()).toEqual([]);
  });

  it('cancels the hold on EOF without sending subsequent hardware commands', async () => {
    const { terminal, finished } = run(['1']);
    await jest.advanceTimersByTimeAsync(1000);
    terminal.emit('close');
    await finished;
    expect(door.close).not.toHaveBeenCalled();
    expect(reader.events.eventNames()).toEqual([]);
  });

  it('connects automatically before opening and rejects ambiguous USB ports', async () => {
    serial.isConnected = false;
    serial.listPorts.mockResolvedValue([
      { path: '/dev/ttyUSB0' },
      { path: '/dev/ttyUSB1' },
    ]);
    await run(['1', '0']).finished;
    expect(serial.connect).not.toHaveBeenCalled();
    expect(door.open).not.toHaveBeenCalled();
    serial.listPorts.mockResolvedValue([{ path: '/dev/ttyUSB0' }]);
    const { finished } = run(['1', '0']);
    await jest.advanceTimersByTimeAsync(15_000);
    await finished;
    expect(serial.connect).toHaveBeenCalledWith('/dev/ttyUSB0');
    expect(serial.connect.mock.invocationCallOrder[0]).toBeLessThan(
      door.open.mock.invocationCallOrder[0],
    );
  });
});
