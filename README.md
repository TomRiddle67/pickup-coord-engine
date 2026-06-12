# pickup-coord-engine

## What This Is

Pickup Coord Engine is a platform-agnostic coordination engine for ride-hailing pickups. It helps riders and drivers meet more efficiently by detecting rider movement, identifying nearby landmarks, and recommending better pickup locations when the original pickup point becomes suboptimal. The system is designed for ride-hailing platforms, mobility providers, and developers building transportation products that need smarter pickup coordination.

## Why It Exists

Most ride-hailing systems treat pickup locations as static coordinates. In reality, riders move after requesting a trip, GPS signals drift, landmarks are often easier to find than raw map pins, and drivers frequently struggle to locate passengers in crowded or complex environments. This system approaches pickup as a coordination problem rather than a navigation problem. Instead of assuming the original pickup point remains optimal, it continuously evaluates whether a better meeting point exists and helps both parties converge on it.

## How It Works

The coordination pipeline consists of four stages:

**Movement Detection**
The system evaluates incoming location samples, filters GPS noise, and determines whether meaningful rider movement has occurred.

**Landmark Discovery**
When movement exceeds a configurable threshold, nearby landmarks are discovered using geospatial search.

**Scoring**
Candidate landmarks are ranked based on factors such as proximity, accessibility, and visibility. Unsuitable locations are filtered out before ranking.

**Coordination**
Top-ranked suggestions are presented to the rider. Accepted suggestions become the active pickup target and are communicated to the driver through the coordination workflow.

## State Machine

The coordination workflow is modeled as an explicit state machine.
Every API endpoint corresponds to a state transition.

```
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

Terminal states: `SUGGESTION_EXPIRED`, `DRIVER_DECLINED`, `TRIP_CANCELLED`

## Architecture

The project follows a layered architecture with clear separation of responsibilities.

### Domain

Pure business concepts and data structures.

Examples:

* Trip
* Location
* Landmark
* MovementEvent
* PickupSuggestion

The domain layer contains no infrastructure concerns.

### Application

Workflow orchestration and use cases.

Examples:

* PickupCoordinatorService

The application layer coordinates business operations but does not contain external integrations.

### Services

Pure business logic modules.

Examples:

* Movement Detection
* Landmark Discovery
* Scoring Engine

Services perform calculations and decision-making without owning persistence or transport concerns.

### Infrastructure

External system integrations and adapters.

Examples:

* OpenStreetMap / Overpass API integration
* Repository implementations
* Database adapters (planned)

Infrastructure can be replaced without changing business logic.

### API (Coming)

The API layer will expose the coordination engine through:

* REST endpoints for commands and state transitions
* WebSocket events for real-time coordination updates

## Current Status

### Completed

* Project structure and TypeScript configuration
* Core domain models
* Movement detection module
* GPS filtering and drift detection
* Landmark discovery integration design
* Scoring engine and ranking pipeline
* Repository abstraction layer
* In-memory repository implementation
* PickupCoordinatorService foundation
* State-machine-driven workflow design

### Remaining

* REST API surface
* WebSocket coordination layer
* PostgreSQL integration
* PostGIS geospatial queries
* Redis and background job processing
* Authentication and authorization
* Driver coordination workflow
* Production persistence
* Automated testing
* Docker-based local environment

## Tech Stack

**Node.js 20 + TypeScript**
Modern runtime with strong type safety and excellent developer experience.

**Fastify**
High-performance web framework with built-in schema validation and TypeScript support.

**PostgreSQL + PostGIS**
Reliable relational database with powerful geospatial capabilities.

**Kysely**
Type-safe query builder and migration system without the complexity of a full ORM.

**Redis**
Fast in-memory storage for caching, expiry handling, and coordination state.

**BullMQ**
Background job processing built on Redis.

**Socket.IO**
Real-time communication between riders, drivers, and the coordination engine.

**OpenStreetMap + Overpass API**
Open geospatial data source for landmark discovery without vendor lock-in.

**Docker Compose**
Consistent local development and deployment environment.

## Getting Started

### Prerequisites

* Node.js 20+
* npm

### Install Dependencies

```bash
npm install
```

### Run Type Checking

```bash
npm run typecheck
```

### Start Development Server

```bash
npm run dev
```

### Verify Health Endpoint

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "pickup-coord-engine"
}
```

## Contributing

This project is built around a few core design principles.

Business workflows are modeled explicitly as state transitions rather than generic CRUD operations. Domain logic should remain independent of infrastructure concerns. Services should be deterministic and testable wherever possible. External systems should be accessed through abstractions and adapters so implementations remain swappable. Human decisions enter the system through commands, while system decisions emerge from events.

Business logic never imports from infrastructure. Infrastructure never contains business rules. If you find yourself doing either, the abstraction boundary needs to move, not the code.
