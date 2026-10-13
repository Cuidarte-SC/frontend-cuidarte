# frontend-cuidarte

SPA de **Cuidarte+**, el sistema de exámenes médicos del Caso B (ISY1102). Está construida con React 18, Vite y Tailwind CSS 4, y la sirve nginx por HTTPS.

**Versión bajo prueba EP02:** `v1.1.0`.

## Cómo levantarlo

Desde `infra-cuidarte`, con los repos como carpetas hermanas:

```powershell
docker compose --profile app up -d --build frontend
```

Abre **https://localhost:8443**. El certificado es autofirmado (ambiente QA), así que el navegador mostrará una advertencia: elige *Avanzado* → *Continuar*. Después de reconstruir, recarga con **Ctrl + F5** para no usar la versión en caché.

## Pantallas (ERS 3.1.1)

| Pantalla | Ruta | Roles | Requerimiento |
|---|---|---|---|
| Inicio de sesión | `/login` | público | RF-1.1 |
| Registro | `/registro` | público (visitante) | RF-2.1 |
| Inicio según rol | `/` | autenticado | ERS 3.1.1 (dashboard según rol) |
| Gestión de Pacientes | `/pacientes` | admin, médico | RF-2.2, RF-2.4 |
| Ficha, exámenes y documentos | `/pacientes/:id` | admin y médico (todas), paciente (solo la propia) | RF-2.3, RF-3, RF-4, RB-1, NFR-USAB-4 |
| Gestión de Usuarios | `/usuarios` | admin | RF-2.5, RF-2.6, RF-2.7 |
| Auditoría | `/auditoria` | admin | RF-5 |

Toda eliminación (examen, documento o usuario) pide **confirmación** antes de ejecutarse (RF-3.3).

## Accesibilidad (NFR-USAB, WCAG 2.1 AA)

- Texto base de 16 px, nunca menor a 12 px; contraste mínimo de 4.5:1.
- Botones y campos de al menos 44×44 px (tamaño táctil).
- Cada campo tiene su `label` asociado; los errores se anuncian con `role="alert"` y se vinculan con `aria-describedby`.
- Foco visible, enlace "Saltar al contenido" y navegación completa con Tab y Shift+Tab.
- Diseño en una columna en móvil (375 px), sin scroll horizontal.

## Seguridad

- HTTPS con TLS 1.2/1.3; el puerto 80 redirige a 443.
- Cabeceras CSP, HSTS, `X-Frame-Options`, `nosniff` y `Referrer-Policy`.
- La sesión se guarda en `sessionStorage` (se borra al cerrar la pestaña). El token de acceso dura 15 minutos y se **renueva automáticamente** con el refresh token (RF-1.2); si este vence o se revoca, la sesión se cierra.
- La SPA solo ordena la navegación: el control de acceso real lo aplica la API (NFR-SEG-4).

## Desviaciones respecto del ERS §4.1

El ERS menciona React 19.1.1, Material UI 7.3.4, Tailwind 3.4.14 y axios 1.13.1. Esta versión usa React 18, Tailwind 4, componentes propios accesibles (sin Material UI) y `fetch` nativo (sin axios). Es una desviación documentada que no afecta los requerimientos funcionales.

## Análisis estático y dependencias (sin Node instalado)

```powershell
docker run --rm -v "${PWD}:/app" -w /app node:20-alpine sh -c "npm ci --no-audit && npx eslint ."
docker run --rm -v "${PWD}:/app" -w /app node:20-alpine npm audit
```
