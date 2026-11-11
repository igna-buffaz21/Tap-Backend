<p align="center">
  <a href="https://nestjs.com/" target="_blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
  </a>
</p>

<h1 align="center">Backend Base NestJS</h1>

<p align="center">
  Un backend base para tus proyectos, construido con NestJS y pensado como punto de partida sólido, ordenado y escalable.
</p>

<p align="center">
  Desarrollado por <strong>Ignacio Buffaz</strong>.
</p>

<p align="center">
  <a href="https://www.linkedin.com/in/ignacio-buffaz-9b707a276" target="_blank">
    <img src="https://img.shields.io/badge/LinkedIn-Ignacio%20Buffaz-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
  </a>
  <a href="https://wa.me/5493534133580" target="_blank">
    <img src="https://img.shields.io/badge/WhatsApp-Contactar-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="WhatsApp" />
  </a>
  <a href="mailto:ignaciobuffaz73@gmail.com" target="_blank">
    <img src="https://img.shields.io/badge/Email-ignaciobuffaz73%40gmail.com-EA4335?style=for-the-badge&logo=gmail&logoColor=white" alt="Email" />
  </a>
  <a href="https://ignaciobuffaz.vercel.app/" target="_blank">
    <img src="https://img.shields.io/badge/Portfolio-Ver%20sitio-111111?style=for-the-badge&logo=vercel&logoColor=white" alt="Portfolio" />
  </a>
</p>

## Sobre este proyecto

Este repositorio funciona como una base reutilizable para desarrollar APIs con NestJS. La idea es tener una estructura inicial prolija para crear nuevos proyectos sin empezar desde cero cada vez.

La documentación del proyecto se encuentra en `src/docs`:

- [Puesta en marcha](src/docs/puesta-en-marcha.md)
- [Estructura del proyecto](src/docs/estructura-del-proyecto.md)

## Autenticación temporal

Con `AUTH_DISABLED=true` en `.env`, la API no exige token ni consulta Clerk.
Usa el primer usuario activo de `app_user` cuyo negocio también esté activo.
Opcionalmente, `AUTH_DEV_USER_ID` permite seleccionar un usuario existente.
El acceso se limita al negocio del usuario seleccionado. Debe existir un usuario
activo para operar en este modo.

Para volver a exigir el token, configurar `AUTH_DISABLED=false` o eliminar la
variable y reiniciar el backend. En ambos modos, el acceso se valida por negocio:
los usuarios pueden operar sobre los recursos y sucursales de su propio negocio.

## Lectura RFID en una ejecución

Con el ESP32 y el lector CM2000 conectados, ejecutar:

```bash
npm run --silent esp32:read -- /dev/ttyUSB0
```

El puerto puede omitirse si hay un único dispositivo serial candidato. El comando
envía la apertura si el último estado confirmado no es abierto y busca en ANT4
durante 5 segundos completos. Solo devuelve una etiqueta si detecta exactamente
un EPC distinto durante ese intervalo; las lecturas repetidas del mismo EPC cuentan
como una sola etiqueta. Termina dejando la puerta abierta:

```json
{"found":true,"tag":{"epc":"E2000017221101441890ABCD","antenna":4,"rssiRaw":100}}
```

Con cero o varias etiquetas devuelve `{"found":false,"tag":null}`. Ante un fallo devuelve
`{"error":"Descripción del fallo"}` y termina con código 1. La salida estándar
contiene únicamente el JSON. La conexión y el fin de la ronda RFID pendiente
pueden sumar tiempo a los 5 segundos de búsqueda.

El firmware actual no consulta un sensor de posición: el estado corresponde al
último comando confirmado por ACK. Las constantes de apertura/cierre del backend
están invertidas respecto del archivo `src/modules/esp32/firmware/esp32.ino`;
este comando conserva la configuración de las consolas existentes. La apertura
física depende del firmware cargado y debe comprobarse en el dispositivo.

### Lectura desde el frontend

`POST /esp32/read-tag` ejecuta la misma lectura y devuelve `200 OK` con el JSON
anterior. No recibe body ni parámetros; usa el único ESP32 local conectado a la PC
del backend. Requiere la autenticación habitual de la API y no necesita
`ESP32_BUSINESS_ID`.

```js
const response = await fetch(`${API_URL}/esp32/read-tag`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
});
const result = await response.json();
```

Devuelve `409 Conflict` si ya hay una lectura u operación RFID en curso y
`503 Service Unavailable` si falla la conexión, la apertura o el lector.
La consola y el endpoint comparten la implementación de `Cm2000Service`;
no se inicia un proceso de consola por cada petición. La conexión USB permanece
abierta para reutilizarla. Ejecutar la consola en otro proceso requiere liberar
primero el puerto que usa el backend.

## Tecnologías principales

- NestJS
- TypeScript
- PostgreSQL
- Swagger
- ESLint y Prettier

## Autor

**Ignacio Buffaz**  
Backend developer

---

<p align="center">
  Hecho para construir más rápido, con una base simple y fácil de extender.
</p>
