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

  async function executeFlow(): Promise<void> {
    const onProgress = (progress: RfidFlowProgress) => {
      switch (progress.stage) {
        case 'opening':
          console.log('Abriendo puerta…');
          break;
        case 'holding':
          console.log('Puerta abierta confirmada. Esperando 10 segundos…');
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
      await reader.runFlow(cancellation.signal);
      console.log('\n===== FLUJO FINALIZADO =====\n\nPuerta: ABIERTA');
    } finally {
      reader.events.off('flowProgress', onProgress);
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
          if (!serial.isConnected)
            await reader.ensureConnected(undefined, cancellation.signal);
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
