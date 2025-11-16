# GamePulse Server API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Authentication & Authorization](#authentication--authorization)
4. [API Endpoints](#api-endpoints)
5. [WebSocket API](#websocket-api)
6. [Data Models](#data-models)
7. [Integration Guide](#integration-guide)
8. [Error Handling](#error-handling)
9. [Environment Configuration](#environment-configuration)

## Overview

GamePulse Server is a NestJS-based API that powers basketball statistics and live game tracking applications. It provides comprehensive REST APIs for managing teams, players, games, statistics, and real-time data through WebSocket connections.

### Key Features

- **RESTful API** with comprehensive basketball data management
- **Real-time WebSocket** updates for live games
- **JWT-based Authentication** with role-based access control
- **Supabase Database** integration
- **Swagger API Documentation** available at `/api/docs`
- **Rate Limiting** and request validation
- **Admin Panel** functionality with RBAC permissions

## Architecture

### Technology Stack

- **Framework**: NestJS (Node.js)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT tokens with Supabase
- **WebSocket**: Socket.IO
- **API Documentation**: Swagger/OpenAPI
- **Validation**: class-validator
- **Caching**: Redis with cache-manager

### Project Structure

```
src/
├── modules/
│   ├── auth/           # Authentication & user management
│   ├── teams/          # Team management
│   ├── players/        # Player management
│   ├── games/          # Game management
│   ├── stats/          # Statistics and leaderboards
│   ├── standings/      # League standings
│   ├── realtime/       # WebSocket gateway
│   ├── admin/          # Admin functionality
│   ├── analytics/      # Analytics data
│   ├── reports/        # Reporting
│   ├── media/          # Media management
│   ├── rbac/           # Role-based access control
│   ├── content/        # Content management
│   └── cache/          # Caching layer
├── common/             # Shared utilities and DTOs
└── database/           # Database configuration
```

### Base Configuration

- **API Base URL**: `/api/v1`
- **WebSocket URL**: `ws://localhost:3000/realtime`
- **API Documentation**: `http://localhost:3000/api/docs`
- **Default Port**: 3000

## Authentication & Authorization

### Authentication Flow

The API uses JWT-based authentication with the following flow:

1. **Registration**: `POST /auth/register`
2. **Login**: `POST /auth/login`
3. **Token Refresh**: `POST /auth/refresh`
4. **Logout**: `POST /auth/logout`

### Bearer Token Usage

Include JWT token in Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

### Permission System

The API implements Role-Based Access Control (RBAC) with the following permissions:

- `CREATE_TEAM` - Create teams
- `EDIT_TEAM` - Edit teams
- `DELETE_TEAM` - Delete teams
- `MANAGE_COACHES` - Manage coaches
- `CREATE_GAME` - Create games
- `EDIT_GAME` - Edit games
- `DELETE_GAME` - Delete games
- `CREATE_SEASON` - Create seasons
- `START_GAME` - Start games
- `END_GAME` - End games
- `MANAGE_LIVE_SCORES` - Manage live scores
- `MANAGE_PLAY_BY_PLAY` - Manage play-by-play
- `MANAGE_GAME_EVENTS` - Manage game events
- `MANAGE_PLAYERS` - Manage players

### Auth Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | User login | No |
| POST | `/auth/refresh` | Refresh access token | No |
| POST | `/auth/logout` | User logout | Yes |
| GET | `/auth/profile` | Get user profile | Yes |
| PUT | `/auth/profile` | Update user profile | Yes |
| POST | `/auth/change-password` | Change password | Yes |
| POST | `/auth/request-password-reset` | Request password reset | No |
| POST | `/auth/reset-password` | Reset password with token | No |
| POST | `/auth/verify-email` | Verify email address | No |
| GET | `/auth/me` | Get current user | Yes |

## API Endpoints

### Teams Module

#### Public Endpoints

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/teams` | Get all teams | `league`, `division`, `conference` |
| GET | `/teams/:id` | Get team details | - |
| GET | `/teams/:id/roster` | Get team roster | - |
| GET | `/teams/:id/schedule` | Get team schedule | `season`, `month` |
| GET | `/teams/:id/stats` | Get team statistics | `season`, `seasonType` |

#### Admin Endpoints

| Method | Endpoint | Description | Auth Required | Permissions |
|--------|----------|-------------|---------------|-------------|
| POST | `/teams/admin` | Create team | Yes | CREATE_TEAM |
| PUT | `/teams/admin/:id` | Update team | Yes | EDIT_TEAM |
| DELETE | `/teams/admin/:id` | Delete team | Yes | DELETE_TEAM |
| PUT | `/teams/admin/:id/coach` | Assign coach to team | Yes | MANAGE_COACHES |

### Players Module

#### Public Endpoints

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/players` | Get players with filters | `team`, `position`, `search`, `season`, `page`, `limit` |
| GET | `/players/:id` | Get player details | - |
| GET | `/players/:id/stats` | Get player statistics | `season` |
| GET | `/players/:id/game-log` | Get player game log | `season`, `page`, `limit` |

#### Admin Endpoints

| Method | Endpoint | Description | Auth Required | Permissions |
|--------|----------|-------------|---------------|-------------|
| POST | `/players/admin` | Create player | Yes | MANAGE_PLAYERS |
| PUT | `/players/admin/:id` | Update player | Yes | MANAGE_PLAYERS |
| DELETE | `/players/admin/:id` | Delete player | Yes | MANAGE_PLAYERS |
| PUT | `/players/admin/:id/transfer` | Transfer player to another team | Yes | MANAGE_PLAYERS |

### Games Module

#### Public Endpoints

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/games` | Get games with filters | `season`, `month`, `league`, `division`, `team`, `status`, `date`, `page`, `limit` |
| GET | `/games/live` | Get currently live games | - |
| GET | `/games/schedule` | Get game schedule grouped by date | `season`, `month`, `startDate`, `endDate`, `team`, `league` |
| GET | `/games/:id` | Get game details | - |
| GET | `/games/:id/live` | Get live game data | - |
| GET | `/games/:id/boxscore` | Get game boxscore | - |
| GET | `/games/:id/play-by-play` | Get play-by-play events | `quarter` |

#### Admin Endpoints

| Method | Endpoint | Description | Auth Required | Permissions |
|--------|----------|-------------|---------------|-------------|
| POST | `/games/admin` | Create game | Yes | CREATE_GAME |
| PUT | `/games/admin/:id` | Update game | Yes | EDIT_GAME |
| DELETE | `/games/admin/:id` | Delete game | Yes | DELETE_GAME |
| PUT | `/games/admin/:id/status` | Update game status | Yes | EDIT_GAME |
| POST | `/games/admin/locations` | Create game location | Yes | CREATE_GAME |
| PUT | `/games/admin/locations/:id` | Update game location | Yes | EDIT_GAME |
| DELETE | `/games/admin/locations/:id` | Delete game location | Yes | DELETE_GAME |
| POST | `/games/admin/seasons` | Create season | Yes | CREATE_SEASON |

### Statistics Module

#### Public Endpoints

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/stats/players/leaders` | Get player stat leaders | `season`, `category`, `team`, `limit` |
| GET | `/stats/players` | Get player statistics | `season`, `team`, `position`, `sortBy`, `order`, `page`, `limit` |
| GET | `/stats/players/all-time` | Get all-time records for players | `category` |
| GET | `/stats/teams/leaders` | Get team stat leaders | `season`, `category`, `limit` |
| GET | `/stats/teams/all-time` | Get all-time team records | `category` |
| GET | `/stats/teams/:id` | Get team statistics by ID | `season` |

## WebSocket API

### Connection

Connect to WebSocket server:

```javascript
const socket = io('ws://localhost:3000/realtime', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### Authentication

WebSocket authentication supports multiple token sources:
- Handshake query parameter: `?token=your_token`
- Authentication object: `{ auth: { token: 'your_token' } }`
- Authorization header: `Bearer your_token`

Guest access is allowed if no token is provided or if authentication fails.

### Subscription Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `subscribe_game` | Client → Server | Subscribe to game updates |
| `unsubscribe_game` | Client → Server | Unsubscribe from game updates |
| `subscribe_league` | Client → Server | Subscribe to league updates |
| `unsubscribe_league` | Client → Server | Unsubscribe from league updates |
| `subscribe_team` | Client → Server | Subscribe to team updates |
| `unsubscribe_team` | Client → Server | Unsubscribe from team updates |

### Admin Events

| Event | Direction | Description | Required Permission |
|-------|-----------|-------------|-------------------|
| `admin:update:score` | Client → Server | Update live score | MANAGE_LIVE_SCORES |
| `admin:create:play` | Client → Server | Create play-by-play event | MANAGE_PLAY_BY_PLAY |
| `admin:update:player:stat` | Client → Server | Update player statistics | MANAGE_LIVE_SCORES |
| `admin:end:quarter` | Client → Server | End game quarter | MANAGE_GAME_EVENTS |
| `admin:start:game` | Client → Server | Start a game | START_GAME |
| `admin:end:game` | Client → Server | End a game | END_GAME |

### Server Events

| Event | Description |
|-------|-------------|
| `game_update` | Game state has changed |
| `score_update` | Live score has been updated |
| `play_by_play` | New play-by-play event |
| `player_stats_update` | Player statistics updated |
| `game_start` | Game has started |
| `game_end` | Game has ended |
| `quarter_end` | Quarter has ended |
| `heartbeat` | Connection heartbeat |
| `connection_stats` | Admin room: Connection statistics |

### Subscription Management

#### Subscribe to Game Updates

```javascript
socket.emit('subscribe_game', { gameId: 123 });
```

#### Subscribe to League Updates

```javascript
socket.emit('subscribe_league', { leagueId: 'nba' });
```

#### Subscribe to Team Updates

```javascript
socket.emit('subscribe_team', { teamId: 456 });
```

### Real-time Data Flow

1. **Initial Connection**: Client connects and authenticates
2. **Subscription**: Client subscribes to specific content (games, teams, leagues)
3. **Real-time Updates**: Server broadcasts relevant updates to subscribed clients
4. **Admin Controls**: Admins can send live updates through WebSocket
5. **Automatic Cleanup**: Unsubscribes on disconnect

## Data Models

### Common Response Format

```typescript
// Success Response
{
  "data": any,
  "message": "string (optional)"
}

// Pagination Response
{
  "data": any[],
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "pages": number
  }
}

// Error Response
{
  "statusCode": number,
  "message": string,
  "error": string
}
```

### Key Data Structures

#### Team
```typescript
interface Team {
  id: number;
  name: string;
  city: string;
  league: string;
  division: string;
  conference?: string;
  logo?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

#### Player
```typescript
interface Player {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  jersey_number: number;
  team_id: number;
  birth_date?: string;
  height?: string;
  weight?: string;
  photo?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

#### Game
```typescript
interface Game {
  id: number;
  season: string;
  season_type: string;
  game_date: string;
  game_time?: string;
  home_team_id: number;
  away_team_id: number;
  home_score?: number;
  away_score?: number;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED';
  location_id?: number;
  quarter?: number;
  time_remaining?: string;
  created_at: string;
  updated_at: string;
}
```

#### Game Statistics
```typescript
interface GameStats {
  game_id: number;
  player_id: number;
  minutes_played: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  field_goals_made: number;
  field_goals_attempted: number;
  three_points_made: number;
  three_points_attempted: number;
  free_throws_made: number;
  free_throws_attempted: number;
}
```

## Integration Guide

### Basic Setup

1. **Base URL**: `http://localhost:3000/api/v1`
2. **Headers**: Include `Content-Type: application/json`
3. **Authentication**: Add `Authorization: Bearer <token>` for protected endpoints

### Authentication Flow

```javascript
// 1. Register
const registerResponse = await fetch('/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

// 2. Login
const loginResponse = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { access_token } = await loginResponse.json();

// 3. Use token for authenticated requests
const teamsResponse = await fetch('/api/v1/teams', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});
```

### WebSocket Integration

```javascript
import io from 'socket.io-client';

const socket = io('ws://localhost:3000/realtime', {
  auth: {
    token: 'your_jwt_token'
  }
});

// Subscribe to game updates
socket.on('connect', () => {
  console.log('Connected to WebSocket');
  socket.emit('subscribe_game', { gameId: 123 });
});

// Listen for game updates
socket.on('game_update', (data) => {
  console.log('Game update:', data);
  // Update UI with new game data
});

socket.on('score_update', (data) => {
  console.log('Score update:', data);
  // Update score display
});
```

### Error Handling

```javascript
try {
  const response = await fetch('/api/v1/teams/1', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }
  
  const team = await response.json();
  return team;
} catch (error) {
  console.error('API Error:', error.message);
  // Handle error appropriately
}
```

### Rate Limiting

The API implements rate limiting:
- **Limit**: 100 requests per 60 seconds
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

Handle rate limiting:

```javascript
const checkRateLimit = (response) => {
  const remaining = response.headers.get('X-RateLimit-Remaining');
  if (remaining === '0') {
    const resetTime = response.headers.get('X-RateLimit-Reset');
    console.warn('Rate limit exceeded. Reset at:', new Date(parseInt(resetTime) * 1000));
  }
};
```

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

### Common Error Responses

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

## Environment Configuration

### Required Environment Variables

```env
PORT=3000
DATABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
JWT_SECRET=your_jwt_secret
REDIS_URL=your_redis_url
```

### CORS Configuration

The API allows requests from:

```javascript
const corsOrigins = [
  'http://localhost:4200',
  'https://game-pulse-41882.web.app',
  'https://game-pulse-41882.web.app/'
];
```

### Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run start:dev

# Run tests
npm run test

# Build for production
npm run build

# Start production server
npm run start:prod
```

### Production Considerations

1. **Database**: Configure Supabase connection with appropriate credentials
2. **Redis**: Set up Redis for caching and session management
3. **SSL/HTTPS**: Ensure secure connections in production
4. **Environment Variables**: Use secure secret management
5. **Rate Limiting**: Adjust rate limits based on expected load
6. **Monitoring**: Implement logging and monitoring

---

**Note**: This documentation is based on the current codebase structure. For the most up-to-date API documentation, visit the Swagger UI at `/api/docs` when the server is running.