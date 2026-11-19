
#include <Arduino.h>
#include <ESP32Servo.h>

HardwareSerial RFID(2);
Servo servoPuerta;

// Configuración de pines
const int PIN_SERVO = 18;
const int PIN_RX_RFID = 16;
const int PIN_TX_RFID = 17;
const int PIN_SENSOR = 34;

// Posiciones
const int ANGULO_ABIERTO = 0;
const int ANGULO_CERRADO = 70;

// Protocolo serial
const uint8_t SOF = 0xA5;
const uint8_t CMD_ABRIR = 0x01;
const uint8_t CMD_CERRAR = 0x02;
const uint8_t CMD_RFID_TX = 0x10;
const uint8_t CMD_RFID_RX = 0x11;
const uint8_t CMD_SENSOR = 0x12;  // NUEVO
const uint8_t CMD_ACK = 0x20;

const uint8_t MAX_DATOS = 64;

uint8_t tipoRX = 0;
uint8_t longitudRX = 0;
uint8_t datosRX[MAX_DATOS];
uint8_t indiceRX = 0;
uint8_t checksumRX = 0;
uint8_t estadoRX = 0;

unsigned long ultimoByteRX = 0;

// Estado del sensor
int ultimoEstadoSensor = HIGH;
unsigned long ultimoCambioSensor = 0;
const unsigned long DEBOUNCE_SENSOR = 50;

// Control del servo
void abrirPuerta() {
  servoPuerta.write(ANGULO_ABIERTO);
}

void cerrarPuerta() {
  servoPuerta.write(ANGULO_CERRADO);
}

// Enviar trama a Python
void enviarTrama(uint8_t tipo, const uint8_t* datos,
                 uint8_t longitud) {
  uint8_t checksum = tipo ^ longitud;

  Serial.write(SOF);
  Serial.write(tipo);
  Serial.write(longitud);

  for (uint8_t i = 0; i < longitud; i++) {
    Serial.write(datos[i]);
    checksum ^= datos[i];
  }

  Serial.write(checksum);
}

// Procesar comando recibido
void procesarComando() {
  switch (tipoRX) {

    case CMD_ABRIR:
      if (longitudRX == 0) {
        abrirPuerta();
        uint8_t respuesta = CMD_ABRIR;
        enviarTrama(CMD_ACK, &respuesta, 1);
      }
      break;

    case CMD_CERRAR:
      if (longitudRX == 0) {
        cerrarPuerta();
        uint8_t respuesta = CMD_CERRAR;
        enviarTrama(CMD_ACK, &respuesta, 1);
      }
      break;

    case CMD_RFID_TX:
      RFID.write(datosRX, longitudRX);
      break;
  }
}

// Recibir tramas desde Python
void recibirPython() {
  while (Serial.available()) {
    uint8_t dato = Serial.read();
    ultimoByteRX = millis();

    switch (estadoRX) {
      case 0:
        if (dato == SOF) {
          estadoRX = 1;
        }
        break;

      case 1:
        tipoRX = dato;
        checksumRX = dato;
        estadoRX = 2;
        break;

      case 2:
        longitudRX = dato;
        checksumRX ^= dato;
        indiceRX = 0;

        if (longitudRX > MAX_DATOS) {
          estadoRX = 0;
        } else {
          estadoRX = longitudRX == 0 ? 4 : 3;
        }
        break;

      case 3:
        datosRX[indiceRX++] = dato;
        checksumRX ^= dato;

        if (indiceRX >= longitudRX) {
          estadoRX = 4;
        }
        break;

      case 4:
        if (dato == checksumRX) {
          procesarComando();
        }
        estadoRX = 0;
        break;

      default:
        estadoRX = 0;
        break;
    }
  }

  if (estadoRX != 0 &&
      millis() - ultimoByteRX > 500) {
    estadoRX = 0;
  }
}

// Recibir datos del lector RFID
void recibirRFID() {
  uint8_t buffer[MAX_DATOS];
  uint8_t cantidad = 0;

  while (RFID.available() && cantidad < MAX_DATOS) {
    buffer[cantidad++] = RFID.read();
  }

  if (cantidad > 0) {
    enviarTrama(CMD_RFID_RX, buffer, cantidad);
  }
}

void revisarSensor() {
  static bool objetoDetectado = false;
  static bool ultimaLectura = false;
  static unsigned long ultimoCambio = 0;

  // Leer sensor analógico
  int valorADC = analogRead(PIN_SENSOR);

  // Umbral entre 0V y 1.79V
  bool deteccion = (valorADC < 1000);

  // Detectar cambios
  if (deteccion != ultimaLectura) {
    ultimoCambio = millis();
  }

  // Confirmar estado estable durante 150 ms
  if (millis() - ultimoCambio >= 150) {
    if (deteccion != objetoDetectado) {
      objetoDetectado = deteccion;

      if (objetoDetectado) {
        Serial.println("OBJETO DETECTADO");
      } else {
        Serial.println("SIN OBJETO");
      }
    }
  }

  ultimaLectura = deteccion;
}

void setup() {
  Serial.begin(115200);

  RFID.begin(
    115200,
    SERIAL_8N1,
    PIN_RX_RFID,
    PIN_TX_RFID
  );

  servoPuerta.setPeriodHertz(50);
  servoPuerta.attach(PIN_SERVO, 500, 2400);

  // NUEVO: configurar sensor
  pinMode(PIN_SENSOR, INPUT);

  ultimoEstadoSensor = digitalRead(PIN_SENSOR);

  // Estado inicial
  cerrarPuerta();
}

void loop() {
  recibirPython();
  recibirRFID();
  revisarSensor();  // NUEVO
}