import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { createInterface, Interface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { Esp32Module } from '../../modules/esp32/esp32.module';
import { Cm2000Service } from '../../modules/esp32/services/cm2000.service';
import { DoorService } from '../../modules/esp32/services/door.service';
import { SerialService } from '../../modules/esp32/services/serial.service';
import type { TagReading } from '../../modules/esp32/types/esp32.types';

export async function runRfidFlowConsole(
  terminal: Interface,
  serial: SerialService,
  door: DoorService,
  reader: Cm2000Service,
): Promise<void> {
  const cancellation = new AbortController();
  const cancel = () => cancellation.abort();
  terminal.once('close', cancel);
  terminal.once('SIGINT', cancel);

  async function connectEsp32(): Promise<void> {
    if (serial.isConnected) return;
    const ports = await serial.listPorts();
    const candidates = ports.filter(
      (port) =>
        port.vendorId || /^(\/dev\/(ttyUSB|ttyACM)|COM\d+$)/i.test(port.path),
    );
    if (candidates.length !== 1)
      throw new Error(
        'Se necesita un único puerto USB serial disponible para conectar el ESP32.',
      );
    cancellation.signal.throwIfAborted();
    console.log('Conectando a', candidates[0].path);
    await serial.connect(candidates[0].path);
  }

  async function executeFlow(): Promise<void> {
    const flow = new AbortController();
    const abort = () => flow.abort(cancellation.signal.reason);
    const transportFailed = () =>
      flow.abort(new Error('Se perdió la comunicación con el ESP32.'));
    const epcs = new Set<string>();
    let readingUntil = 0;
    const onTag = (tag: TagReading) => {
      if (!flow.signal.aborted && performance.now() < readingUntil)
        epcs.add(tag.epc);
    };
    cancellation.signal.addEventListener('abort', abort, { once: true });
    serial.events.on('disconnected', transportFailed);
    serial.events.on('transportError', transportFailed);
    reader.events.on('tag', onTag);
    try {
      cancellation.signal.throwIfAborted();
      await connectEsp32();
      await reader.stopAllOperations();
      flow.signal.throwIfAborted();
      console.log('Abriendo puerta…');
      await door.open();
      flow.signal.throwIfAborted();
      console.log('Puerta abierta confirmada. Esperando 10 segundos…');
      await delay(10_000, undefined, { signal: flow.signal });
      flow.signal.throwIfAborted();
      await door.close();
      flow.signal.throwIfAborted();
      console.log('Puerta cerrada confirmada. Iniciando lectura RFID en ANT4…');
      await reader.selectAntenna(4);
      flow.signal.throwIfAborted();
      readingUntil = performance.now() + 5000;
      while (performance.now() < readingUntil) {
        flow.signal.throwIfAborted();
        // Completar cada ronda evita dejar respuestas pendientes antes de abrir.
        await reader.inventory();
        flow.signal.throwIfAborted();
        const remaining = readingUntil - performance.now();
        if (remaining > 0)
          await delay(Math.min(150, remaining), undefined, {
            signal: flow.signal,
          });
      }
      readingUntil = 0;
      flow.signal.throwIfAborted();
      console.log('\n===== INFORME DE LECTURA RFID =====\n');
      console.log('Duración de lectura: 5 segundos');
      console.log(`Total de EPC únicos: ${epcs.size}\n`);
      console.log('EPC detectados:');
      [...epcs].forEach((epc, index) => console.log(`${index + 1}. ${epc}`));
      console.log('\nAbriendo puerta…');
      await door.open();
      flow.signal.throwIfAborted();
      console.log('\n===== FLUJO FINALIZADO =====\n\nPuerta: ABIERTA');
    } finally {
      readingUntil = 0;
      reader.events.off('tag', onTag);
      serial.events.off('disconnected', transportFailed);
      serial.events.off('transportError', transportFailed);
      cancellation.signal.removeEventListener('abort', abort);
      await reader.stopAllOperations();
    }
  }

  try {
    while (!cancellation.signal.aborted) {
      console.log(
        '\n===== EJECUCIÓN RFID =====\n\n1 - Iniciar flujo\n0 - Salir\n',
      );
      let option = '';
      try {
        option = (
          await terminal.question('Seleccione una opción: ', {
            signal: cancellation.signal,
          })
        ).trim();
        cancellation.signal.throwIfAborted();
        if (option === '0') {
          await reader.stopAllOperations();
          await connectEsp32();
          cancellation.signal.throwIfAborted();
          console.log('Cerrando puerta antes de salir…');
          await door.close();
          console.log('Puerta cerrada confirmada. Saliendo.');
          return;
        }
        // Esperar todo el flujo antes de pedir otra opción impide superponer ejecuciones.
        if (option === '1') await executeFlow();
        else console.log('Opción inválida.');
      } catch (error) {
        console.error(
          option === '0'
            ? 'No se pudo confirmar el cierre; no se salió:'
            : 'Flujo detenido:',
          error instanceof Error ? error.message : 'Error desconocido.',
        );
        if (option !== '0')
          console.error(
            'El flujo no se completó. No se garantiza que la puerta esté abierta.',
          );
        if (cancellation.signal.aborted) return;
      }
    }
  } finally {
    terminal.off('close', cancel);
    terminal.off('SIGINT', cancel);
    await reader.stopAllOperations();
  }
}

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(Esp32Module, {
    logger: false,
  });
  const terminal = createInterface({ input: stdin, output: stdout });
  const close = () => terminal.close();
  process.once('SIGINT', close);
  process.once('SIGTERM', close);
  try {
    await runRfidFlowConsole(
      terminal,
      app.get(SerialService),
      app.get(DoorService),
      app.get(Cm2000Service),
    );
  } finally {
    terminal.close();
    process.off('SIGINT', close);
    process.off('SIGTERM', close);
    await app.close();
  }
}

if (require.main === module) {
  void main().catch(() => {
    console.error(
      'No se pudo iniciar o cerrar correctamente la consola de flujo RFID.',
    );
    process.exitCode = 1;
  });
}
