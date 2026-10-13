# frontend-cuidarte

SPA de **Cuidarte+**, el sistema de exámenes médicos del Caso B (ISY1102). Está construida con React 18, Vite y Tailwind CSS, y la sirve nginx por HTTPS.

## Cómo levantarlo

Desde `infra-cuidarte`, con los repos como carpetas hermanas:

```bash
docker compose --profile app up -d --build frontend
```

Abre **https://localhost:8443**. El certificado es autofirmado (ambiente QA), así que el navegador mostrará una advertencia: elige *Avanzado* → *Continuar*.

## Pantallas

| Pantalla | Ruta | Roles | Requerimiento |
|---|---|---|---|
| Inicio de sesión | `/login` | público | RF-1 |
| Gestión de Pacientes | `/pacientes` | admin, médico | RF-2 |
| Ficha, exámenes y documentos | `/pacientes/:id` | admin, médico, paciente (solo la propia) | RF-3, RF-4, RB-1 |
| Auditoría | `/auditoria` | admin | RF-5 |

## Accesibilidad (NFR-USAB, WCAG 2.1 AA)

- Texto base de 16 px, nunca menor a 12 px; contraste mínimo de 4.5:1.
- Botones y campos de al menos 44×44 px (tamaño táctil).
- Cada campo tiene su `label` asociado; los errores se anuncian con `role="alert"`.
- Foco visible, enlace "Saltar al contenido" y navegación completa con Tab y Shift+Tab.
- Diseño en una columna en móvil (375 px), sin scroll horizontal.

## Seguridad

- HTTPS con TLS 1.2/1.3; el puerto 80 redirige a 443.
- Cabeceras CSP, HSTS, `X-Frame-Options`, `nosniff` y `Referrer-Policy`.
- El JWT se guarda en `sessionStorage` (se borra al cerrar la pestaña) y la sesión se cierra sola al expirar.
- La SPA solo ordena la navegación: el control de acceso real lo aplica la API.

## Análisis estático (sin Node instalado)

```powershell
docker run --rm -v ${PWD}:/app -w /app node:20-alpine sh -c "npm install --no-audit && npx eslint ."
```