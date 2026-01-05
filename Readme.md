# Tractor Inspector

A modern fleet management dashboard for monitoring agricultural machinery telemetry data. Built with Vue 3, TypeScript, Express.js, and PostgreSQL.

## Demo

https://github.com/JasaNiklanovic/tractor-inspector/raw/main/Recording.mov

*Preview of the full user experience: fleet overview, telemetry data browsing, session editing, and interactive movement map with timeline playback.*

## Features

- **Fleet Overview**: View all tractors with their total working hours at a glance
- **Telemetry Data Table**: Browse detailed session data with sorting and pagination
- **Session Editing**: Modify telemetry records with client-side validation
- **Movement Visualization**: Interactive map with timeline playback showing tractor routes

## Quick Start

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- [Node.js](https://nodejs.org/) 18+ (for frontend development)

### Running the Application

1. **Start the backend and database**:

   ```bash
   docker compose up -d
   ```

   This starts:
   - PostgreSQL database on port 5432 (with telemetry data pre-loaded)
   - Express.js API on port 3000

2. **Start the frontend**:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Open the application**:

   Navigate to [http://localhost:5173](http://localhost:5173)

## Architecture

```
tractor-inspector/
├── backend/           # Express.js REST API
│   ├── server.js      # API endpoints
│   └── db.js          # PostgreSQL connection
├── frontend/          # Vue 3 SPA
│   ├── src/
│   │   ├── api/       # API client with TypeScript interfaces
│   │   ├── views/     # Page components
│   │   ├── router/    # Vue Router configuration
│   │   └── assets/    # Styles and static assets
│   └── ...
└── db/                # Database initialization
    ├── seed.sql       # Schema and data import
    └── csv/           # Tractor telemetry data files
```

## Pages

### Fleet Overview (`/`)

Displays all tractors in a card grid with:
- Serial number
- Total working hours
- Quick navigation to detailed view

### Tractor Data (`/tractors/:serialNumber`)

Paginated data table showing telemetry records:
- **Sorting**: Click any column header to sort ascending/descending
- **Pagination**: Adjustable page size (10, 25, 50, 100 rows)
- **URL State**: Pagination and sorting preserved in URL for bookmarking/sharing
- **Edit Access**: Click any date/time value to edit that record

### Edit Session (`/tractors/:serialNumber/edit/:id`)

Form for modifying session data with validation:
- Engine load: 0-100%
- GPS coordinates: Valid ranges (-180/180 longitude, -90/90 latitude)
- Numeric fields: Non-negative values enforced
- Real-time validation feedback

### Movement Map (`/tractors/:serialNumber/map`)

Interactive visualization of tractor movement:
- **Route Display**: Complete path shown on map
- **Timeline Playback**: Play/pause with speed controls (0.5x, 1x, 2x, 4x)
- **Position Info**: Current time, speed, and engine RPM displayed
- **GPS Filtering**: Outlier points automatically removed for smooth visualization

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tractors` | List all tractors with latest working hours |
| GET | `/tractors/:serialNumber` | Paginated telemetry data (supports `page`, `pageSize`, `sortBy`, `sortOrder`) |
| GET | `/tractors/:serialNumber/summary` | Tractor summary statistics |
| GET | `/tractors/:serialNumber/sessions/:id` | Single session details |
| PUT | `/tractors/:serialNumber/sessions/:id` | Update session data |
| GET | `/tractors/:serialNumber/gps` | GPS data for map visualization |

## Tech Stack

**Frontend**
- Vue 3 (Composition API)
- TypeScript
- Vue Router
- Tailwind CSS
- Leaflet.js (maps)
- Axios
- Vitest (testing)

**Backend**
- Node.js
- Express.js
- PostgreSQL (via `pg` driver)

**Infrastructure**
- Docker Compose

## Testing

```bash
cd frontend

# Run tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Building for Production

```bash
cd frontend
npm run build
```

Built files will be output to `frontend/dist/`.
