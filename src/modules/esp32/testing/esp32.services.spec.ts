import { EventEmitter, once } from 'node:events';
import { SerialPort } from 'serialport';
import { Cm2000Service } from '../services/cm2000.service';
import { DoorService } from '../services/door.service';
import { SerialService } from '../services/serial.service';

jest.mock('serialport', () => ({
  SerialPort: Object.assign(jest.fn(), { list: jest.fn() }),
}));

function a5(type: number, payload: Buffer = Buffer.alloc(0)): Buffer {
  let checksum = type ^ payload.length;
  for (const byte of payload) checksum ^= byte;
  return Buffer.concat([
    Buffer.from([0xa5, type, payload.length]),
    payload,
    Buffer.from([checksum]),
  ]);
}

function a0(
  command: number,
  payload: Buffer = Buffer.alloc(0),
  address = 1,
): Buffer {
  const body = Buffer.concat([
    Buffer.from([0xa0, payload.length + 3, address, command]),
    payload,
  ]);
  return Buffer.concat([
    body,
    Buffer.from([-body.reduce((sum, byte) => sum + byte, 0) & 255]),
  ]);
}

describe('ESP32 services over the shared USB connection', () => {
  let serial: SerialService;
  let reader: Cm2000Service;
  let door: DoorService;
  let bus: EventEmitter;
  let port: SerialPort;
  let writes: Buffer[];
  let epc: string;
  let filter: string | null;
  let powers: number[];
  let respond: (command: number, payload: Buffer) => Buffer | null;
  let holdInventory: boolean;
  let holdDoorAck: boolean;
  let multipleTags: boolean;
  let noWriteAck: boolean;
  let rejectWrite: boolean;
  let isOpen: boolean;

  function tagFrame(value = epc): Buffer {
    return a0(
      0x89,
      Buffer.concat([
        Buffer.from([2, 0x30, 0]),
        Buffer.from(value, 'hex'),
        Buffer.from([0x91]),
      ]),
    );
  }

  function inventoryFrames(): Buffer {
    return Buffer.concat([
      tagFrame(),
      ...(multipleTags ? [tagFrame('FFFFFFFFFFFFFFFFFFFFFFFF')] : []),
      a0(0x89, Buffer.alloc(7)),
    ]);
  }

  function injectRfid(payload: Buffer): void {
    for (let i = 0; i < payload.length; i += 64)
      bus.emit('data', a5(0x11, payload.subarray(i, i + 64)));
  }

  beforeEach(async () => {
    jest.useFakeTimers();
    writes = [];
    epc = '112233445566778899AABBCC';
    filter = null;
    powers = [20, 21, 22, 23];
    holdInventory = false;
    holdDoorAck = false;
    multipleTags = false;
    noWriteAck = false;
    rejectWrite = false;
    isOpen = false;
    bus = new EventEmitter();
    respond = (command, payload) => {
      switch (command) {
        case 0x74:
          return a0(command, Buffer.from([0x10]));
        case 0x77:
          return a0(command, Buffer.from(powers));
        case 0x76:
          powers = [...payload];
          return a0(command, Buffer.from([0x10]));
        case 0x7b:
          return a0(command, Buffer.from([1, 9]));
        case 0x85:
          filter =
            payload[0] === 1
              ? null
              : payload.subarray(2).toString('hex').toUpperCase();
          return a0(command, Buffer.from([0x10]));
        case 0x86:
          return a0(
            command,
            filter === null
              ? Buffer.from([1, 0])
              : Buffer.concat([
                  Buffer.from([0, 12]),
                  Buffer.from(filter, 'hex'),
                ]),
          );
        case 0x89:
          return holdInventory ? null : inventoryFrames();
        case 0x82: {
          if (rejectWrite) return a0(command, Buffer.from([0x40]));
          const offset = (payload[5] - 2) * 4;
          epc =
            epc.slice(0, offset) +
            payload.subarray(7).toString('hex').toUpperCase() +
            epc.slice(offset + 4);
          return noWriteAck ? null : a0(command, Buffer.from([0x10]));
        }
        default:
          throw new Error(`Unexpected command ${command}`);
      }
    };
    port = Object.assign(bus, {
      path: '/dev/test-esp32',
      open: jest.fn((callback: (error?: Error) => void) => {
        isOpen = true;
        callback();
      }),
      set: jest.fn((_options: unknown, callback: (error?: Error) => void) =>
        callback(),
      ),
      close: jest.fn((callback: (error?: Error) => void) => {
        isOpen = false;
        bus.emit('close');
        callback();
      }),
      drain: jest.fn((callback: (error?: Error) => void) => callback()),
      write: jest.fn((frame: Buffer, callback: (error?: Error) => void) => {
        writes.push(Buffer.from(frame));
        callback();
        if (frame[1] === 0x10) {
          const request = frame.subarray(3, -1);
          const response = respond(request[3], request.subarray(4, -1));
          if (response) injectRfid(response);
        } else if (!holdDoorAck)
          bus.emit('data', a5(0x20, Buffer.from([frame[1]])));
        return true;
      }),
    }) as unknown as SerialPort;
    Object.defineProperty(port, 'isOpen', { get: () => isOpen });
    jest.mocked(SerialPort).mockImplementation(() => port);
    serial = new SerialService();
    reader = new Cm2000Service(serial);
    door = new DoorService(serial);
    const connected = serial.connect('/dev/test-esp32');
    await jest.advanceTimersByTimeAsync(2500);
    await connected;
  });

  afterEach(async () => {
    await serial.disconnect();
    await reader.onModuleDestroy();
    door.onModuleDestroy();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  function commands(): number[] {
    return writes.filter((frame) => frame[1] === 0x10).map((frame) => frame[6]);
  }

  it('opens USB once, sends the original door frames and requires ACK', async () => {
    await serial.connect('/dev/test-esp32');
    await door.open();
    expect(writes[0].toString('hex')).toBe('a5010001');
    expect(door.state).toBe('open');
    await door.close();
    expect(writes[1].toString('hex')).toBe('a5020002');
    expect(door.state).toBe('closed');
    expect(SerialPort).toHaveBeenCalledTimes(1);
    expect(jest.mocked(port).set.mock.calls).toEqual([
      [{ dtr: false, rts: false }, expect.any(Function)],
    ]);
    await serial.disconnect();
    expect(door.state).toBeNull();
  });

  it('handles noise, fragmented/concatenated A5 frames and resynchronizes after bad checksums', () => {
    const received: Buffer[] = [];
    serial.events.on('rfid', (data: Buffer) => received.push(data));
    const bad = Buffer.from('a511010000', 'hex');
    const good = a5(0x11, Buffer.from([1, 2, 3]));
    bus.emit(
      'data',
      Buffer.concat([
        Buffer.from([0xff, 0xa5, 0x11, 65]),
        bad,
        good.subarray(0, 3),
      ]),
    );
    expect(received).toHaveLength(0);
    bus.emit(
      'data',
      Buffer.concat([
        good.subarray(3),
        a5(0x20, Buffer.from([1])),
        a5(0x11, Buffer.from([4])),
      ]),
    );
    expect(received).toEqual([Buffer.from([1, 2, 3]), Buffer.from([4])]);
  });

  it('rejects a missing door ACK, ignores a different command ACK and invalidates connection state', async () => {
    await door.close();
    holdDoorAck = true;
    const pending = door.open();
    const rejection = expect(pending).rejects.toThrow('Sin ACK');
    await jest.advanceTimersByTimeAsync(0);
    bus.emit('data', a5(0x20, Buffer.from([2])));
    await jest.advanceTimersByTimeAsync(2500);
    await rejection;
    expect(door.state).toBeNull();
    expect(serial.isConnected).toBe(false);
    await expect(door.open()).rejects.toThrow('Error serial');
  });

  it('chunks RFID payloads at 64 bytes with A5 XOR checksums', async () => {
    respond = () => null;
    const payload = Buffer.from(Array.from({ length: 130 }, (_, i) => i));
    await serial.sendRfid(payload);
    expect(writes.map((frame) => frame[2])).toEqual([64, 64, 2]);
    expect(Buffer.concat(writes.map((frame) => frame.subarray(3, -1)))).toEqual(
      payload,
    );
    for (const frame of writes)
      expect(frame.subarray(1).reduce((sum, byte) => sum ^ byte, 0)).toBe(0);
  });

  it('parses EPC, antenna and raw RSSI and exposes counts and CSV without a GUI', async () => {
    const tags = await reader.inventory();
    expect(writes[0].subarray(3, -1).toString('hex')).toBe('a004018901d1');
    expect(tags).toEqual([{ epc, antenna: 3, rssiRaw: 0x91 }]);
    await reader.inventory();
    expect(reader.getStatistics()).toEqual({
      unique: 1,
      total: 2,
      rounds: 2,
      readsPerSecond: 0.4,
    });
    expect(reader.getRecords()[0].count).toBe(2);
    expect(reader.exportReadingsCsv()).toContain(`${epc},2,3,145,0x91`);
    reader.clearReadings();
    expect(reader.getStatistics().total).toBe(0);
  });

  it('reads common/per-antenna power, changes only the selected antenna and skips unchanged writes', async () => {
    const applying = reader.setPower(2, 25);
    await jest.advanceTimersByTimeAsync(200);
    await expect(applying).resolves.toEqual([20, 25, 22, 23]);
    expect(commands()).toEqual([0x77, 0x76, 0x77]);
    await reader.setPower(2, 25);
    expect(commands().filter((command) => command === 0x76)).toHaveLength(1);
    respond = (command) => a0(command, Buffer.from([19]));
    await expect(reader.getPower()).resolves.toEqual([19, 19, 19, 19]);
    expect(() => reader.setPower(1, 34)).toThrow('5 y 30');
  });

  it('verifies the EPC filter on both set and clear', async () => {
    await reader.setFilter(epc);
    await expect(reader.getFilter()).resolves.toBe(epc);
    await reader.clearFilter();
    await expect(reader.getFilter()).resolves.toBeNull();
    expect(commands()).toEqual([0x85, 0x86, 0x86, 0x85, 0x86, 0x86]);
  });

  it('decodes signed temperatures, records history, evaluates thresholds and exports CSV', async () => {
    const alerts = jest.fn();
    reader.events.on('temperatureAlert', alerts);
    reader.setTemperatureThreshold(-10);
    await expect(reader.getTemperature(2)).resolves.toMatchObject({
      celsius: -9,
      antenna: 2,
      inventoryActive: false,
      powerDbm: null,
    });
    expect(alerts).toHaveBeenCalledWith({
      active: true,
      celsius: -9,
      threshold: -10,
    });
    expect(reader.getTemperatureHistory()).toHaveLength(1);
    expect(reader.exportTemperatureCsv()).toContain(',-9,detenido,2,');
    respond = (command) => a0(command, Buffer.from([0, 43]));
    await expect(reader.getTemperature()).resolves.toMatchObject({
      celsius: 43,
    });
  });

  it('rejects unsupported/malformed temperature responses and pauses automatic monitoring', async () => {
    respond = (command) => a0(command, Buffer.from([0x10]));
    const error = once(reader.events, 'temperatureError');
    reader.startTemperatureMonitoring(1);
    await expect(error).resolves.toEqual([
      expect.stringContaining('no es una temperatura'),
    ]);
    await jest.advanceTimersByTimeAsync(5000);
    expect(commands()).toEqual([0x7b]);
    expect(reader.getTemperatureHistory()).toHaveLength(0);
    respond = (command) => a0(command, Buffer.from([2, 30]));
    await expect(reader.getTemperature()).rejects.toThrow('signo');
  });

  it('waits for the end of the inventory round before temperature and before stopping', async () => {
    holdInventory = true;
    reader.startInventory({ antenna: 2, pauseMs: 100 });
    await jest.advanceTimersByTimeAsync(0);
    expect(commands()).toEqual([0x74, 0x89]);
    const temperature = reader.getTemperature(2);
    const stop = reader.stopInventory();
    await jest.advanceTimersByTimeAsync(0);
    expect(commands()).toEqual([0x74, 0x89]);
    injectRfid(inventoryFrames());
    await stop;
    await expect(temperature).resolves.toMatchObject({ celsius: -9 });
    expect(commands()).toEqual([0x74, 0x89, 0x7b]);
  });

  it('blocks subsequent RFID operations if the round summary never arrives', async () => {
    holdInventory = true;
    const result = reader.inventory();
    const rejection = expect(result).rejects.toThrow('fin de ronda');
    await jest.advanceTimersByTimeAsync(6000);
    await rejection;
    await expect(reader.getPower()).rejects.toThrow('reconectá');
  });

  it('queues automatic temperature measurement during a round and sends it after the summary', async () => {
    holdInventory = true;
    reader.startInventory();
    await jest.advanceTimersByTimeAsync(0);
    reader.startTemperatureMonitoring(1);
    await jest.advanceTimersByTimeAsync(1000);
    expect(commands()).toEqual([0x74, 0x89]);
    const measured = once(reader.events, 'temperatureValue');
    const stopped = reader.stopInventory();
    injectRfid(inventoryFrames());
    await measured;
    await stopped;
    reader.stopTemperatureMonitoring();
    expect(commands()).toEqual([0x74, 0x89, 0x7b]);
  });

  it('resynchronizes fragmented A0 packets and ignores other reader addresses', async () => {
    respond = () => null;
    const pending = reader.getPower();
    await jest.advanceTimersByTimeAsync(0);
    injectRfid(a0(0x77, Buffer.from([10]), 2));
    const response = a0(0x77, Buffer.from([18]));
    injectRfid(response.subarray(0, 2));
    injectRfid(response.subarray(2));
    await expect(pending).resolves.toEqual([18, 18, 18, 18]);
  });

  it('does not confirm power from a corrupted stream even if a valid packet follows', async () => {
    respond = () => null;
    const pending = reader.getPower();
    await jest.advanceTimersByTimeAsync(0);
    const corrupt = a0(0x77, Buffer.from([20]));
    corrupt[corrupt.length - 1] ^= 1;
    injectRfid(Buffer.concat([corrupt, a0(0x77, Buffer.from([20]))]));
    await expect(pending).rejects.toThrow('Checksum');
  });

  it('writes only changed Words 2–7, verifies each intermediate EPC and redacts passwords', async () => {
    const diagnostics: string[] = [];
    reader.events.on('diagnostic', (message: string) =>
      diagnostics.push(message),
    );
    const next = 'AABB33445566778899AA1234';
    const result = await reader.writeEpc({
      currentEpc: epc,
      newEpc: next,
      antenna: 1,
      password: 'DEADBEEF',
    });
    expect(result.epc).toBe(next);
    const writeCommands = writes
      .filter((frame) => frame[6] === 0x82)
      .map((frame) => frame.subarray(3, -1));
    expect(writeCommands).toHaveLength(2);
    expect(writeCommands[0].subarray(4, -1).toString('hex')).toBe(
      'deadbeef010201aabb',
    );
    expect(writeCommands[1].subarray(4, -1).toString('hex')).toBe(
      'deadbeef0107011234',
    );
    expect(filter).toBeNull();
    expect(diagnostics.join('\n').toUpperCase()).not.toContain('DEADBEEF');
    expect(diagnostics.join('\n')).toContain('** ** ** **');
  });

  it('does not write when EPC is unchanged and still verifies the tag and clears filters', async () => {
    await reader.writeEpc({ currentEpc: epc, newEpc: epc, antenna: 1 });
    expect(commands()).not.toContain(0x82);
    expect(commands().filter((command) => command === 0x89)).toHaveLength(2);
    expect(filter).toBeNull();
  });

  it('refuses writes when multiple EPCs are present', async () => {
    multipleTags = true;
    await expect(
      reader.writeEpc({
        currentEpc: epc,
        newEpc: 'AABB33445566778899AABBCC',
        antenna: 1,
      }),
    ).rejects.toThrow('únicamente');
    expect(commands()).not.toContain(0x82);
    expect(filter).toBeNull();
  });

  it('verifies a write after a missing ACK without retrying it', async () => {
    noWriteAck = true;
    const pending = reader.writeEpc({
      currentEpc: epc,
      newEpc: 'AABB33445566778899AABBCC',
      antenna: 1,
    });
    await jest.advanceTimersByTimeAsync(2500);
    await expect(pending).resolves.toMatchObject({
      epc: 'AABB33445566778899AABBCC',
    });
    expect(commands().filter((command) => command === 0x82)).toHaveLength(1);
  });

  it('reports the last verified EPC after an explicit write rejection and cleans up the filter', async () => {
    rejectWrite = true;
    await expect(
      reader.writeEpc({
        currentEpc: epc,
        newEpc: 'AABB33445566778899AABBCC',
        antenna: 1,
      }),
    ).rejects.toThrow(`Último EPC verificado: ${epc}`);
    expect(commands().filter((command) => command === 0x82)).toHaveLength(1);
    expect(filter).toBeNull();
  });

  it('rejects an interrupted request promptly and requires a fresh connection', async () => {
    respond = () => null;
    const pending = reader.getPower();
    await jest.advanceTimersByTimeAsync(0);
    bus.emit('error', new Error('Driver failure'));
    await expect(pending).rejects.toThrow('transporte');
    expect(serial.isConnected).toBe(false);
    await expect(reader.getPower()).rejects.toThrow('reconectá');
  });

  it('reconnects through SerialService and restores reader operations after a failed round', async () => {
    holdInventory = true;
    const pending = expect(reader.inventory()).rejects.toThrow('fin de ronda');
    await jest.advanceTimersByTimeAsync(6000);
    await pending;
    await serial.disconnect();
    // Una nueva instancia de SerialPort tiene un emisor nuevo. El fixture
    // reutiliza el bus, por lo que se descartan los listeners del puerto anterior.
    bus.removeAllListeners();
    const connecting = serial.connect('/dev/test-esp32');
    await jest.advanceTimersByTimeAsync(2500);
    await connecting;
    await expect(reader.getPower()).resolves.toEqual([20, 21, 22, 23]);
    expect(SerialPort).toHaveBeenCalledTimes(2);
  });

  it('stopAllOperations waits for a temperature request already in progress', async () => {
    respond = () => null;
    const temperature = reader.getTemperature();
    await jest.advanceTimersByTimeAsync(0);
    let stopped = false;
    const stop = reader.stopAllOperations().then(() => {
      stopped = true;
    });
    await jest.advanceTimersByTimeAsync(0);
    expect(stopped).toBe(false);
    injectRfid(a0(0x7b, Buffer.from([0, 25])));
    await temperature;
    await stop;
    expect(stopped).toBe(true);
  });
});
