import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { writeFile } from 'node:fs/promises';
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
  let antenna = 1;
  let diagnostics = false;

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
      while (!cancellation.signal.aborted) {
        console.log(`\nRFID · ANT${antenna} · inventario ${reader.isInventoryRunning ? 'activo' : 'detenido'}
 1 Seleccionar antena       2 Leer una ronda
 3 Inventario continuo      4 Detener toda actividad RFID
 5 Consultar potencias      6 Cambiar potencia
 7 Consultar filtro         8 Fijar filtro EPC
 9 Quitar filtro           10 Consultar temperatura
11 Temperatura automática  12 Detener temperatura automática
13 Umbral de temperatura   14 Historial de temperatura
15 Registros y estadísticas
16 Limpiar lecturas        17 Exportar lecturas CSV
18 Exportar temperaturas CSV
19 Escribir EPC            20 Activar/desactivar diagnóstico TX/RX
 0 Volver (detiene RFID)`);
        const command = await ask('Opción');
        // Estas funciones requieren inventario detenido. También se detiene el
        // monitoreo automático para ejecutar una prueba aislada y predecible.
        if (['1', '2', '5', '6', '7', '8', '9', '19'].includes(command)) {
          await reader.stopAllOperations();
          cancellation.signal.throwIfAborted();
        }
        switch (command) {
          case '1': {
            const selected = await askNumber('Antena (1–4)', antenna);
            await reader.selectAntenna(selected);
            antenna = selected;
            console.log(`ANT${antenna} confirmada.`);
            break;
          }
          case '2':
            await reader.selectAntenna(antenna);
            console.table(await reader.inventory());
            break;
          case '3': {
            const pauseMs = await askNumber(
              'Pausa entre rondas en ms (0–5000)',
              150,
            );
            reader.startInventory({ antenna, pauseMs });
            console.log('Inventario solicitado. Usá 4 o 0 para detenerlo.');
            break;
          }
          case '4':
            await reader.stopAllOperations();
            console.log('Actividad RFID detenida.');
            break;
          case '5':
            console.log('Potencias ANT1–ANT4 (dBm):', await reader.getPower());
            break;
          case '6': {
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
          case '7':
            console.log(
              'Filtro EPC:',
              (await reader.getFilter()) ?? 'desactivado',
            );
            break;
          case '8':
            await reader.setFilter(
              await ask('EPC del filtro (24 caracteres hexadecimales)'),
            );
            console.log('Filtro verificado.');
            break;
          case '9':
            await reader.clearFilter();
            console.log('Filtro eliminado y verificado.');
            break;
          case '10':
            await reader.getTemperature(antenna);
            break;
          case '11':
            reader.startTemperatureMonitoring(
              await askNumber('Intervalo en segundos (mínimo 1)', 5),
              antenna,
            );
            console.log('Monitoreo automático solicitado.');
            break;
          case '12':
            reader.stopTemperatureMonitoring();
            console.log('No se programarán nuevas consultas de temperatura.');
            break;
          case '13': {
            const threshold = await ask('Umbral en °C (vacío para desactivar)');
            reader.setTemperatureThreshold(
              threshold ? Number(threshold) : null,
            );
            console.log('Umbral actualizado.');
            break;
          }
          case '14':
            console.table(reader.getTemperatureHistory());
            break;
          case '15':
            console.table(reader.getRecords());
            console.log(reader.getStatistics());
            break;
          case '16':
            reader.clearReadings();
            console.log('Lecturas limpiadas.');
            break;
          case '17':
          case '18': {
            const path = await ask(
              'Ruta del archivo CSV nuevo',
              command === '17' ? 'rfid.csv' : 'temperatura.csv',
            );
            const csv =
              command === '17'
                ? reader.exportReadingsCsv()
                : reader.exportTemperatureCsv();
            await writeFile(path, csv, { encoding: 'utf8', flag: 'wx' });
            console.log('CSV guardado en', path);
            break;
          }
          case '19': {
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
          case '20':
            diagnostics = !diagnostics;
            console.log(
              'Diagnóstico:',
              diagnostics ? 'activado' : 'desactivado',
            );
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
  const onAlert = (alert: unknown) =>
    console.log('\nUmbral de temperatura:', alert);
  const onProgress = (progress: unknown) =>
    console.log('Escritura EPC:', progress);
  const onDiagnostic = (message: string) => {
    if (diagnostics) console.log(message);
  };
  reader.events.on('tag', onTag);
  reader.events.on('temperatureValue', onTemperature);
  reader.events.on('operationError', onError);
  reader.events.on('temperatureError', onError);
  reader.events.on('temperatureAlert', onAlert);
  reader.events.on('writeProgress', onProgress);
  reader.events.on('diagnostic', onDiagnostic);

  try {
    console.log('Consola ESP32. Elegí un puerto y conectalo antes de probar.');
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
    reader.events.off('temperatureAlert', onAlert);
    reader.events.off('writeProgress', onProgress);
    reader.events.off('diagnostic', onDiagnostic);
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
