# GamePulse Server - Integration Examples

## Complete Integration Examples

This document provides practical code examples for integrating with the GamePulse Server API for different use cases.

## Table of Contents

1. [Basic Setup](#basic-setup)
2. [Authentication Examples](#authentication-examples)
3. [Team Management Examples](#team-management-examples)
4. [Player Management Examples](#player-management-examples)
5. [Game Management Examples](#game-management-examples)
6. [Statistics Examples](#statistics-examples)
7. [WebSocket Integration Examples](#websocket-integration-examples)
8. [Complete Frontend Integration](#complete-frontend-integration)

## Basic Setup

### JavaScript/TypeScript Client

```typescript
class GamePulseAPI {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = 'http://localhost:3000/api/v1') {
    this.baseURL = baseURL;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }
}

// Usage
const api = new GamePulseAPI();
```

### Python Client

```python
import requests
import json
from typing import Optional, Dict, Any

class GamePulseAPI:
    def __init__(self, base_url: str = "http://localhost:3000/api/v1"):
        self.base_url = base_url
        self.token: Optional[str] = None
        
    def set_token(self, token: str):
        self.token = token
        
    def _get_headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers
    
    def request(self, endpoint: str, method: str = "GET", data: Optional[Dict] = None):
        url = f"{self.base_url}{endpoint}"
        headers = self._get_headers()
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers)
            elif method.upper() == "POST":
                response = requests.post(url, headers=headers, json=data)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=headers, json=data)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
                
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            print(f"API Error ({endpoint}): {e}")
            raise

# Usage
api = GamePulseAPI()
```

## Authentication Examples

### User Registration

```typescript
// JavaScript/TypeScript
async function registerUser(email: string, password: string, name: string) {
  const response = await fetch('http://localhost:3000/api/v1/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      name,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return await response.json();
}

// Usage
try {
  const result = await registerUser('user@example.com', 'password123', 'John Doe');
  console.log('User registered:', result);
} catch (error) {
  console.error('Registration failed:', error.message);
}
```

### User Login

```typescript
// JavaScript/TypeScript
async function loginUser(email: string, password: string) {
  const response = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const data = await response.json();
  
  // Store token for future requests
  api.setToken(data.access_token);
  localStorage.setItem('gamepulse_token', data.access_token);
  
  return data;
}

// Usage
try {
  const loginData = await loginUser('user@example.com', 'password123');
  console.log('Login successful:', loginData);
} catch (error) {
  console.error('Login failed:', error.message);
}
```

### Token Refresh

```typescript
// JavaScript/TypeScript
async function refreshToken(refreshToken: string) {
  const response = await fetch('http://localhost:3000/api/v1/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  const data = await response.json();
  api.setToken(data.access_token);
  
  return data;
}

// Auto-refresh token
function setupTokenRefresh(refreshToken: string) {
  setInterval(async () => {
    try {
      await refreshToken(refreshToken);
    } catch (error) {
      console.error('Auto-refresh failed:', error);
      // Redirect to login
      window.location.href = '/login';
    }
  }, 15 * 60 * 1000); // Refresh every 15 minutes
}
```

## Team Management Examples

### Get All Teams

```typescript
// JavaScript/TypeScript
async function getTeams(filters: {
  league?: string;
  division?: string;
  conference?: string;
} = {}) {
  const queryParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value) queryParams.append(key, value);
  });

  const url = `/teams${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  return await api.request(url);
}

// Usage
const teams = await getTeams({ league: 'NBA', division: 'Atlantic' });
console.log('Teams:', teams);
```

### Get Team Details with Roster

```typescript
// JavaScript/TypeScript
async function getTeamWithRoster(teamId: number) {
  const [teamDetails, roster] = await Promise.all([
    api.request(`/teams/${teamId}`),
    api.request(`/teams/${teamId}/roster`),
  ]);

  return {
    ...teamDetails,
    roster: roster.data || roster,
  };
}

// Usage
const teamData = await getTeamWithRoster(1);
console.log('Team with roster:', teamData);
```

### Create New Team (Admin)

```typescript
// JavaScript/TypeScript
async function createTeam(teamData: {
  name: string;
  city: string;
  league: string;
  division: string;
  conference?: string;
  logo?: string;
}) {
  return await api.request('/teams/admin', {
    method: 'POST',
    body: JSON.stringify(teamData),
  });
}

// Usage
const newTeam = await createTeam({
  name: 'Lakers',
  city: 'Los Angeles',
  league: 'NBA',
  division: 'Pacific',
  conference: 'Western'
});
console.log('Team created:', newTeam);
```

### Update Team (Admin)

```typescript
// JavaScript/TypeScript
async function updateTeam(teamId: number, updates: {
  name?: string;
  city?: string;
  conference?: string;
}) {
  return await api.request(`/teams/admin/${teamId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

// Usage
const updatedTeam = await updateTeam(1, {
  conference: 'Eastern'
});
```

## Player Management Examples

### Search Players

```typescript
// JavaScript/TypeScript
async function searchPlayers(filters: {
  team?: string;
  position?: string;
  search?: string;
  season?: string;
  page?: number;
  limit?: number;
} = {}) {
  const queryParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) queryParams.append(key, value.toString());
  });

  return await api.request(`/players?${queryParams.toString()}`);
}

// Usage
const players = await searchPlayers({
  team: 'Lakers',
  position: 'PG',
  search: 'LeBron',
  limit: 10
});
console.log('Search results:', players);
```

### Get Player Statistics

```typescript
// JavaScript/TypeScript
async function getPlayerStats(playerId: number, season?: string) {
  const endpoint = season ? 
    `/players/${playerId}/stats?season=${season}` : 
    `/players/${playerId}/stats`;
    
  return await api.request(endpoint);
}

// Get Player Game Log
async function getPlayerGameLog(playerId: number, filters: {
  season?: string;
  page?: number;
  limit?: number;
} = {}) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) queryParams.append(key, value.toString());
  });

  return await api.request(`/players/${playerId}/game-log?${queryParams.toString()}`);
}

// Usage
const playerStats = await getPlayerStats(123, '2025');
const gameLog = await getPlayerGameLog(123, { season: '2025', limit: 10 });
```

### Create Player (Admin)

```typescript
// JavaScript/TypeScript
async function createPlayer(playerData: {
  first_name: string;
  last_name: string;
  position: string;
  jersey_number: number;
  team_id: number;
  birth_date?: string;
  height?: string;
  weight?: string;
}) {
  return await api.request('/players/admin', {
    method: 'POST',
    body: JSON.stringify(playerData),
  });
}

// Usage
const newPlayer = await createPlayer({
  first_name: 'LeBron',
  last_name: 'James',
  position: 'SF',
  jersey_number: 6,
  team_id: 1,
  birth_date: '1984-12-30',
  height: '6\'9"',
  weight: '250 lbs'
});
```

## Game Management Examples

### Get Live Games

```typescript
// JavaScript/TypeScript
async function getLiveGames() {
  return await api.request('/games/live');
}

// Get Games with Filters
async function getGames(filters: {
  season?: string;
  month?: string;
  league?: string;
  division?: string;
  team?: string;
  status?: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED';
  date?: string;
  page?: number;
  limit?: number;
} = {}) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) queryParams.append(key, value.toString());
  });

  return await api.request(`/games?${queryParams.toString()}`);
}

// Usage
const liveGames = await getLiveGames();
const games = await getGames({
  season: '2025',
  team: 'Lakers',
  status: 'SCHEDULED'
});
```

### Get Game Details

```typescript
// JavaScript/TypeScript
async function getGameDetails(gameId: number) {
  const [gameData, boxscore, playByPlay] = await Promise.all([
    api.request(`/games/${gameId}`),
    api.request(`/games/${gameId}/boxscore`),
    api.request(`/games/${gameId}/play-by-play`),
  ]);

  return {
    game: gameData,
    boxscore: boxscore,
    playByPlay: playByPlay
  };
}

// Usage
const gameDetails = await getGameDetails(123);
console.log('Game details:', gameDetails);
```

### Create Game (Admin)

```typescript
// JavaScript/TypeScript
async function createGame(gameData: {
  season: string;
  season_type: string;
  game_date: string;
  game_time?: string;
  home_team_id: number;
  away_team_id: number;
  location_id?: number;
}) {
  return await api.request('/games/admin', {
    method: 'POST',
    body: JSON.stringify(gameData),
  });
}

// Usage
const newGame = await createGame({
  season: '2025',
  season_type: 'Regular',
  game_date: '2025-01-15',
  game_time: '19:30',
  home_team_id: 1,
  away_team_id: 2,
  location_id: 1
});
```

## Statistics Examples

### Get Player Leaders

```typescript
// JavaScript/TypeScript
async function getPlayerLeaders(category: string, filters: {
  season?: string;
  team?: string;
  limit?: number;
} = {}) {
  const queryParams = new URLSearchParams({ category, ...filters });
  return await api.request(`/stats/players/leaders?${queryParams.toString()}`);
}

// Usage
const pointsLeaders = await getPlayerLeaders('POINTS', { season: '2025', limit: 10 });
const assistLeaders = await getPlayerLeaders('ASSISTS', { team: 'Lakers' });
```

### Get Team Statistics

```typescript
// JavaScript/TypeScript
async function getTeamStats(teamId: number, season?: string) {
  const endpoint = season ? 
    `/stats/teams/${teamId}?season=${season}` : 
    `/stats/teams/${teamId}`;
    
  return await api.request(endpoint);
}

// Get Team Leaders
async function getTeamLeaders(category: string, filters: {
  season?: string;
  limit?: number;
} = {}) {
  const queryParams = new URLSearchParams({ category, ...filters });
  return await api.request(`/stats/teams/leaders?${queryParams.toString()}`);
}

// Usage
const teamStats = await getTeamStats(1, '2025');
const teamLeaders = await getTeamLeaders('POINTS', { season: '2025', limit: 5 });
```

## WebSocket Integration Examples

### Basic WebSocket Connection

```typescript
// JavaScript/TypeScript
import { io, Socket } from 'socket.io-client';

class GamePulseWebSocket {
  private socket: Socket;
  private gameId: number | null = null;

  constructor(baseURL: string = 'ws://localhost:3000') {
    this.socket = io(`${baseURL}/realtime`, {
      auth: {
        token: localStorage.getItem('gamepulse_token') || undefined
      }
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to GamePulse WebSocket');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from GamePulse WebSocket');
    });

    this.socket.on('game_update', (data) => {
      console.log('Game update received:', data);
      this.handleGameUpdate(data);
    });

    this.socket.on('score_update', (data) => {
      console.log('Score update:', data);
      this.handleScoreUpdate(data);
    });

    this.socket.on('play_by_play', (data) => {
      console.log('Play-by-play:', data);
      this.handlePlayByPlay(data);
    });
  }

  subscribeToGame(gameId: number) {
    this.gameId = gameId;
    this.socket.emit('subscribe_game', { gameId });
  }

  unsubscribeFromGame() {
    if (this.gameId) {
      this.socket.emit('unsubscribe_game', { gameId: this.gameId });
      this.gameId = null;
    }
  }

  subscribeToTeam(teamId: number) {
    this.socket.emit('subscribe_team', { teamId });
  }

  subscribeToLeague(leagueId: string) {
    this.socket.emit('subscribe_league', { leagueId });
  }

  // Admin methods
  updateLiveScore(gameId: number, homeScore: number, awayScore: number) {
    this.socket.emit('admin:update:score', {
      gameId,
      homeScore,
      awayScore
    });
  }

  createPlayByPlay(gameId: number, play: {
    quarter: number;
    timeRemaining: string;
    event: string;
    playerId?: number;
    description: string;
  }) {
    this.socket.emit('admin:create:play', {
      gameId,
      ...play
    });
  }

  private handleGameUpdate(data: any) {
    // Override this method in your application
    console.warn('handleGameUpdate not implemented:', data);
  }

  private handleScoreUpdate(data: any) {
    // Override this method in your application
    console.warn('handleScoreUpdate not implemented:', data);
  }

  private handlePlayByPlay(data: any) {
    // Override this method in your application
    console.warn('handlePlayByPlay not implemented:', data);
  }
}

// Usage
const websocket = new GamePulseWebSocket();

// Subscribe to a specific game
websocket.subscribeToGame(123);

// Handle updates
websocket.handleGameUpdate = (data) => {
  // Update UI with game state
  document.getElementById('home-score').textContent = data.homeScore;
  document.getElementById('away-score').textContent = data.awayScore;
  document.getElementById('game-status').textContent = data.status;
};

websocket.handleScoreUpdate = (data) => {
  // Animate score change
  animateScoreUpdate('home', data.homeScore);
  animateScoreUpdate('away', data.awayScore);
};

websocket.handlePlayByPlay = (data) => {
  // Add to play-by-play feed
  addPlayToFeed(data);
};
```

### React Hook for WebSocket

```typescript
// React hook for GamePulse WebSocket
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface GameUpdate {
  gameId: number;
  status: string;
  homeScore: number;
  awayScore: number;
  quarter?: number;
  timeRemaining?: string;
}

interface PlayByPlay {
  id: number;
  gameId: number;
  quarter: number;
  timeRemaining: string;
  event: string;
  playerId?: number;
  description: string;
  timestamp: string;
}

export function useGamePulseWebSocket(token?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [gameUpdates, setGameUpdates] = useState<GameUpdate[]>([]);
  const [playByPlay, setPlayByPlay] = useState<PlayByPlay[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io('ws://localhost:3000/realtime', {
      auth: token ? { token } : undefined
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to GamePulse WebSocket');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from GamePulse WebSocket');
    });

    socket.on('game_update', (data: GameUpdate) => {
      setGameUpdates(prev => {
        const existing = prev.findIndex(update => update.gameId === data.gameId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = data;
          return updated;
        }
        return [...prev, data];
      });
    });

    socket.on('play_by_play', (data: PlayByPlay) => {
      setPlayByPlay(prev => [...prev, data]);
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const subscribeToGame = (gameId: number) => {
    socketRef.current?.emit('subscribe_game', { gameId });
  };

  const unsubscribeFromGame = (gameId: number) => {
    socketRef.current?.emit('unsubscribe_game', { gameId });
  };

  return {
    isConnected,
    gameUpdates,
    playByPlay,
    subscribeToGame,
    unsubscribeFromGame
  };
}

// Usage in React component
function LiveGameComponent({ gameId, token }: { gameId: number; token?: string }) {
  const { isConnected, gameUpdates, playByPlay, subscribeToGame, unsubscribeFromGame } = 
    useGamePulseWebSocket(token);

  const gameUpdate = gameUpdates.find(update => update.gameId === gameId);

  useEffect(() => {
    if (isConnected) {
      subscribeToGame(gameId);
      return () => unsubscribeFromGame(gameId);
    }
  }, [isConnected, gameId]);

  return (
    <div>
      <div>Connection: {isConnected ? 'Connected' : 'Disconnected'}</div>
      {gameUpdate && (
        <div>
          <div>Status: {gameUpdate.status}</div>
          <div>Score: {gameUpdate.homeScore} - {gameUpdate.awayScore}</div>
          {gameUpdate.quarter && <div>Quarter: {gameUpdate.quarter}</div>}
          {gameUpdate.timeRemaining && <div>Time: {gameUpdate.timeRemaining}</div>}
        </div>
      )}
      <div>
        <h3>Play-by-Play</h3>
        {playByPlay.map(play => (
          <div key={play.id}>
            Q{play.quarter} {play.timeRemaining} - {play.description}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Complete Frontend Integration

### Complete Basketball Stats App

```typescript
// Complete React component with API integration
import React, { useState, useEffect } from 'react';
import { useGamePulseWebSocket } from './hooks/useGamePulseWebSocket';

interface Team {
  id: number;
  name: string;
  city: string;
  logo?: string;
}

interface Player {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  jersey_number: number;
  team_id: number;
  photo?: string;
}

interface Game {
  id: number;
  home_team_id: number;
  away_team_id: number;
  home_score?: number;
  away_score?: number;
  status: string;
  game_date: string;
}

function BasketballApp() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // WebSocket integration
  const { 
    isConnected, 
    gameUpdates, 
    playByPlay, 
    subscribeToGame 
  } = useGamePulseWebSocket(token);

  // Load initial data
  useEffect(() => {
    loadTeams();
    loadGames();
  }, []);

  // Subscribe to game when selected
  useEffect(() => {
    if (selectedGame && isConnected) {
      subscribeToGame(selectedGame.id);
    }
  }, [selectedGame, isConnected]);

  const api = new GamePulseAPI();

  const loadTeams = async () => {
    try {
      const data = await api.request('/teams');
      setTeams(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Failed to load teams:', error);
    }
  };

  const loadPlayers = async (teamId?: number) => {
    try {
      const filters = teamId ? { team: teamId.toString() } : {};
      const data = await api.request(`/players?${new URLSearchParams(filters)}`);
      setPlayers(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Failed to load players:', error);
    }
  };

  const loadGames = async () => {
    try {
      const data = await api.request('/games?limit=10');
      setGames(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Failed to load games:', error);
    }
  };

  const handleTeamSelect = async (team: Team) => {
    setSelectedTeam(team);
    await loadPlayers(team.id);
  };

  const handleGameSelect = (game: Game) => {
    setSelectedGame(game);
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      setToken(data.access_token);
      api.setToken(data.access_token);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const gameUpdate = selectedGame ? 
    gameUpdates.find(update => update.gameId === selectedGame.id) : null;

  return (
    <div className="basketball-app">
      <header>
        <h1>GamePulse</h1>
        <div className="connection-status">
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </header>

      <main>
        <section className="teams-section">
          <h2>Teams</h2>
          <div className="teams-grid">
            {teams.map(team => (
              <div
                key={team.id}
                className={`team-card ${selectedTeam?.id === team.id ? 'selected' : ''}`}
                onClick={() => handleTeamSelect(team)}
              >
                {team.logo && <img src={team.logo} alt={team.name} />}
                <h3>{team.city} {team.name}</h3>
              </div>
            ))}
          </div>
        </section>

        <section className="players-section">
          <h2>Players {selectedTeam && `- ${selectedTeam.city} ${selectedTeam.name}`}</h2>
          <div className="players-grid">
            {players.map(player => (
              <div key={player.id} className="player-card">
                {player.photo && <img src={player.photo} alt={player.first_name} />}
                <h4>{player.first_name} {player.last_name}</h4>
                <p>#{player.jersey_number} - {player.position}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="games-section">
          <h2>Live Games</h2>
          <div className="games-list">
            {games.map(game => (
              <div
                key={game.id}
                className={`game-card ${selectedGame?.id === game.id ? 'selected' : ''}`}
                onClick={() => handleGameSelect(game)}
              >
                <div className="game-teams">
                  <span>Team {game.home_team_id}</span>
                  <span>vs</span>
                  <span>Team {game.away_team_id}</span>
                </div>
                <div className="game-score">
                  {game.home_score || 0} - {game.away_score || 0}
                </div>
                <div className="game-status">{game.status}</div>
              </div>
            ))}
          </div>
        </section>

        {selectedGame && (
          <section className="live-game-section">
            <h2>Live Game</h2>
            <div className="live-game-display">
              <div className="game-header">
                <div className="team-display">
                  <h3>Team {gameUpdate?.homeTeamName || selectedGame.home_team_id}</h3>
                  <div className="score">{gameUpdate?.homeScore || selectedGame.home_score || 0}</div>
                </div>
                <div className="game-info">
                  <div className="status">{gameUpdate?.status || selectedGame.status}</div>
                  {gameUpdate?.quarter && <div className="quarter">Q{gameUpdate.quarter}</div>}
                  {gameUpdate?.timeRemaining && <div className="time">{gameUpdate.timeRemaining}</div>}
                </div>
                <div className="team-display">
                  <h3>Team {gameUpdate?.awayTeamName || selectedGame.away_team_id}</h3>
                  <div className="score">{gameUpdate?.awayScore || selectedGame.away_score || 0}</div>
                </div>
              </div>

              <div className="play-by-play">
                <h3>Play-by-Play</h3>
                <div className="play-feed">
                  {playByPlay
                    .filter(play => play.gameId === selectedGame.id)
                    .map(play => (
                      <div key={play.id} className="play-item">
                        <span className="time">{play.quarter}Q {play.timeRemaining}</span>
                        <span className="event">{play.description}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default BasketballApp;
```

### Error Handling and Retry Logic

```typescript
// API client with retry logic and error handling
class RobustGamePulseAPI extends GamePulseAPI {
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  async requestWithRetry(endpoint: string, options: RequestInit = {}, retries: number = 0): Promise<any> {
    try {
      return await this.request(endpoint, options);
    } catch (error) {
      if (retries < this.maxRetries) {
        console.warn(`Request failed, retrying... (${retries + 1}/${this.maxRetries})`);
        
        // Exponential backoff
        const delay = this.retryDelay * Math.pow(2, retries);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.requestWithRetry(endpoint, options, retries + 1);
      }
      
      // Handle specific error types
      if (error.message.includes('401')) {
        // Token expired, try to refresh
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          try {
            await this.refreshToken(refreshToken);
            return this.requestWithRetry(endpoint, options, 0);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
            throw error;
          }
        }
      }
      
      if (error.message.includes('429')) {
        // Rate limited, wait and retry
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * 2));
        return this.requestWithRetry(endpoint, options, retries + 1);
      }
      
      throw error;
    }
  }

  // Override all methods to use retry logic
  async get(endpoint: string) {
    return this.requestWithRetry(endpoint);
  }

  async post(endpoint: string, data: any) {
    return this.requestWithRetry(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint: string, data: any) {
    return this.requestWithRetry(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string) {
    return this.requestWithRetry(endpoint, {
      method: 'DELETE',
    });
  }
}
```

This comprehensive documentation provides developers with practical examples for integrating with the GamePulse Server API across different use cases and platforms.