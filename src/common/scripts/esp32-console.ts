import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { createInterface, Interface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { Esp32Module } from '../../modules/esp32/esp32.module';
import { Cm2000Service } from '../../modules/esp32/services/cm2000.service';
import { DoorService } from '../../modules/esp32/services/door.service';
import { SerialService } from '../../modules/esp32/services/serial.service';

export async function runEsp32Console(
  terminal: Interface,
  serial: SerialService,
  door: DoorService,
  reader: Cm2000Service,
): Promise<void> {
  const cancellation = new AbortController();
  const cancel = () => cancellation.abort();
  terminal.once('close', cancel);
  terminal.once('SIGINT', cancel);
  const antenna = 4;

  async function ask(label: string, defaultValue?: string): Promise<string> {
    cancellation.signal.throwIfAborted();
    const suffix = defaultValue === undefined ? ': ' : ` [${defaultValue}]: `;
    const answer = await terminal.question(label + suffix, {
      signal: cancellation.signal,
    });
    cancellation.signal.throwIfAborted();
    return answer.trim() || defaultValue || '';
  }

  async function askNumber(
    label: string,
    defaultValue: number,
  ): Promise<number> {
    const value = Number(await ask(label, String(defaultValue)));
    if (!Number.isFinite(value)) throw new Error('Ingresá un número válido.');
    return value;
  }

  async function doorMenu(): Promise<void> {
    // Esta barrera también espera el fin de la última ronda y de las consultas
    // de temperatura ya encoladas, antes de habilitar cualquier orden de puerta.
    await reader.stopAllOperations();
    while (!cancellation.signal.aborted) {
      console.log(
        '\nPUERTA: 1 Abrir | 2 Cerrar | 3 Estado confirmado | 0 Volver',
      );
      const command = await ask('Opción');
      switch (command) {
        case '1':
          await door.open();
          console.log('ACK recibido: orden de apertura ejecutada.');
          break;
        case '2':
          await door.close();
          console.log('ACK recibido: orden de cierre ejecutada.');
          break;
        case '3':
          console.log('Último estado confirmado:', door.state ?? 'desconocido');
          break;
        case '0':
          return;
        default:
          console.log('Opción inválida.');
      }
    }
  }

  async function rfidMenu(): Promise<void> {
    try {
      await reader.stopAllOperations();
      await reader.selectAntenna(antenna);
      while (!cancellation.signal.aborted) {
        console.log(`\nRFID · ANT${antenna} · lectura EPC ${reader.isInventoryRunning ? 'activa' : 'detenida'}
1 Cambiar potencia | 2 Escribir EPC
3 ${reader.isInventoryRunning ? 'Detener' : 'Iniciar'} lectura EPC | 4 Temperatura
0 Volver (detiene RFID)`);
        const command = await ask('Opción');
        if (['1', '2'].includes(command)) {
          await reader.stopAllOperations();
          cancellation.signal.throwIfAborted();
        }
        switch (command) {
          case '1': {
            const power = await askNumber(
              `Potencia de ANT${antenna} en dBm (5–30)`,
              20,
            );
            console.log(
              'Potencias verificadas:',
              await reader.setPower(antenna, power),
            );
            break;
          }
          case '2': {
            const currentEpc = await ask(
              'EPC actual (24 caracteres hexadecimales)',
            );
            const newEpc = await ask('Nuevo EPC (24 caracteres hexadecimales)');
            if (
              (
                await ask('¿Confirmás la escritura del EPC? (s/N)', 'n')
              ).toLowerCase() !== 's'
            )
              break;
            const reading = await reader.writeEpc({
              currentEpc,
              newEpc,
              antenna,
              password: process.env.ESP32_ACCESS_PASSWORD ?? '00000000',
            });
            console.log('EPC final verificado:', reading.epc);
            break;
          }
          case '3':
            if (reader.isInventoryRunning) {
              await reader.stopAllOperations();
              console.log('Lectura EPC detenida.');
            } else {
              reader.startInventory({ antenna, pauseMs: 150 });
              console.log('Lectura EPC solicitada. Usá 3 o 0 para detenerla.');
            }
            break;
          case '4':
            await reader.getTemperature(antenna);
            break;
          case '0':
            return;
          default:
            console.log('Opción inválida.');
        }
      }
    } finally {
      // No se vuelve al menú principal mientras quede actividad RFID pendiente.
      await reader.stopAllOperations();
    }
  }

  const onTag = (reading: unknown) => console.log('\nEtiqueta:', reading);
  const onTemperature = (reading: unknown) =>
    console.log('\nTemperatura:', reading);
  const onError = (message: unknown) => console.error('\nRFID:', message);
  const onProgress = (progress: unknown) =>
    console.log('Escritura EPC:', progress);
  reader.events.on('tag', onTag);
  reader.events.on('temperatureValue', onTemperature);
  reader.events.on('operationError', onError);
  reader.events.on('temperatureError', onError);
  reader.events.on('writeProgress', onProgress);

  try {
    console.log('Consola ESP32 · RFID fijo en ANT4.');
    if (!serial.isConnected) {
      try {
        const ports = await serial.listPorts();
        const candidates = ports.filter(
          (port) =>
            port.vendorId ||
            /^(\/dev\/(ttyUSB|ttyACM)|COM\d+$)/i.test(port.path),
        );
        if (candidates.length !== 1) {
          throw new Error(
            candidates.length === 0
              ? 'No se encontró un puerto USB serial. Conectá el ESP32 y usá la opción 2.'
              : 'Hay varios puertos USB seriales. Elegí el del ESP32 con la opción 2.',
          );
        }
        cancellation.signal.throwIfAborted();
        console.log('Conectando automáticamente a', candidates[0].path);
        await serial.connect(candidates[0].path);
        console.log('Conectado.');
      } catch (error) {
        if (!cancellation.signal.aborted)
          console.error(
            'Conexión automática:',
            error instanceof Error ? error.message : 'No se pudo conectar.',
          );
      }
    }
    while (!cancellation.signal.aborted) {
      try {
        console.log(`\nESP32 · ${serial.isConnected ? 'conectado' : 'desconectado'}
1 Listar puertos USB | 2 Conectar | 3 Desconectar
4 Probar puerta     | 5 Probar RFID | 0 Salir`);
        const command = await ask('Opción');
        switch (command) {
          case '1':
            console.table(await serial.listPorts());
            break;
          case '2':
            await serial.connect(await ask('Puerto USB', '/dev/ttyUSB0'));
            console.log('Conectado.');
            break;
          case '3':
            await reader.stopAllOperations();
            await serial.disconnect();
            console.log('Desconectado.');
            break;
          case '4':
          case '5':
            if (!serial.isConnected)
              throw new Error('Conectá primero el puerto USB (opción 2).');
            if (command === '4') await doorMenu();
            else await rfidMenu();
            break;
          case '0':
            await reader.stopAllOperations();
            if (!serial.isConnected)
              throw new Error(
                'No se puede salir sin confirmar el cierre. Conectá el puerto USB (opción 2) y volvé a intentar.',
              );
            console.log('Cerrando puerta antes de salir…');
            await door.close();
            console.log('Puerta cerrada confirmada. Saliendo.');
            return;
          default:
            console.log('Opción inválida.');
        }
      } catch (error) {
        if (cancellation.signal.aborted) break;
        console.error(
          'Error:',
          error instanceof Error ? error.message : 'La operación falló.',
        );
      }
    }
  } finally {
    cancellation.abort();
    terminal.off('close', cancel);
    terminal.off('SIGINT', cancel);
    await reader.stopAllOperations();
    reader.events.off('tag', onTag);
    reader.events.off('temperatureValue', onTemperature);
    reader.events.off('operationError', onError);
    reader.events.off('temperatureError', onError);
    reader.events.off('writeProgress', onProgress);
  }
}

async function main(): Promise<void> {
  // Este contexto carga únicamente el hardware, sin servidor HTTP ni base de datos.
  const app = await NestFactory.createApplicationContext(Esp32Module, {
    logger: false,
  });
  const terminal = createInterface({ input: stdin, output: stdout });
  const closeTerminal = () => terminal.close();
  process.once('SIGINT', closeTerminal);
  process.once('SIGTERM', closeTerminal);
  try {
    await runEsp32Console(
      terminal,
      app.get(SerialService),
      app.get(DoorService),
      app.get(Cm2000Service),
    );
  } finally {
    terminal.close();
    process.off('SIGINT', closeTerminal);
    process.off('SIGTERM', closeTerminal);
    await app.close();
  }
}

if (require.main === module) {
  void main().catch(() => {
    console.error(
      'No se pudo iniciar o cerrar correctamente la consola ESP32.',
    );
    process.exitCode = 1;
  });
}
