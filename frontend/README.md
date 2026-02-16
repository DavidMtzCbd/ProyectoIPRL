# Frontend de Administrador (IPRL)

Este frontend está pensado para que el administrador pueda operar sobre los módulos clave del sistema:

- Resumen general (dashboard).
- Consulta de alumnos.
- Consulta de cursos.
- Consulta de pagos por alumno.

## Organización recomendada

```text
frontend/
├── index.html              # Shell principal del panel admin
├── styles/
│   └── main.css            # Estilos globales del panel
├── js/
│   ├── main.js             # Orquestación de eventos y carga de vistas
│   ├── api.js              # Cliente HTTP para consumir backend /api
│   ├── state.js            # Estado global simple (token + vista actual)
│   └── ui.js               # Renderizado de tablas, alertas y utilidades UI
└── README.md               # Guía de arquitectura y siguientes pasos
```

## Flujo de uso

1. Iniciar sesión con el formulario superior.
2. Navegar entre vistas desde el menú lateral.
3. Cargar módulos según la vista activa:
   - `Dashboard`: métricas y últimos pagos.
   - `Alumnos`: listado general.
   - `Cursos`: listado general.
   - `Pagos`: consulta por ID de alumno.

## Siguiente nivel de organización (cuando escale)

Cuando el proyecto crezca, migrar gradualmente a una arquitectura por módulos:

```text
frontend/
├── src/
│   ├── core/               # Config global, cliente HTTP, auth
│   ├── modules/
│   │   ├── dashboard/
│   │   ├── alumnos/
│   │   ├── cursos/
│   │   └── pagos/
│   ├── shared/             # Componentes reutilizables (tabla, tarjetas, toast)
│   └── app/                # Layout principal y enrutamiento
└── ...
```

Esto ayuda a mantener separación clara por dominio funcional en lugar de crecer por tipo de archivo.
