# pickup-coord-engine

## What This Is

pickup-coord-engine is a coordination engine for ride-hailing platforms. Instead of treating pickup locations as fixed coordinates, it detects rider movement, discovers nearby landmarks, and recommends better pickup points that improve the likelihood of a successful meeting between rider and driver. The system is designed for ride-hailing companies, mobility platforms, and logistics providers operating in environments where riders frequently move after requesting a ride.

---

## Why It Exists

Most ride-hailing systems treat pickup as a navigation problem: the rider selects a location and the driver navigates to it. In reality, pickup is often a coordination problem. Riders move after requesting rides, GPS locations can be ambiguous, and drivers frequently struggle to identify the exact meeting point. This system continuously evaluates rider movement and recommends nearby landmarks that provide clearer, safer, and more accessible pickup locations.

---

## How It Works

The coordination pipeline consists of four stages:

### 1. Movement Detection

The system receives location updates and determines whether meaningful rider movement has occurred.

Responsibilities:

* GPS accuracy filtering
* Drift detection
* Distance calculation using the Haversine formula
* Movement classification
* Confidence scoring
* Freshness evaluation

Output:

* MovementEvent

### 2. Landmark Discovery

When meaningful movement is detected, the system discovers nearby landmarks using OpenStreetMap data through the Overpass API.

Responsibilities:

* Query nearby landmarks
* Map OSM entities into domain landmarks
* Filter candidate landmarks

Output:

* Candidate landmarks near the rider's current position

### 3. Scoring Engine

Candidate landmarks are ranked according to pickup suitability.

Signals:

* Proximity
* Accessibility
* Visibility

Illegal stopping locations are removed before scoring.

Output:

* Ranked pickup suggestions

### 4. Coordination

The PickupCoordinatorService orchestrates the workflow:

Movement Detection → Landmark Discovery → Scoring → Persistence

The coordinator updates trip state, stores movement history, persists suggestion sets, and returns suggestions to the API layer.

This pipeline has been successfully executed end-to-end against live OpenStreetMap data through real HTTP requests.

---

## State Machine

The coordination workflow is modeled as an explicit state machine.

Every API endpoint corresponds to a state transition.

```text
TRIP_ACTIVE
      ↓
MOVEMENT_DETECTED
      ↓
SUGGESTIONS_GENERATED
      ↓
RIDER_RESPONSE
      ↓
DRIVER_RESPONSE
      ↓
COORDINATION_ACTIVE
      ↓
PICKUP_SUCCESS
```

Terminal states:

```text
SUGGESTION_EXPIRED
DRIVER_DECLINED
TRIP_CANCELLED
```

---

## API Endpoints

### Health Check

```http
GET /health
```

Returns service health status.

---

### Create Trip

```http
POST /v1/trips
```

Creates a new trip and initializes the coordination workflow.

---

### Get Trip

```http
GET /v1/trips/:tripId
```

Retrieves the current state of a trip.

---

### Submit Location Update

```http
POST /v1/trips/:tripId/locations
```

Processes rider movement and may generate pickup suggestions.

---

### Accept Suggestion

```http
POST /v1/trips/:tripId/suggestions/:suggestionId/accept
```

Accepts a generated pickup suggestion.

---

## Architecture

The project follows a layered architecture with dependency inversion.

### Domain

Pure business concepts.

Examples:

* Trip
* Location
* Landmark
* MovementEvent
* PickupSuggestion

Domain types contain no infrastructure concerns.

---

### Application

Workflow orchestration.

Examples:

* PickupCoordinatorService

The application layer coordinates use cases and state transitions.

---

### Services

Pure business logic.

Examples:

* Movement Detection
* Landmark Discovery
* Scoring Engine

Services contain no persistence or HTTP concerns.

---

### Infrastructure

External dependencies and adapters.

Examples:

* Overpass API client
* Repository implementations

Infrastructure can be replaced without changing business logic.

---

### API

REST interface exposing coordination functionality.

Current implementation:

* Fastify routes
* Request handling
* Response envelopes

WebSocket support is planned next.

---

## Current Status

### Completed

* Project structure
* TypeScript setup
* Domain model
* Movement detection engine
* GPS filtering and drift detection
* Confidence and freshness evaluation
* OpenStreetMap integration
* Overpass API client
* Landmark discovery service
* Scoring engine
* Pickup suggestion ranking
* Trip state machine
* Repository abstraction
* In-memory repository implementation
* PickupCoordinatorService
* Dependency injection via composition root
* Fastify REST API
* Health endpoint
* Trip creation endpoint
* Trip retrieval endpoint
* Location submission endpoint
* Suggestion acceptance endpoint
* Standardized API response envelopes
* End-to-end workflow execution
* Live OpenStreetMap landmark discovery
* Suggestion generation against real-world data

### Remaining

* Docker environment
* PostgreSQL persistence
* Database migrations
* Redis integration
* Background jobs
* WebSocket layer
* Authentication and authorization
* JSON Schema validation for routes
* LandmarkProvider abstraction
* Production configuration management
* Observability and metrics
* Integration test suite

Docker, PostgreSQL, and Redis were intentionally deferred due to local environment issues during development. The architecture already supports replacing the in-memory repository with a database-backed implementation.

---

## Known Limitations

### In-Memory Persistence

The current repository implementation stores trips in memory.

Consequences:

* Data is lost when the server restarts
* Multiple server instances cannot share state
* Not suitable for production workloads

This limitation is intentional during early development and will be replaced by PostgreSQL.

---

### OpenStreetMap Data Quality

Landmark quality depends on available OpenStreetMap data.

Some regions may contain:

* Missing landmarks
* Unnamed landmarks
* Incomplete metadata

The scoring engine currently works with available OSM data and will evolve as additional landmark providers are introduced.

---

## Tech Stack

### TypeScript

Strong typing and explicit domain modeling.

### Node.js

Modern JavaScript runtime with native support for current language features.

### Fastify

High-performance HTTP framework with excellent TypeScript support.

### OpenStreetMap + Overpass API

Open geographic data source for landmark discovery.

### Repository Pattern

Provides persistence abstraction and enables infrastructure replacement without changing business logic.

### Dependency Injection

Keeps application services independent of implementation details.

---

## Getting Started

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

The service starts on:

```text
http://localhost:3000
```

---

## Verify the Full Pipeline

### 1. Health Check

```bash
curl http://localhost:3000/health
```

### 2. Create a Trip

```bash
curl -X POST http://localhost:3000/v1/trips \
  -H "Content-Type: application/json" \
  -d '{
    "tripId": "trip_001",
    "riderId": "rider_001",
    "driverId": "driver_001",
    "originalPickupLocation": {
      "latitude": 9.0571,
      "longitude": 7.4956,
      "timestamp": "2026-06-25T10:00:00Z",
      "accuracyMetres": 8,
      "source": "GPS"
    }
  }'
```

### 3. Submit Movement

```bash
curl -X POST http://localhost:3000/v1/trips/trip_001/locations \
  -H "Content-Type: application/json" \
  -d '{
    "previousLocation": {
      "latitude": 9.0571,
      "longitude": 7.4956,
      "timestamp": "2026-06-25T10:00:00Z",
      "accuracyMetres": 8,
      "source": "GPS",
      "speedMetresPerSecond": 1.2
    },
    "currentLocation": {
      "latitude": 9.0578,
      "longitude": 7.4962,
      "timestamp": "2026-06-25T10:00:20Z",
      "accuracyMetres": 8,
      "source": "GPS",
      "speedMetresPerSecond": 1.2
    },
    "driverEtaSeconds": 180
  }'
```

Expected outcome:

```json
{
  "success": true,
  "data": {
    "outcome": "SUGGESTIONS_GENERATED"
  }
}
```

This confirms the complete workflow is functioning:

Movement Detection → Landmark Discovery → Scoring → Coordination

---

## Contributing

This project prioritizes explicit domain modeling, clear architectural boundaries, and deterministic business logic.

Business logic never imports from infrastructure. Infrastructure never contains business rules. If you find yourself doing either, the abstraction boundary needs to move, not the code.

Interfaces model domain entities. Types model states, categories, and constraints. Prefer simple, understandable code over unnecessary abstraction, but preserve architectural boundaries even when they appear inconvenient. The coordinator orchestrates workflows, services produce facts, and infrastructure adapts external systems.
