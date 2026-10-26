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
Los permisos temporales se limitan a su negocio; las rutas de superadmin siguen
restringidas. Debe existir un usuario activo para operar en este modo.

Para volver a exigir el token, configurar `AUTH_DISABLED=false` o eliminar la
variable y reiniciar el backend. El modo con token conserva la política actual:
los permisos por rol siguen pendientes de definición.

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
