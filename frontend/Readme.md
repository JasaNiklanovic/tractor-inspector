# Tractor Inspector Frontend

A Vue 3 + TypeScript web application for viewing and managing tractor telemetry data.

## Features

- **Tractor List**: View all tractors with their total working hours
- **Tractor Data Table**: Browse telemetry data with sorting and pagination
- **Edit Session**: Modify individual telemetry records with form validation
- **Map Visualization**: View tractor movement on an interactive map with timeline playback

## Tech Stack

- Vue 3 with Composition API
- TypeScript
- Vue Router for navigation
- Tailwind CSS for styling
- Leaflet for map visualization
- Axios for API requests

## Prerequisites

- Node.js 18+ (recommended: 22.x)
- npm 9+
- Backend API running on http://localhost:3000

## Setup

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open http://localhost:5173 in your browser

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

## Project Structure

```
frontend/
├── src/
│   ├── api/           # API client functions
│   │   └── tractors.ts
│   ├── assets/        # CSS and static assets
│   │   └── main.css
│   ├── components/    # Reusable Vue components
│   ├── router/        # Vue Router configuration
│   │   └── index.ts
│   ├── views/         # Page components
│   │   ├── TractorList.vue    # Home page - list of tractors
│   │   ├── TractorDetail.vue  # Tractor data table with pagination
│   │   ├── EditSession.vue    # Edit form for session data
│   │   └── TractorMap.vue     # Interactive map visualization
│   ├── App.vue        # Root component
│   └── main.ts        # Application entry point
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Pages

### Tractor List (`/`)
Displays all tractors in a card grid layout showing:
- Serial number
- Total working hours
- Click to view detailed data

### Tractor Detail (`/tractors/:serialNumber`)
Shows telemetry data in a sortable, paginated table:
- Click column headers to sort
- Adjust page size (10, 25, 50, 100)
- Pagination state is preserved in URL for sharing
- Click date/time to edit that record
- "View Map" button to see movement visualization

### Edit Session (`/tractors/:serialNumber/edit/:id`)
Form to edit session data:
- All editable fields displayed
- Input validation (ranges, required fields)
- Save/Cancel buttons
- Success feedback and redirect

### Map View (`/tractors/:serialNumber/map`)
Interactive map showing tractor movement:
- OpenStreetMap tiles
- Path line showing route
- Tractor marker showing current position
- Timeline slider to scrub through time
- Play/Pause button for animation
- Current position info display

## Responsive Design

The application is fully responsive with breakpoints at:
- Mobile: < 768px (single column, stacked layout)
- Tablet/Desktop: >= 768px (multi-column, table layout)

## API Endpoints Used

- `GET /tractors` - List all tractors
- `GET /tractors/:serialNumber` - Paginated tractor data
- `GET /tractors/:serialNumber/sessions/:id` - Single session
- `PUT /tractors/:serialNumber/sessions/:id` - Update session
- `GET /tractors/:serialNumber/gps` - GPS data for map

## Testing

Run tests with:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Coverage

- **API Client Tests** (`src/api/tractors.test.ts`): Tests for all API functions with mocked axios
- **TractorList Tests** (`src/views/TractorList.test.ts`): Loading states, error handling, data display
- **TractorDetail Tests** (`src/views/TractorDetail.test.ts`): Pagination, sorting, table rendering
- **EditSession Tests** (`src/views/EditSession.test.ts`): Form validation, submission, error states

## Development Notes

- The Vite dev server proxies `/api` requests to the backend
- Leaflet CSS is imported in `main.css`
- Form validation happens client-side before submission
- Tests use Vitest with happy-dom environment
