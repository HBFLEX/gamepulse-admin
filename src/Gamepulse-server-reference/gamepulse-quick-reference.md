# GamePulse Server - Quick Reference Guide

## 🚀 Quick Start Integration

### Base Information
- **API Base URL**: `http://localhost:3000/api/v1`
- **WebSocket URL**: `ws://localhost:3000/realtime`
- **Documentation**: `http://localhost:3000/api/docs`
- **Authentication**: Bearer Token (JWT)

### Essential Endpoints

| Category | Endpoint | Purpose | Auth Required |
|----------|----------|---------|---------------|
| Auth | `POST /auth/login` | User login | No |
| Teams | `GET /teams` | Get teams list | No |
| Players | `GET /players` | Get players list | No |
| Games | `GET /games/live` | Get live games | No |
| Stats | `GET /stats/players/leaders` | Get stat leaders | No |

### Minimal Integration Example

```javascript
// 1. Initialize API client
const api = new GamePulseAPI('http://localhost:3000/api/v1');

// 2. Login (if needed)
const loginData = await api.request('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email: 'user@example.com', password: 'password' })
});
api.setToken(loginData.access_token);

// 3. Fetch data
const teams = await api.request('/teams');
const liveGames = await api.request('/games/live');
const playerLeaders = await api.request('/stats/players/leaders?category=POINTS');

// 4. Real-time updates
const socket = io('ws://localhost:3000/realtime', {
  auth: { token: loginData.access_token }
});
socket.emit('subscribe_game', { gameId: 123 });
```

## 📚 Documentation Overview

### Available Documentation Files

1. **[Main API Documentation](./gamepulse-server-api-documentation.md)**
   - Complete API reference
   - Authentication & authorization
   - All endpoints with parameters
   - WebSocket API details
   - Integration guide

2. **[Integration Examples](./gamepulse-integration-examples.md)**
   - Practical code examples
   - JavaScript/TypeScript & Python clients
   - React components with hooks
   - Error handling & retry logic
   - Complete frontend integration

3. **[API Schema & Data Models](./gamepulse-api-schema.md)**
   - Detailed data structures
   - TypeScript interfaces
   - Validation rules
   - WebSocket message types
   - Request/response schemas

## 🔑 Key Authentication Flow

```typescript
// 1. Register User
POST /auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}

// 2. Login
POST /auth/login
{
  "email": "user@example.com", 
  "password": "password123"
}
// Response: { "access_token": "jwt_token", "refresh_token": "refresh_token" }

// 3. Use token for authenticated requests
Authorization: Bearer jwt_token

// 4. Refresh token when needed
POST /auth/refresh
{
  "refresh_token": "refresh_token"
}
```

## 🏀 Core Data Models

### Team
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
}
```

### Player
```typescript
interface Player {
  id: number;
  first_name: string;
  last_name: string;
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C';
  jersey_number: number;
  team_id: number;
  height?: string;
  weight?: string;
  photo?: string;
  is_active: boolean;
}
```

### Game
```typescript
interface Game {
  id: number;
  season: string;
  game_date: string;
  home_team_id: number;
  away_team_id: number;
  home_score?: number;
  away_score?: number;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED';
  quarter?: number;
  time_remaining?: string;
}
```

## 🔌 WebSocket Quick Reference

### Connection
```javascript
const socket = io('ws://localhost:3000/realtime', {
  auth: { token: 'your_jwt_token' }
});
```

### Subscribe to Updates
```javascript
// Game updates
socket.emit('subscribe_game', { gameId: 123 });

// Team updates  
socket.emit('subscribe_team', { teamId: 456 });

// League updates
socket.emit('subscribe_league', { leagueId: 'nba' });
```

### Listen for Events
```javascript
socket.on('game_update', (data) => {
  // Handle game state changes
  console.log('Game updated:', data);
});

socket.on('score_update', (data) => {
  // Handle score changes
  console.log('Score updated:', data);
});

socket.on('play_by_play', (data) => {
  // Handle new plays
  console.log('New play:', data);
});
```

## 📊 Common Query Parameters

### Teams
- `league` - Filter by league
- `division` - Filter by division  
- `conference` - Filter by conference
- `page`, `limit` - Pagination

### Players
- `team` - Filter by team ID
- `position` - Filter by position (PG, SG, SF, PF, C)
- `search` - Search by name
- `season` - Filter by season
- `page`, `limit` - Pagination

### Games
- `season` - Filter by season (e.g., "2025")
- `status` - Filter by status (SCHEDULED, LIVE, FINISHED)
- `team` - Filter by team
- `date` - Filter by specific date
- `page`, `limit` - Pagination

### Statistics
- `season` - Filter by season
- `category` - Stat category (POINTS, REBOUNDS, ASSISTS, etc.)
- `limit` - Number of results
- `sortBy` - Sort field

## ⚡ Real-time Features

### Available Events
- **Game Updates**: Status changes, quarter updates
- **Score Updates**: Live score changes
- **Play-by-Play**: Individual game events
- **Player Stats**: Live statistical updates
- **Game State**: Start/end events, quarter changes

### Admin Features (Require Permissions)
- Update live scores
- Create play-by-play events  
- Update player statistics
- Start/end games
- End quarters

## 🛡️ Permission System

### User Roles
- **ADMIN**: Full access to all features
- **SCOREKEEPER**: Can manage live game data
- **VIEWER**: Read-only access

### Key Permissions
- `CREATE_TEAM`, `EDIT_TEAM`, `DELETE_TEAM`
- `CREATE_GAME`, `EDIT_GAME`, `DELETE_GAME`
- `START_GAME`, `END_GAME`
- `MANAGE_LIVE_SCORES`, `MANAGE_PLAY_BY_PLAY`
- `MANAGE_PLAYERS`

## 🚨 Error Handling

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `429` - Too Many Requests (rate limited)

### Error Response Format
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

### Rate Limiting
- **Limit**: 100 requests per 60 seconds
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## 🔧 Development Setup

### Environment Variables
```env
PORT=3000
DATABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
JWT_SECRET=your_jwt_secret
REDIS_URL=your_redis_url
```

### Installation & Run
```bash
npm install
npm run start:dev  # Development
npm run build
npm run start:prod # Production
```

### CORS Origins
- `http://localhost:4200`
- `https://game-pulse-41882.web.app`

## 📱 Integration Examples by Platform

### React
```jsx
import { useGamePulseWebSocket } from './hooks/useGamePulseWebSocket';

function LiveGame({ gameId, token }) {
  const { isConnected, gameUpdates } = useGamePulseWebSocket(token);
  const game = gameUpdates.find(g => g.gameId === gameId);
  
  return (
    <div>
      <div>Status: {game?.status}</div>
      <div>Score: {game?.homeScore} - {game?.awayScore}</div>
    </div>
  );
}
```

### Vue.js
```vue
<template>
  <div>
    <div v-if="game">
      <div>Status: {{ game.status }}</div>
      <div>Score: {{ game.homeScore }} - {{ game.awayScore }}</div>
    </div>
  </div>
</template>

<script>
import { io } from 'socket.io-client';

export default {
  data() {
    return {
      game: null,
      socket: null
    };
  },
  mounted() {
    this.socket = io('ws://localhost:3000/realtime', {
      auth: { token: this.token }
    });
    this.socket.emit('subscribe_game', { gameId: this.gameId });
    this.socket.on('game_update', (data) => {
      if (data.gameId === this.gameId) {
        this.game = data;
      }
    });
  }
};
</script>
```

### Python
```python
import requests
import socketio

class GamePulseClient:
    def __init__(self, base_url="http://localhost:3000/api/v1"):
        self.base_url = base_url
        self.token = None
        self.sio = socketio.Client()
    
    def login(self, email, password):
        response = requests.post(f"{self.base_url}/auth/login", json={
            "email": email,
            "password": password
        })
        data = response.json()
        self.token = data["access_token"]
        return data
    
    def get_teams(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(f"{self.base_url}/teams", headers=headers)
        return response.json()

# Usage
client = GamePulseClient()
client.login("user@example.com", "password")
teams = client.get_teams()
```

## 🎯 Common Use Cases

### 1. Display Live Game Scores
```javascript
// Get live games
const liveGames = await api.request('/games/live');

// Set up real-time updates
socket.on('game_update', (data) => {
  const gameElement = document.getElementById(`game-${data.gameId}`);
  if (gameElement) {
    gameElement.querySelector('.home-score').textContent = data.homeScore;
    gameElement.querySelector('.away-score').textContent = data.awayScore;
    gameElement.querySelector('.status').textContent = data.status;
  }
});
```

### 2. Search Players
```javascript
const searchPlayers = async (query) => {
  return await api.request(`/players?search=${encodeURIComponent(query)}&limit=20`);
};
```

### 3. Get Team Roster
```javascript
const getTeamRoster = async (teamId) => {
  return await api.request(`/teams/${teamId}/roster`);
};
```

### 4. Track Player Statistics
```javascript
const getPlayerStats = async (playerId, season = '2025') => {
  return await api.request(`/players/${playerId}/stats?season=${season}`);
};
```

## 🔍 API Testing

### cURL Examples

```bash
# Get teams
curl -X GET "http://localhost:3000/api/v1/teams" \
  -H "Content-Type: application/json"

# Login
curl -X POST "http://localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get live games with token
curl -X GET "http://localhost:3000/api/v1/games/live" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📈 Performance Tips

1. **Use Pagination**: Always specify `page` and `limit` for list endpoints
2. **Filter Data**: Use query parameters to reduce data transfer
3. **Cache Responses**: Implement client-side caching for static data
4. **WebSocket for Live Data**: Use WebSocket for real-time updates instead of polling
5. **Handle Rate Limits**: Implement exponential backoff for 429 responses
6. **Token Refresh**: Implement automatic token refresh before expiration

## 🚀 Deployment Checklist

- [ ] Set up Supabase database with proper schema
- [ ] Configure Redis for caching and sessions  
- [ ] Set environment variables for production
- [ ] Configure CORS origins for your domains
- [ ] Set up SSL/HTTPS certificates
- [ ] Implement logging and monitoring
- [ ] Configure rate limiting appropriate for your load
- [ ] Set up backup and disaster recovery
- [ ] Test WebSocket connections across different networks
- [ ] Validate all API endpoints in production environment

This quick reference guide provides essential information for quick integration with the GamePulse Server API. For detailed information, refer to the complete documentation files.