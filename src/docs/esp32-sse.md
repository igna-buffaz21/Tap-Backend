# Integración automática de RFID con SSE

El frontend mantiene una conexión autenticada a `GET /esp32/sensor/events`.
Cuando recibe `sensor` con `ready: true`, llama a `POST /esp32/run-flow`, sin
body. El POST devuelve los productos cuando termina el ciclo. No hace falta
consultar periódicamente `GET /esp32/sensor`; ese endpoint queda disponible como
consulta puntual.

Ambas rutas usan `Authorization: Bearer <token>`. En el navegador, usar `fetch`
para consumir SSE: `EventSource` nativo no admite ese header. No poner el token
en la URL.

## Eventos

```text
event: sensor
data: {"detected":true,"confirmed":true,"ready":true,"busy":false}

event: flow
data: {"stage":"reading"}

event: heartbeat
data: {}

```

- `sensor`: estado actual al conectar y cada vez que cambia. `detected` puede
  ser `null` hasta recibir información del firmware. `confirmed` se activa
  tras 1 segundo continuo de detección. `ready` indica una detección confirmada,
  sin procesar y con el lector libre. El frontend debe iniciar el POST solo
  por `ready`, no por `detected`.
- `flow`: etapas `opening`, `waitingForObject` (flujo de consola), `holding`,
  `closing`, `reading`, `reopening`, `completed` o `failed`. `completed` indica
  que terminó la operación del hardware; esperar la respuesta del POST para
  obtener los productos. Este evento no contiene EPC ni datos de productos.
- `heartbeat`: cada 15 segundos para mantener activa la conexión; no consulta
  nuevamente el sensor ni inicia operaciones.
- `hardwareError`: contiene `{ "message": "..." }` y después se cierra el
  stream. Mostrar el problema y reconectar el stream cuando corresponda.

El backend evita ejecuciones simultáneas y consume cada detección una sola vez.
Para habilitar otra detección debe recibirse ausencia y luego nueva presencia.
Un fallo de un flujo ya aceptado también consume esa detección: retirar y
volver a colocar el objeto permite iniciar otra.

El POST espera 3 segundos, cierra, lee RFID durante 5 segundos (terminando la
ronda pendiente), reabre y responde con el contrato existente:

```json
{
  "products": [
    { "epc": "CAFE00000001000000000002", "product": null }
  ],
  "total": 1,
  "door": "open"
}
```

`product` es el producto completo del negocio autenticado, o `null` si no hay
coincidencia. `409` significa que está ocupado o la detección ya no está
disponible; `503` indica fallo de hardware. No repetir automáticamente un POST
fallido: pudo haberse ejecutado aunque el navegador no recibiera la respuesta.

## Ejemplo de cliente sin dependencias

El ejemplo abre el stream al montar la pantalla, renueva el token en cada
conexión y antes del POST, procesa mensajes fragmentados y reconecta después de
un corte. Los eventos recibidos durante el POST se siguen procesando para no
perder una nueva detección. Las reconexiones se hacen solamente si el stream
se corta; no hay polling del sensor.

```js
function startAutomaticRfid({
  baseUrl,
  getToken,
  onSensor,
  onProgress,
  onResult,
  onError,
}) {
  const controller = new AbortController();
  const { signal } = controller;
  const api = baseUrl.replace(/\/$/, "");
  let running = false;
  let latest = null;

  async function startFlowIfReady() {
    if (signal.aborted || running || !latest?.ready) return;
    running = true;
    latest = { ...latest, ready: false };
    let succeeded = false;
    try {
      const token = await getToken();
      if (!token) throw new Error("Iniciá sesión para usar el lector.");
      if (signal.aborted) return;
      const response = await fetch(`${api}/esp32/run-flow`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 409) return;
      if (!response.ok) throw new Error(`El flujo falló: HTTP ${response.status}`);
      const result = await response.json();
      succeeded = true;
      if (!signal.aborted) onResult(result);
    } catch (error) {
      if (!signal.aborted) onError(error);
    } finally {
      running = false;
      // Si apareció otro objeto mientras terminaba el POST, atenderlo ahora.
      // Después de un fallo, esperar un nuevo evento, sin reintentar el POST.
      if (succeeded) void startFlowIfReady();
    }
  }

  function handleEvent(frame) {
    let type = "message";
    const data = [];
    for (const line of frame.split("\n")) {
      if (line.startsWith("event:")) type = line.slice(6).trim();
      if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
    }
    if (!data.length) return;
    const payload = JSON.parse(data.join("\n"));
    if (type === "sensor") {
      latest = payload;
      onSensor(payload);
      void startFlowIfReady();
    } else if (type === "flow") {
      onProgress(payload.stage);
    } else if (type === "hardwareError") {
      throw new Error(payload.message);
    }
  }

  async function connect() {
    while (!signal.aborted) {
      let reader;
      try {
        const token = await getToken();
        if (!token) throw new Error("Iniciá sesión para usar el lector.");
        const response = await fetch(`${api}/esp32/sensor/events`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "text/event-stream",
          },
          cache: "no-store",
          signal,
        });
        if (!response.ok || !response.body) {
          if (response.status === 401 || response.status === 403) {
            onError(new Error("Revisá la sesión y los permisos del usuario."));
            return;
          }
          throw new Error(`No se pudo abrir SSE: HTTP ${response.status}`);
        }
        reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = "";
        while (!signal.aborted) {
          const { done, value } = await reader.read();
          if (done) throw new Error("Se cortó la conexión SSE.");
          buffer = (buffer + value).replace(/\r\n/g, "\n");
          let end;
          while ((end = buffer.indexOf("\n\n")) !== -1) {
            const frame = buffer.slice(0, end);
            buffer = buffer.slice(end + 2);
            handleEvent(frame);
          }
        }
      } catch (error) {
        if (signal.aborted) return;
        latest = null;
        onError(error);
      } finally {
        await reader?.cancel().catch(() => {});
        reader?.releaseLock();
      }
      if (!signal.aborted) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  void connect();
  return () => controller.abort();
}
```

Uso en React con Clerk (el helper anterior puede vivir en un archivo del frontend):

```jsx
const { getToken } = useAuth();

useEffect(() => {
  return startAutomaticRfid({
    baseUrl: API_URL,
    getToken,
    onSensor: setSensor,
    onProgress: setStage,
    onResult: setResult,
    onError: (error) => setError(error.message),
  });
}, [getToken]);
```

Montar la conexión solo después de que la sesión esté lista. Desmontar la
pantalla cancela el stream; no cancela un flujo ya enviado por POST. Reabrir
el stream entrega el estado actual, sin reproducir el historial de eventos.
El puerto serial se comparte entre las conexiones SSE y se mantiene abierto
cuando una pestaña se desconecta.

La conexión SSE no mueve la puerta. El firmware actual informa cambios del
sensor: al iniciar puede aparecer `detected: null` hasta el primer cambio.
Si hay un proxy delante del backend, configurar esa ruta sin buffering y con
tiempo de lectura suficiente para una conexión persistente. El backend envía
`X-Accel-Buffering: no` y `Cache-Control: no-cache, no-transform`.
