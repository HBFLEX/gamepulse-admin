# GamePulse Server - API Schema & Data Models

## Data Models Reference

This document provides detailed schema information for all data models used in the GamePulse Server API, helping AI systems understand the exact data structures for integration.

## Table of Contents

1. [Base Types](#base-types)
2. [Authentication Models](#authentication-models)
3. [Team Models](#team-models)
4. [Player Models](#player-models)
5. [Game Models](#game-models)
6. [Statistics Models](#statistics-models)
7. [WebSocket Message Types](#websocket-message-types)
8. [Request/Response Schemas](#requestresponse-schemas)
9. [Validation Rules](#validation-rules)

## Base Types

### Common Field Types

```typescript
// Common field definitions
interface BaseEntity {
  id: number;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

interface Timestamped {
  created_at: string;
  updated_at: string;
}

interface SoftDeletable {
  is_active: boolean;
  deleted_at?: string;
}

// Enums
enum GameStatus {
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED'
}

enum SeasonType {
  REGULAR = 'Regular',
  PLAYOFF = 'Playoff',
  PRESEASON = 'Preseason'
}

enum StatCategory {
  POINTS = 'POINTS',
  REBOUNDS = 'REBOUNDS',
  ASSISTS = 'ASSISTS',
  STEALS = 'STEALS',
  BLOCKS = 'BLOCKS',
  TURNOVERS = 'TURNOVERS',
  MINUTES = 'MINUTES',
  FG_PERCENTAGE = 'FG_PERCENTAGE',
  FT_PERCENTAGE = 'FT_PERCENTAGE',
  THREE_POINT_PERCENTAGE = 'THREE_POINT_PERCENTAGE'
}

enum PlayerPosition {
  PG = 'PG', // Point Guard
  SG = 'SG', // Shooting Guard
  SF = 'SF', // Small Forward
  PF = 'PF', // Power Forward
  C = 'C',   // Center
}

enum Permission {
  CREATE_TEAM = 'CREATE_TEAM',
  EDIT_TEAM = 'EDIT_TEAM',
  DELETE_TEAM = 'DELETE_TEAM',
  MANAGE_COACHES = 'MANAGE_COACHES',
  CREATE_GAME = 'CREATE_GAME',
  EDIT_GAME = 'EDIT_GAME',
  DELETE_GAME = 'DELETE_GAME',
  CREATE_SEASON = 'CREATE_SEASON',
  START_GAME = 'START_GAME',
  END_GAME = 'END_GAME',
  MANAGE_LIVE_SCORES = 'MANAGE_LIVE_SCORES',
  MANAGE_PLAY_BY_PLAY = 'MANAGE_PLAY_BY_PLAY',
  MANAGE_GAME_EVENTS = 'MANAGE_GAME_EVENTS',
  MANAGE_PLAYERS = 'MANAGE_PLAYERS'
}

enum UserRole {
  ADMIN = 'ADMIN',
  SCOREKEEPER = 'SCOREKEEPER',
  VIEWER = 'VIEWER'
}
```

## Authentication Models

### User

```typescript
interface User extends BaseEntity {
  id: string; // UUID
  email: string;
  name: string;
  role: UserRole;
  is_verified: boolean;
  last_login?: string;
  profile?: {
    avatar_url?: string;
    bio?: string;
    preferences?: {
      favorite_team?: number;
      notifications_enabled: boolean;
    };
  };
}
```

### Authentication Request/Response

```typescript
// Registration
interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

interface RegisterResponse {
  message: string;
  user: {
    id: string;
    email: string;
    name: string;
    is_verified: boolean;
  };
}

// Login
interface LoginDto {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
  user: User;
}

// Token Refresh
interface RefreshTokenDto {
  refresh_token: string;
}

interface RefreshTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: 'Bearer';
}

// Profile Update
interface UpdateProfileDto {
  name?: string;
  avatar_url?: string;
  bio?: string;
  preferences?: {
    favorite_team?: number;
    notifications_enabled?: boolean;
  };
}
```

## Team Models

### Team

```typescript
interface Team extends BaseEntity, SoftDeletable {
  name: string;
  city: string;
  league: string;
  division: string;
  conference?: string;
  logo?: string;
  colors?: {
    primary: string;
    secondary: string;
  };
  stats?: {
    wins: number;
    losses: number;
    win_percentage: number;
    games_played: number;
  };
}
```

### Coach

```typescript
interface Coach extends BaseEntity, SoftDeletable {
  first_name: string;
  last_name: string;
  position: string; // Head Coach, Assistant Coach, etc.
  hire_date: string;
  team_id?: number; // null if not currently assigned
  experience_years: number;
  photo?: string;
}
```

### Team DTOs

```typescript
// Create Team
interface CreateTeamDto {
  name: string;
  city: string;
  league: string;
  division: string;
  conference?: string;
  logo?: string;
}

// Update Team
interface UpdateTeamDto {
  name?: string;
  city?: string;
  conference?: string;
  logo?: string;
}

// Assign Coach
interface AssignCoachDto {
  coachId: number;
}
```

## Player Models

### Player

```typescript
interface Player extends BaseEntity, SoftDeletable {
  first_name: string;
  last_name: string;
  position: PlayerPosition;
  jersey_number: number;
  team_id: number;
  birth_date?: string;
  height?: string; // Format: "6'9\""
  weight?: string; // Format: "250 lbs"
  photo?: string;
  college?: string;
  years_experience: number;
  contract?: {
    start_year: number;
    end_year: number;
    salary?: number;
  };
}
```

### Player DTOs

```typescript
// Create Player
interface CreatePlayerDto {
  first_name: string;
  last_name: string;
  position: PlayerPosition;
  jersey_number: number;
  team_id: number;
  birth_date?: string;
  height?: string;
  weight?: string;
  college?: string;
  years_experience: number;
}

// Update Player
interface UpdatePlayerDto {
  first_name?: string;
  last_name?: string;
  position?: PlayerPosition;
  jersey_number?: number;
  team_id?: number;
  birth_date?: string;
  height?: string;
  weight?: string;
  photo?: string;
  college?: string;
  years_experience?: number;
}

// Transfer Player
interface TransferPlayerDto {
  teamId: number;
}

// Player Filters
interface PlayerFilters {
  team?: string;
  position?: PlayerPosition;
  search?: string;
  season?: string;
  page?: number;
  limit?: number;
}
```

## Game Models

### Game Location

```typescript
interface GameLocation extends BaseEntity, SoftDeletable {
  name: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  capacity?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}
```

### Season

```typescript
interface Season extends BaseEntity {
  year: string; // e.g., "2025"
  type: SeasonType;
  start_date: string;
  end_date: string;
  is_active: boolean;
}
```

### Game

```typescript
interface Game extends BaseEntity {
  season: string;
  season_type: SeasonType;
  game_date: string;
  game_time?: string;
  home_team_id: number;
  away_team_id: number;
  home_score?: number;
  away_score?: number;
  status: GameStatus;
  location_id?: number;
  quarter?: number;
  time_remaining?: string;
  attendance?: number;
  officials?: string[]; // Referee names
  teams?: {
    home: Team;
    away: Team;
  };
  location?: GameLocation;
}
```

### Game DTOs

```typescript
// Create Game
interface CreateGameDto {
  season: string;
  season_type: SeasonType;
  game_date: string;
  game_time?: string;
  home_team_id: number;
  away_team_id: number;
  location_id?: number;
}

// Update Game
interface UpdateGameDto {
  game_date?: string;
  game_time?: string;
  home_team_id?: number;
  away_team_id?: number;
  location_id?: number;
}

// Game Location DTOs
interface CreateGameLocationDto {
  locationName: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  capacity?: number;
}

interface UpdateGameLocationDto {
  locationName?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  capacity?: number;
}

// Create Season
interface CreateGameSeasonDto {
  seasonYear: string;
  seasonType: SeasonType;
}

// Game Filters
interface GetGamesQueryDto {
  season?: string;
  month?: string;
  league?: string;
  division?: string;
  team?: string;
  status?: GameStatus;
  date?: string;
  page?: number;
  limit?: number;
}

interface GetScheduleQueryDto {
  season?: string;
  month?: string;
  startDate?: string;
  endDate?: string;
  team?: string;
  league?: string;
}
```

## Statistics Models

### Player Statistics

```typescript
interface PlayerStats extends BaseEntity {
  player_id: number;
  game_id?: number;
  season: string;
  games_played: number;
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
  field_goal_percentage: number;
  three_points_made: number;
  three_points_attempted: number;
  three_point_percentage: number;
  free_throws_made: number;
  free_throws_attempted: number;
  free_throw_percentage: number;
  player?: Player;
  game?: Game;
}
```

### Team Statistics

```typescript
interface TeamStats extends BaseEntity {
  team_id: number;
  season: string;
  games_played: number;
  wins: number;
  losses: number;
  win_percentage: number;
  points_for: number;
  points_against: number;
  point_differential: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  field_goal_percentage: number;
  three_point_percentage: number;
  free_throw_percentage: number;
  team?: Team;
}
```

### Play-by-Play

```typescript
interface PlayByPlay extends BaseEntity {
  game_id: number;
  quarter: number;
  time_remaining: string; // Format: "MM:SS" or "SS"
  event_type: string; // "FIELD_GOAL", "FREE_THROW", "FOUL", "TURNOVER", etc.
  event_description: string;
  player_id?: number;
  team_id?: number;
  points_awarded?: number;
  quarter_start: boolean;
  quarter_end: boolean;
  game_start: boolean;
  game_end: boolean;
  player?: Player;
  team?: Team;
}
```

### Statistics Filters and Responses

```typescript
// Player Statistics Filters
interface PlayerStatsFilters {
  season?: string;
  team?: string;
  position?: PlayerPosition;
  sortBy?: PlayerSortBy;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

enum PlayerSortBy {
  POINTS = 'POINTS',
  REBOUNDS = 'REBOUNDS',
  ASSISTS = 'ASSISTS',
  MINUTES = 'MINUTES',
  FG_PERCENTAGE = 'FG_PERCENTAGE',
  THREE_POINT_PERCENTAGE = 'THREE_POINT_PERCENTAGE',
  FT_PERCENTAGE = 'FT_PERCENTAGE',
  POINTS_TOTAL = 'POINTS_TOTAL'
}

// Team Statistics Filters
interface TeamStatsFilters {
  season?: string;
  category?: TeamStatCategory;
  limit?: number;
}

enum TeamStatCategory {
  WINS = 'WINS',
  LOSSES = 'LOSSES',
  WIN_PERCENTAGE = 'WIN_PERCENTAGE',
  POINTS = 'POINTS',
  REBOUNDS = 'REBOUNDS',
  ASSISTS = 'ASSISTS'
}

// Leaderboards Response
interface LeaderboardEntry {
  rank: number;
  player?: Player;
  team?: Team;
  value: number;
  games_played?: number;
}

interface LeaderboardResponse {
  data: LeaderboardEntry[];
  metadata: {
    season: string;
    category: string;
    total_entries: number;
    generated_at: string;
  };
}

// All-Time Records
interface AllTimeRecord {
  record_holder: string;
  value: number;
  team?: string;
  date_achieved?: string;
  season?: string;
  games_played?: number;
}

interface AllTimeRecordsResponse {
  data: AllTimeRecord[];
  category: string;
  generated_at: string;
}
```

## WebSocket Message Types

### Client to Server Messages

```typescript
// Subscription Messages
interface SubscribeGameMessage {
  gameId: number;
}

interface SubscribeTeamMessage {
  teamId: number;
}

interface SubscribeLeagueMessage {
  leagueId: string;
}

interface UnsubscribeGameMessage {
  gameId: number;
}

interface UnsubscribeTeamMessage {
  teamId: number;
}

interface UnsubscribeLeagueMessage {
  leagueId: string;
}

// Admin Messages
interface AdminUpdateScoreMessage {
  gameId: number;
  homeScore: number;
  awayScore: number;
}

interface AdminCreatePlayMessage {
  gameId: number;
  quarter: number;
  timeRemaining: string;
  event: string;
  playerId?: number;
  description: string;
}

interface AdminUpdatePlayerStatMessage {
  gameId: number;
  playerId: number;
  statType: string;
  value: number;
}

interface AdminEndQuarterMessage {
  gameId: number;
  quarter: number;
}

interface AdminStartGameMessage {
  gameId: number;
}

interface AdminEndGameMessage {
  gameId: number;
}
```

### Server to Client Messages

```typescript
// Connection Events
interface ConnectionEvent {
  event: 'connect' | 'disconnect' | 'error';
  timestamp: string;
  userId?: string;
  role?: UserRole;
}

// Game Update Events
interface GameUpdateEvent {
  gameId: number;
  status: GameStatus;
  homeScore: number;
  awayScore: number;
  quarter?: number;
  timeRemaining?: string;
  lastUpdated: string;
}

interface ScoreUpdateEvent {
  gameId: number;
  homeScore: number;
  awayScore: number;
  timestamp: string;
}

interface PlayByPlayEvent {
  id: number;
  gameId: number;
  quarter: number;
  timeRemaining: string;
  event: string;
  description: string;
  playerId?: number;
  timestamp: string;
}

interface PlayerStatUpdateEvent {
  gameId: number;
  playerId: number;
  statType: string;
  newValue: number;
  timestamp: string;
}

// Game State Events
interface GameStartEvent {
  gameId: number;
  timestamp: string;
  teams: {
    home: Team;
    away: Team;
  };
}

interface GameEndEvent {
  gameId: number;
  finalScore: {
    home: number;
    away: number;
  };
  timestamp: string;
}

interface QuarterEndEvent {
  gameId: number;
  quarter: number;
  timestamp: string;
}

// System Events
interface HeartbeatEvent {
  event: 'heartbeat';
  timestamp: string;
  connections: number;
}

interface ConnectionStatsEvent {
  usersOnline: number;
  totalConnections: number;
  activeSessions: number;
  activeScorekeeperUsers: number;
  timestamp: string;
}
```

## Request/Response Schemas

### Paginated Response

```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

### Standard Response Format

```typescript
// Success Response
interface ApiResponse<T> {
  data: T;
  message?: string;
  metadata?: {
    generated_at: string;
    request_id?: string;
  };
}

// Error Response
interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  details?: {
    field?: string;
    message: string;
    code?: string;
  }[];
  timestamp: string;
  path: string;
  method: string;
}
```

### Query Parameters Schema

```typescript
// Common query parameters
interface BaseQueryParams {
  page?: number; // Default: 1
  limit?: number; // Default: 20, Max: 100
  sort?: string; // Field to sort by
  order?: 'asc' | 'desc'; // Default: 'desc'
  search?: string; // Search query
  filters?: Record<string, any>; // Additional filters
}

// Teams query parameters
interface TeamsQueryParams extends BaseQueryParams {
  league?: string;
  division?: string;
  conference?: string;
  is_active?: boolean;
}

// Players query parameters
interface PlayersQueryParams extends BaseQueryParams {
  team?: string;
  position?: PlayerPosition;
  search?: string;
  season?: string;
}

// Games query parameters
interface GamesQueryParams extends BaseQueryParams {
  season?: string;
  month?: string;
  league?: string;
  division?: string;
  team?: string;
  status?: GameStatus;
  date?: string;
  startDate?: string;
  endDate?: string;
}

// Statistics query parameters
interface StatsQueryParams extends BaseQueryParams {
  season?: string;
  category?: string;
  team?: string;
  position?: PlayerPosition;
}
```

## Validation Rules

### Field Validation

```typescript
// Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password validation
interface PasswordRules {
  minLength: 8;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

// Name validation
interface NameValidation {
  minLength: 2;
  maxLength: 50;
  pattern: /^[a-zA-Z\s'-]+$/;
}

// Jersey number validation
const jerseyNumberRules = {
  min: 0,
  max: 99
};

// Height validation (example: "6'9\"")
const heightPattern = /^\d{1}'\d{1,2}"$/;

// Weight validation (example: "250 lbs")
const weightPattern = /^\d{2,3}\s*lbs?$/;

// Time validation
const timePattern = /^\d{1,2}:\d{2}$/;

// Date validation (ISO 8601)
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

// Season validation
const seasonPattern = /^\d{4}$/;
```

### Required Fields by Endpoint

```typescript
// Authentication
const registerRequiredFields = ['email', 'password', 'name'];
const loginRequiredFields = ['email', 'password'];

// Teams
const createTeamRequiredFields = ['name', 'city', 'league', 'division'];
const updateTeamOptionalFields = ['name', 'city', 'conference', 'logo'];

// Players
const createPlayerRequiredFields = ['first_name', 'last_name', 'position', 'jersey_number', 'team_id'];
const createPlayerOptionalFields = ['birth_date', 'height', 'weight', 'college', 'years_experience'];

// Games
const createGameRequiredFields = ['season', 'season_type', 'game_date', 'home_team_id', 'away_team_id'];
const createGameOptionalFields = ['game_time', 'location_id'];
```

### File Upload Constraints

```typescript
interface FileUploadConstraints {
  images: {
    maxSize: 5 * 1024 * 1024; // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'];
    maxDimensions: {
      width: 500;
      height: 500;
    };
  };
  documents: {
    maxSize: 10 * 1024 * 1024; // 10MB
    allowedTypes: ['application/pdf'];
  };
}
```

This schema documentation provides AI systems and developers with precise data structures, validation rules, and constraints needed for proper integration with the GamePulse Server API.