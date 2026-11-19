import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Esp32Module } from '../../modules/esp32/esp32.module';
import { SensorService } from '../../modules/esp32/services/sensor.service';
import { SerialService } from '../../modules/esp32/services/serial.service';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(Esp32Module, {
    logger: false,
  });
  const serial = app.get(SerialService);
  const sensor = app.get(SensorService);
  let stop!: () => void;
  const stopped = new Promise<void>((resolve) => {
    stop = resolve;
  });
  const showState = (state: boolean | null) => {
    console.log(
      state === null
        ? 'Estado desconocido. Esperando un cambio del sensor…'
        : state
          ? 'OBJETO DETECTADO'
          : 'SIN OBJETO',
    );
  };
  const onError = () => {
    console.error('Error del puerto serial.');
    process.exitCode = 1;
    stop();
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  sensor.events.on('change', showState);
  serial.events.on('transportError', onError);
  serial.events.on('disconnected', stop);
  try {
    let path = process.argv[2];
    if (!path) {
      const ports = await serial.listPorts();
      const candidates = ports.filter(
        (port) =>
          port.vendorId || /^(\/dev\/(ttyUSB|ttyACM)|COM\d+$)/i.test(port.path),
      );
      if (candidates.length !== 1)
        throw new Error(
          'Indicá el puerto: npm run esp32:sensor -- /dev/ttyUSB0 (Windows: COM3).',
        );
      path = candidates[0].path;
    }
    console.log(`Conectando a ${path}…`);
    await serial.connect(path);
    console.log('Monitor del sensor activo. Ctrl+C para salir.');
    showState(sensor.state);
    await stopped;
  } finally {
    process.off('SIGINT', stop);
    process.off('SIGTERM', stop);
    sensor.events.off('change', showState);
    serial.events.off('transportError', onError);
    serial.events.off('disconnected', stop);
    await app.close();
  }
}

if (require.main === module) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Error del sensor.');
    process.exitCode = 1;
  });
}
