# Frontend IPRL (Administrador + Alumno)

Este frontend ahora contempla dos experiencias:

- **Administrador**: dashboard general, gestión de alumnos, cursos y pagos.
- **Alumno**: login con Google OAuth 2.0 y dashboard de estado de cuenta/historial.

## Configuración para Google Login (Alumno)

1. Crea un **OAuth Client ID** en Google Cloud Console (tipo Web).
2. En `frontend/index.html`, asigna el valor en:

```html
<script>window.GOOGLE_CLIENT_ID = "TU_CLIENT_ID.apps.googleusercontent.com";</script>
```

3. En backend configura el mismo `GOOGLE_CLIENT_ID` en `.env`.

## Estructura

```text
frontend/
├── index.html
├── styles/
│   └── main.css
└── js/
    ├── main.js
    ├── api.js
    ├── state.js
    └── ui.js
```
