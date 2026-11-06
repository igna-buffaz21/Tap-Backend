export const ESP32 = {
  baudRate: 115200,
  start: 0xa5,
  maxPayload: 64,
  openDoor: 0x01, //comando para abrir puerta
  closeDoor: 0x02, //comando para cerrar puerta
  rfidTx: 0x10,
  rfidRx: 0x11,
  ack: 0x20, //comando de confirmación del esp32 que se recibió la orden de abrir/cerrar puerta
  startupMs: 2500,
  timeoutMs: 2500,
  writeTimeoutMs: 1000,
} as const;

export const CM2000 = {
  address: 0x01,
  antenna: 0x74,
  inventory: 0x89,
  readPower: 0x77,
  setPower: 0x76,
  filter: 0x85,
  readFilter: 0x86,
  write: 0x82,
  temperature: 0x7b,
  minPower: 5,
  maxPower: 30,
  roundTimeoutMs: 6000,
} as const;
