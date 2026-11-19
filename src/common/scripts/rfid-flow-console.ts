import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { createInterface, Interface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { Esp32Module } from '../../modules/esp32/esp32.module';
import { Cm2000Service } from '../../modules/esp32/services/cm2000.service';
import { DoorService } from '../../modules/esp32/services/door.service';
import { SerialService } from '../../modules/esp32/services/serial.service';
import type { RfidFlowProgress } from '../../modules/esp32/types/esp32.types';

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
  let exitRequested = false;
  const onLine = (line: string) => {
    if (line.trim() === '0') {
      exitRequested = true;
      cancel();
    }
  };
  const onTransportFailure = () =>
    cancellation.abort(new Error('Se perdió la comunicación con el ESP32.'));
  terminal.on('line', onLine);
  serial.events.on('disconnected', onTransportFailure);
  serial.events.on('transportError', onTransportFailure);

  async function executeFlow(requireClear: boolean): Promise<void> {
    const onProgress = (progress: RfidFlowProgress) => {
      switch (progress.stage) {
        case 'opening':
          console.log('Abriendo puerta…');
          break;
        case 'waitingForObject':
          console.log('Esperando un objeto estable durante 1 segundo…');
          break;
        case 'holding':
          console.log('Puerta abierta confirmada. Esperando 3 segundos…');
          break;
        case 'closing':
          console.log('Cerrando puerta…');
          break;
        case 'reading':
          console.log(
            'Puerta cerrada confirmada. Iniciando lectura RFID en ANT4…',
          );
          break;
        case 'reopening':
          console.log('\n===== INFORME DE LECTURA RFID =====\n');
          console.log('Duración de lectura: 5 segundos');
          console.log(`Total de EPC únicos: ${progress.epcs.length}\n`);
          console.log('EPC detectados:');
          progress.epcs.forEach((epc, index) =>
            console.log(`${index + 1}. ${epc}`),
          );
          console.log('\nAbriendo puerta…');
          break;
      }
    };
    reader.events.on('flowProgress', onProgress);
    try {
      await reader.runFlow(cancellation.signal, { requireClear });
      console.log('\n===== FLUJO FINALIZADO =====\n\nPuerta: ABIERTA');
    } finally {
      reader.events.off('flowProgress', onProgress);
    }
  }

  try {
    console.log(
      'Modo automático. Escribí 0 para cerrar y salir; Ctrl+C para detener.',
    );
    let requireClear = false;
    while (!cancellation.signal.aborted) {
      await executeFlow(requireClear);
      requireClear = true;
    }
  } catch (error) {
    if (
      !cancellation.signal.aborted ||
      (cancellation.signal.reason instanceof Error &&
        cancellation.signal.reason.name !== 'AbortError')
    ) {
      throw error;
    }
  } finally {
    cancel();
    terminal.off('close', cancel);
    terminal.off('SIGINT', cancel);
    terminal.off('line', onLine);
    serial.events.off('disconnected', onTransportFailure);
    serial.events.off('transportError', onTransportFailure);
    await reader.stopAllOperations();
    if (exitRequested) {
      console.log('Cerrando puerta antes de salir…');
      await door.close();
      console.log('Puerta cerrada confirmada. Saliendo.');
    }
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
