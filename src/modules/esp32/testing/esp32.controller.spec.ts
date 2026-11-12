import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter } from 'node:events';
import { ConflictException, ServiceUnavailableException } from '@nestjs/common';
import { Esp32Module } from '../esp32.module';
import { DatabaseModule } from '../../../database/database.module';
import { DatabaseService } from '../../../database/database.service';
import { Esp32Controller } from '../esp32.controller';
import { Cm2000Service } from '../services/cm2000.service';
import { DoorService } from '../services/door.service';
import { SerialService } from '../services/serial.service';

describe('ESP32 controller with the shared reader service', () => {
  let module: TestingModule;
  let controller: Esp32Controller;
  let reader: Cm2000Service;
  const serial = {
    events: new EventEmitter(),
    isConnected: true,
    listPorts: jest.fn(),
    connect: jest.fn(),
  };
  const door = { state: 'open', open: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    module = await Test.createTestingModule({
      imports: [DatabaseModule, Esp32Module.forApi()],
    })
      .overrideProvider(DatabaseService)
      .useValue({ query: jest.fn() })
      .overrideProvider(SerialService)
      .useValue(serial)
      .overrideProvider(DoorService)
      .useValue(door)
      .compile();
    controller = module.get(Esp32Controller);
    reader = module.get(Cm2000Service);
    jest.spyOn(reader, 'stopAllOperations').mockResolvedValue(undefined);
    jest.useFakeTimers();
  });

  afterEach(async () => {
    await module.close();
    jest.useRealTimers();
    serial.events.removeAllListeners();
  });

  it('returns the unique tag from the module service after five seconds', async () => {
    const tag = { epc: 'E2000017221101441890ABCD', antenna: 4, rssiRaw: 100 };
    jest.spyOn(reader, 'startInventory').mockImplementation(() => {
      reader.events.emit('tag', tag);
    });
    const response = controller.readTag();
    await jest.advanceTimersByTimeAsync(5000);
    await expect(response).resolves.toEqual({ found: true, tag });
  });

  it('returns no tag if more than one EPC is detected', async () => {
    jest.spyOn(reader, 'startInventory').mockImplementation(() => {
      reader.events.emit('tag', { epc: 'ONE', antenna: 4, rssiRaw: 100 });
      reader.events.emit('tag', { epc: 'TWO', antenna: 4, rssiRaw: 100 });
    });
    const response = controller.readTag();
    await jest.advanceTimersByTimeAsync(5000);
    await expect(response).resolves.toEqual({ found: false, tag: null });
  });

  it('exposes concurrent requests as conflict errors', async () => {
    jest.spyOn(reader, 'startInventory').mockImplementation(() => undefined);
    const first = controller.readTag();
    await expect(controller.readTag()).rejects.toBeInstanceOf(
      ConflictException,
    );
    await jest.advanceTimersByTimeAsync(5000);
    await first;
  });

  it('exposes hardware failure as service unavailable', async () => {
    jest.spyOn(reader, 'startInventory').mockImplementation(() => {
      throw new Error('Hardware desconectado');
    });
    await expect(controller.readTag()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
