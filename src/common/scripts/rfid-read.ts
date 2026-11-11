import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Esp32Module } from '../../modules/esp32/esp32.module';
import { Cm2000Service } from '../../modules/esp32/services/cm2000.service';
import type { SingleTagReadResult } from '../../modules/esp32/types/esp32.types';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(Esp32Module, {
    logger: false,
  });
  const cancellation = new AbortController();
  const cancel = () => cancellation.abort();
  process.once('SIGINT', cancel);
  process.once('SIGTERM', cancel);
  let result: SingleTagReadResult;
  try {
    result = await app
      .get(Cm2000Service)
      .readSingleTag(process.argv[2], cancellation.signal);
  } finally {
    process.off('SIGINT', cancel);
    process.off('SIGTERM', cancel);
    await app.close();
  }
  process.stdout.write(JSON.stringify(result) + '\n');
}

if (require.main === module) {
  void main().catch((error: unknown) => {
    process.stdout.write(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : 'Error de lectura RFID.',
      }) + '\n',
    );
    process.exitCode = 1;
  });
}
