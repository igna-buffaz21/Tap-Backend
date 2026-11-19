import { SensorService } from '../services/sensor.service';
import { SerialService } from '../services/serial.service';

describe('SensorService over the shared A5 protocol', () => {
  let serial: SerialService;
  let sensor: SensorService;
  let changes: jest.Mock;

  function receive(data: Buffer): void {
    const decode = Reflect.get(serial, 'decode') as (data: Buffer) => void;
    decode.call(serial, data);
  }

  beforeEach(() => {
    jest.useFakeTimers();
    serial = new SerialService();
    sensor = new SensorService(serial);
    changes = jest.fn();
    sensor.events.on('change', changes);
  });

  afterEach(() => {
    sensor.onModuleDestroy();
    jest.useRealTimers();
  });

  it('confirms the full stable second and consumes each detection only once', async () => {
    expect(sensor.confirmed).toBe(false);
    expect(sensor.ready).toBe(false);
    receive(Buffer.from('a512010112', 'hex'));
    await jest.advanceTimersByTimeAsync(999);
    expect(sensor.ready).toBe(false);
    expect(() => sensor.consumeDetection()).toThrow('detección estable');
    await jest.advanceTimersByTimeAsync(1);
    expect(sensor.confirmed).toBe(true);
    expect(sensor.ready).toBe(true);
    sensor.consumeDetection();
    expect(sensor.ready).toBe(false);
    expect(() => sensor.consumeDetection()).toThrow('detección estable');
    // Repetir el mismo estado no habilita nuevamente el flujo.
    receive(Buffer.from('a512010112', 'hex'));
    expect(sensor.ready).toBe(false);
    receive(Buffer.from('a512010013a512010112', 'hex'));
    await jest.advanceTimersByTimeAsync(1000);
    expect(sensor.ready).toBe(true);
  });

  it('restarts confirmation on a brief absence and forgets readiness on disconnect', async () => {
    receive(Buffer.from('a512010112', 'hex'));
    await jest.advanceTimersByTimeAsync(900);
    receive(Buffer.from('a512010013a512010112', 'hex'));
    await jest.advanceTimersByTimeAsync(999);
    expect(sensor.confirmed).toBe(false);
    await jest.advanceTimersByTimeAsync(1);
    expect(sensor.ready).toBe(true);
    serial.events.emit('disconnected');
    expect(sensor.state).toBeNull();
    expect(sensor.confirmed).toBe(false);
    expect(sensor.ready).toBe(false);
  });

  it('starts unknown and receives fragmented and concatenated sensor frames', () => {
    expect(sensor.state).toBeNull();
    // A5, CMD_SENSOR, longitud 1, estado 1, XOR 0x12.
    receive(Buffer.from('a51201', 'hex'));
    expect(changes).not.toHaveBeenCalled();
    receive(Buffer.from('0112', 'hex'));
    expect(sensor.state).toBe(true);
    receive(Buffer.from('a512010112a512010013', 'hex'));
    expect(sensor.state).toBe(false);
    expect(changes.mock.calls).toEqual([[true], [false]]);
  });

  it('routes RFID and ACK frames without changing the sensor state', () => {
    const onRfid = jest.fn();
    serial.events.on('rfid', onRfid);
    receive(Buffer.from('a511010111a520010120a512010013', 'hex'));
    expect(onRfid).toHaveBeenCalledWith(Buffer.from([1]));
    expect(changes.mock.calls).toEqual([[false]]);
  });

  it('ignores bad checksums, invalid lengths, invalid states and legacy text', () => {
    receive(Buffer.from('a512010000', 'hex')); // Checksum incorrecto.
    receive(Buffer.from('a5120012', 'hex')); // Sin estado.
    receive(Buffer.from('a51202010011', 'hex')); // Dos bytes de estado.
    receive(Buffer.from('a512010211', 'hex')); // Estado fuera de 0/1.
    receive(Buffer.from('OBJETO DETECTADO\r\n'));
    expect(sensor.state).toBeNull();
    expect(changes).not.toHaveBeenCalled();
    receive(Buffer.from('a512010112', 'hex'));
    expect(sensor.state).toBe(true);
  });

  it.each(['disconnected', 'transportError'])(
    'forgets the last state on %s and accepts the next reading',
    (event) => {
      receive(Buffer.from('a512010013', 'hex'));
      serial.events.emit(event);
      expect(sensor.state).toBeNull();
      receive(Buffer.from('a512010112', 'hex'));
      expect(changes.mock.calls).toEqual([[false], [null], [true]]);
    },
  );

  it('removes its listeners when destroyed', () => {
    sensor.onModuleDestroy();
    expect(serial.events.listenerCount('frame')).toBe(0);
    expect(serial.events.listenerCount('disconnected')).toBe(0);
    expect(serial.events.listenerCount('transportError')).toBe(0);
    receive(Buffer.from('a512010112', 'hex'));
    expect(changes).not.toHaveBeenCalled();
  });
});
