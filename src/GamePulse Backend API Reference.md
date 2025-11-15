# GamePulse Backend API Reference & Architecture Guide

**Framework:** NestJS 11.0.1  
**Database:** Supabase PostgreSQL  
**Authentication:** Supabase Auth (JWT)  
**Real-time:** Socket.io WebSocket  
**API Version:** v1 (implied, uses `/api/v1/` routes)

---

## 📋 Table of Contents
1. [Project Structure](#project-structure)
2. [Authentication & Authorization](#authentication--authorization)
3. [Admin Management API](#admin-management-api)
4. [Data Models & Interfaces](#data-models--interfaces)
5. [Common Response Formats](#common-response-formats)
6. [Error Handling](#error-handling)
7. [Other API Modules](#other-api-modules)
8. [Real-time Features](#real-time-features)

---

## 🏗️ Project Structure

### Module Organization
```
src/
├── modules/
│   ├── admin/                    # Admin user management
│   ├── auth/                     # Authentication & JWT
│   ├── rbac/                     # Role-Based Access Control
│   ├── teams/                    # Team management
│   ├── players/                  # Player management
│   ├── games/                    # Game management & schedules
│   ├── standings/                # League standings & rankings
│   ├── stats/                    # Player & team statistics
│   ├── content/                  # News, stories, banners, heroes
│   ├── analytics/                # Event tracking & analytics
│   ├── reports/                  # Report generation
│   ├── media/                    # Media uploads & storage
│   ├── realtime/                 # WebSocket events
│   ├── cache/                    # Caching service
│   └── rbac/                     # Permission management
├── common/
│   ├── decorators/               # Custom decorators (@CurrentUser, @Roles, etc.)
│   ├── guards/                   # Auth & RBAC guards
│   ├── filters/                  # Exception filters
│   ├── pipes/                    # Validation pipes
│   ├── interceptors/             # Request/response interceptors
│   ├── types/                    # TypeScript interfaces
│   └── utils/                    # Helper functions
├── database/
│   ├── supabase.module.ts        # Supabase configuration
│   └── supabase.service.ts       # Database service wrapper
├── config/                       # Configuration management
├── main.ts                       # Application entry point
├── app.module.ts                 # Root module
├── app.controller.ts             # Root controller
└── app.service.ts                # Root service
```

### Key Dependencies
```json
{
  "@nestjs/common": "^11.0.1",
  "@nestjs/core": "^11.0.1",
  "@nestjs/platform-express": "^11.1.8",
  "@nestjs/websockets": "^11.1.8",
  "@nestjs/platform-socket.io": "^11.1.8",
  "@nestjs/swagger": "^11.2.1",
  "@nestjs/throttler": "^6.4.0",
  "@nestjs/cache-manager": "^3.0.1",
  "@supabase/supabase-js": "^2.79.0",
  "socket.io": "^4.8.1",
  "class-validator": "^0.14.2",
  "class-transformer": "^0.5.1",
  "jsonwebtoken": "^9.0.2"
}
```

---

## 🔐 Authentication & Authorization

### Roles
```typescript
enum Role {
  SUPER_ADMIN = 'super_admin',    // Full system access
  LEAGUE_ADMIN = 'league_admin',  // League/season management
  TEAM_ADMIN = 'team_admin',      // Team management
  CONTENT_ADMIN = 'content_admin', // Content management
  GAME_ADMIN = 'game_admin',      // Game/live score management
  USER = 'user',                  // Regular user
  GUEST = 'guest',                // Guest access
}
```

### Permissions (40+ granular permissions)
```typescript
enum Permission {
  // Super Admin Only
  MANAGE_ADMINS = 'manage_admins',
  MANAGE_ROLES = 'manage_roles',
  ACCESS_AUDIT_LOGS = 'access_audit_logs',
  MANAGE_APP_SETTINGS = 'manage_app_settings',

  // League Admin
  CREATE_LEAGUE = 'create_league',
  EDIT_LEAGUE = 'edit_league',
  DELETE_LEAGUE = 'delete_league',
  CREATE_TEAM = 'create_team',
  EDIT_TEAM = 'edit_team',
  DELETE_TEAM = 'delete_team',
  CREATE_SEASON = 'create_season',
  EDIT_SEASON = 'edit_season',
  DELETE_SEASON = 'delete_season',
  MANAGE_STANDINGS = 'manage_standings',
  MANAGE_SCHEDULES = 'manage_schedules',

  // Team Admin
  EDIT_TEAM_INFO = 'edit_team_info',
  MANAGE_PLAYERS = 'manage_players',
  MANAGE_COACHES = 'manage_coaches',
  MANAGE_TEAM_STATS = 'manage_team_stats',

  // Content Admin
  CREATE_NEWS = 'create_news',
  EDIT_NEWS = 'edit_news',
  DELETE_NEWS = 'delete_news',
  CREATE_STORY = 'create_story',
  EDIT_STORY = 'edit_story',
  DELETE_STORY = 'delete_story',
  CREATE_MOMENT = 'create_moment',
  EDIT_MOMENT = 'edit_moment',
  DELETE_MOMENT = 'delete_moment',
  MANAGE_BANNERS = 'manage_banners',
  MANAGE_HERO_SECTIONS = 'manage_hero_sections',

  // Game Admin
  CREATE_GAME = 'create_game',
  EDIT_GAME = 'edit_game',
  DELETE_GAME = 'delete_game',
  MANAGE_LIVE_SCORES = 'manage_live_scores',
  MANAGE_PLAY_BY_PLAY = 'manage_play_by_play',
  MANAGE_GAME_EVENTS = 'manage_game_events',
  START_GAME = 'start_game',
  END_GAME = 'end_game',

  // Regular User
  VIEW_CONTENT = 'view_content',
  LIKE_CONTENT = 'like_content',
  COMMENT_CONTENT = 'comment_content',
  VOTE_CONTENT = 'vote_content',

  // Guest
  VIEW_PUBLIC_CONTENT = 'view_public_content',
}
```

### Authentication Flow
1. User logs in with email/password via Supabase Auth
2. Backend receives JWT token from Supabase
3. JwtAuthGuard validates token on protected routes
4. CurrentUser decorator extracts user ID from JWT
5. RbacGuard checks user's role for endpoint access
6. PermissionsGuard verifies specific permissions

### Decorators Used
```typescript
@PublicRoute()          // Skip auth (use on public endpoints)
@Roles(Role.SUPER_ADMIN)  // Require specific role(s)
@RequirePermissions(Permission.MANAGE_ADMINS) // Require permission
@CurrentUser('id')      // Inject current user's ID
@CurrentUser('email')   // Inject current user's email
```

---

## 👥 Admin Management API

### Base Path
```
/api/v1/admin
```

### Authentication
- **Required:** Bearer token in Authorization header
- **Guards:** JwtAuthGuard, RbacGuard, PermissionsGuard
- **Role Required:** SUPER_ADMIN

---

### 1. Get All Admin Users

**Endpoint:** `GET /api/v1/admin`  
**Role Required:** SUPER_ADMIN  
**Permissions:** None (role-only check)

**Query Parameters:**
```typescript
{
  role?: Role,           // Filter by role (super_admin, league_admin, etc.)
  isActive?: boolean,    // Filter by active status
  page?: number = 1,     // Page number (1-indexed)
  limit?: number = 20,   // Items per page
}
```

**Response (200 OK):**
```typescript
{
  data: AdminUser[],
  meta: {
    total: number,         // Total count of matching admins
    page: number,          // Current page
    limit: number,         // Items per page
    hasMore: boolean,      // Whether more pages exist
  }
}
```

**Example Request:**
```bash
GET /api/v1/admin?role=super_admin&isActive=true&page=1&limit=20
Authorization: Bearer <jwt_token>
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "user-uuid-1",
      "email": "admin1@gamepulse.com",
      "full_name": "John Admin",
      "username": "johnadmin",
      "role": {
        "id": 1,
        "role_name": "Super Admin",
        "permissions": ["manage_admins", "manage_roles", "access_audit_logs"]
      },
      "team": null,
      "is_active": true,
      "last_login": "2025-11-15T10:30:00Z",
      "created_at": "2025-11-01T08:00:00Z",
      "updated_at": "2025-11-15T10:30:00Z"
    },
    {
      "id": "user-uuid-2",
      "email": "league@gamepulse.com",
      "full_name": "League Manager",
      "username": "leagueadmin",
      "role": {
        "id": 2,
        "role_name": "League Admin",
        "permissions": ["create_league", "edit_league", "manage_standings"]
      },
      "team": null,
      "is_active": true,
      "last_login": "2025-11-15T09:15:00Z",
      "created_at": "2025-11-05T12:00:00Z",
      "updated_at": "2025-11-14T16:45:00Z"
    }
  ],
  "meta": {
    "total": 15,
    "page": 1,
    "limit": 20,
    "hasMore": false
  }
}
```

---

### 2. Get Admin User by ID

**Endpoint:** `GET /api/v1/admin/:id`  
**Role Required:** SUPER_ADMIN  
**Path Parameters:** `id` (string, UUID)

**Response (200 OK):**
```typescript
{
  admin: AdminUser
}
```

**Example Request:**
```bash
GET /api/v1/admin/user-uuid-1
Authorization: Bearer <jwt_token>
```

**Example Response:**
```json
{
  "admin": {
    "id": "user-uuid-1",
    "email": "admin1@gamepulse.com",
    "full_name": "John Admin",
    "username": "johnadmin",
    "role": {
      "id": 1,
      "role_name": "Super Admin",
      "permissions": ["manage_admins", "manage_roles", "access_audit_logs"]
    },
    "team": null,
    "is_active": true,
    "last_login": "2025-11-15T10:30:00Z",
    "created_at": "2025-11-01T08:00:00Z",
    "updated_at": "2025-11-15T10:30:00Z"
  }
}
```

---

### 3. Create New Admin User

**Endpoint:** `POST /api/v1/admin`  
**Role Required:** SUPER_ADMIN  
**Permission Required:** MANAGE_ADMINS

**Request Body:**
```typescript
{
  email: string,          // Email (must be valid email format)
  password: string,       // Password (minimum 8 characters)
  fullName: string,       // Full name
  roleId: number,         // Role ID from admin_roles table
  teamId?: number,        // Optional: Team ID (for team admins)
}
```

**Example Request:**
```bash
POST /api/v1/admin
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "email": "newadmin@gamepulse.com",
  "password": "SecurePass123!",
  "fullName": "New Admin User",
  "roleId": 2,
  "teamId": null
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Admin user created successfully",
  "adminId": "new-user-uuid"
}
```

---

### 4. Update Admin User

**Endpoint:** `PUT /api/v1/admin/:id`  
**Role Required:** SUPER_ADMIN  
**Permission Required:** MANAGE_ADMINS  
**Path Parameters:** `id` (string, UUID)

**Request Body (all fields optional):**
```typescript
{
  fullName?: string,      // Update full name
  roleId?: number,        // Change role
  teamId?: number,        // Assign/change team
  isActive?: boolean,     // Activate/deactivate
}
```

**Example Request:**
```bash
PUT /api/v1/admin/user-uuid-1
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "fullName": "Updated Name",
  "roleId": 3,
  "isActive": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Admin user updated successfully",
  "admin": {
    "id": "user-uuid-1",
    "email": "admin1@gamepulse.com",
    "full_name": "Updated Name",
    "username": "johnadmin",
    "role": {
      "id": 3,
      "role_name": "Content Admin",
      "permissions": ["create_news", "edit_news", "manage_banners"]
    },
    "team": null,
    "is_active": true,
    "last_login": "2025-11-15T10:30:00Z",
    "created_at": "2025-11-01T08:00:00Z",
    "updated_at": "2025-11-15T12:00:00Z"
  }
}
```

---

### 5. Delete Admin User

**Endpoint:** `DELETE /api/v1/admin/:id`  
**Role Required:** SUPER_ADMIN  
**Permission Required:** MANAGE_ADMINS  
**Path Parameters:** `id` (string, UUID)

**Example Request:**
```bash
DELETE /api/v1/admin/user-uuid-1
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Admin user deleted successfully"
}
```

---

### 6. Toggle Admin Active Status

**Endpoint:** `PUT /api/v1/admin/:id/toggle-active`  
**Role Required:** SUPER_ADMIN  
**Path Parameters:** `id` (string, UUID)

**Example Request:**
```bash
PUT /api/v1/admin/user-uuid-1/toggle-active
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Admin status toggled successfully",
  "admin": {
    "id": "user-uuid-1",
    "is_active": false,
    "updated_at": "2025-11-15T12:05:00Z"
  }
}
```

---

### 7. Assign Role to Admin

**Endpoint:** `PUT /api/v1/admin/:id/assign-role`  
**Role Required:** SUPER_ADMIN  
**Permission Required:** MANAGE_ROLES  
**Path Parameters:** `id` (string, UUID)

**Request Body:**
```typescript
{
  roleId: number,        // Role ID from admin_roles table
}
```

**Example Request:**
```bash
PUT /api/v1/admin/user-uuid-1/assign-role
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "roleId": 2
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Role assigned successfully",
  "admin": {
    "id": "user-uuid-1",
    "role": {
      "id": 2,
      "role_name": "League Admin",
      "permissions": ["create_league", "edit_league", "manage_standings"]
    },
    "updated_at": "2025-11-15T12:10:00Z"
  }
}
```

---

### 8. Assign Team to Admin

**Endpoint:** `PUT /api/v1/admin/:id/assign-team`  
**Roles Required:** SUPER_ADMIN, LEAGUE_ADMIN  
**Path Parameters:** `id` (string, UUID)

**Request Body:**
```typescript
{
  teamId: number,        // Team ID from teams table
}
```

**Example Request:**
```bash
PUT /api/v1/admin/user-uuid-2/assign-team
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "teamId": 5
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Team assigned successfully",
  "admin": {
    "id": "user-uuid-2",
    "team": {
      "id": 5,
      "team_name": "Warriors",
      "team_city": "San Francisco"
    },
    "updated_at": "2025-11-15T12:15:00Z"
  }
}
```

---

### 9. Get Audit Logs

**Endpoint:** `GET /api/v1/admin/audit/logs`  
**Role Required:** SUPER_ADMIN  
**Permission Required:** ACCESS_AUDIT_LOGS

**Query Parameters:**
```typescript
{
  userId?: string,       // Filter by user ID
  action?: string,       // Filter by action (CREATE, UPDATE, DELETE)
  entityType?: string,   // Filter by entity type (admin_user, game, etc.)
  startDate?: string,    // Filter start date (ISO 8601)
  endDate?: string,      // Filter end date (ISO 8601)
  page?: number = 1,
  limit?: number = 50,
}
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "log-uuid",
      "userId": "user-uuid-1",
      "action": "CREATE",
      "entityType": "admin_user",
      "entityId": "new-admin-uuid",
      "changes": {
        "email": "newadmin@gamepulse.com",
        "role_id": 2
      },
      "timestamp": "2025-11-15T12:00:00Z"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "hasMore": true
  }
}
```

---

### 10. Get Audit Statistics

**Endpoint:** `GET /api/v1/admin/audit/stats`  
**Role Required:** SUPER_ADMIN  
**Permission Required:** ACCESS_AUDIT_LOGS

**Response (200 OK):**
```json
{
  "totalEvents": 1250,
  "lastUpdated": "2025-11-15T12:30:00Z",
  "actionCounts": {
    "CREATE": 350,
    "UPDATE": 650,
    "DELETE": 250
  },
  "topActors": [
    {
      "userId": "user-uuid-1",
      "email": "admin1@gamepulse.com",
      "actionCount": 125
    }
  ],
  "entityTypeDistribution": {
    "admin_user": 200,
    "game": 600,
    "player": 300,
    "content": 150
  }
}
```

---

### 11. Get Real-time Connection Statistics

**Endpoint:** `GET /api/v1/admin/realtime/connection-stats`  
**Roles Required:** SUPER_ADMIN, LEAGUE_ADMIN

**Response (200 OK):**
```json
{
  "activeUsers": 245,
  "activeSession": 312,
  "scorekeeperUsers": 18,
  "totalConnections": 575,
  "byRole": {
    "super_admin": 5,
    "league_admin": 12,
    "team_admin": 25,
    "content_admin": 8,
    "game_admin": 18,
    "user": 177
  },
  "updatedAt": "2025-11-15T12:35:00Z"
}
```

---

## 📊 Data Models & Interfaces

### AdminUser (Response Format)
```typescript
interface AdminUser {
  id: string;                    // UUID from Supabase Auth
  email: string;                 // Unique email
  full_name: string;             // User's full name
  username: string;              // Username (if set)
  role: {
    id: number;                  // Role ID
    role_name: string;           // Role name (super_admin, league_admin, etc.)
    permissions: string[];       // Array of permission strings
  };
  team?: {
    id: number;                  // Team ID
    team_name: string;           // Team name
    team_city: string;           // Team city
  };
  is_active: boolean;            // Whether user is active
  last_login?: string;           // ISO 8601 timestamp
  created_at: string;            // ISO 8601 timestamp
  updated_at: string;            // ISO 8601 timestamp
}
```

### CreateAdminUserDto (Request)
```typescript
interface CreateAdminUserDto {
  email: string;                 // Valid email format required
  password: string;              // Min 8 characters
  fullName: string;              // Non-empty string
  roleId: number;                // Valid role ID
  teamId?: number;               // Optional team ID
}
```

### UpdateAdminUserDto (Request)
```typescript
interface UpdateAdminUserDto {
  fullName?: string;             // Optional
  roleId?: number;               // Optional
  teamId?: number;               // Optional
  isActive?: boolean;            // Optional
}
```

### AdminRole
```typescript
interface AdminRole {
  id: number;
  role_name: string;             // e.g., "Super Admin", "League Admin"
  permissions: Permission[];     // Array of permission enums
}
```

### Team (referenced in AdminUser.team)
```typescript
interface Team {
  id: number;
  team_name: string;
  team_city: string;
  [additional fields...];
}
```

### AuditLog
```typescript
interface AuditLog {
  id: string;                    // UUID
  userId: string;                // UUID of user who performed action
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: string;            // e.g., 'admin_user', 'game'
  entityId: string;              // ID of affected entity
  changes: Record<string, any>;  // What changed
  timestamp: string;             // ISO 8601
}
```

---

## 🔄 Common Response Formats

### Success Response (200 OK / 201 Created)
```json
{
  "success": true,
  "data": {},  // or "admin": {}, "admins": []
  "message": "Operation successful"
}
```

### Paginated Response
```json
{
  "data": [],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

---

## ⚠️ Error Handling

### HTTP Status Codes

| Code | Meaning | Typical Cause |
|------|---------|---------------|
| 400 | Bad Request | Invalid input/query parameters |
| 401 | Unauthorized | Missing/invalid JWT token |
| 403 | Forbidden | Insufficient role/permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate email, already admin, etc. |
| 500 | Server Error | Unexpected error |

### Error Response Format
```json
{
  "statusCode": 403,
  "message": "User does not have permission to manage_admins",
  "error": "Forbidden"
}
```

### Common Errors

**Missing JWT Token:**
```
401 Unauthorized: "Unauthorized: Invalid token"
```

**Invalid Role:**
```
403 Forbidden: "User does not have the required role"
```

**User Not Found:**
```
404 Not Found: "Admin user not found"
```

**Duplicate Email:**
```
409 Conflict: "User is already an admin"
```

---

## 🔌 Other API Modules

### Teams Module
```
GET    /api/v1/teams              # List all teams
GET    /api/v1/teams/:id          # Get team details
POST   /api/v1/teams              # Create team (LEAGUE_ADMIN)
PUT    /api/v1/teams/:id          # Update team
DELETE /api/v1/teams/:id          # Delete team
```

### Players Module
```
GET    /api/v1/players            # List players
GET    /api/v1/players/:id        # Get player details
POST   /api/v1/players            # Create player (TEAM_ADMIN)
PUT    /api/v1/players/:id        # Update player
DELETE /api/v1/players/:id        # Delete player
```

### Games Module
```
GET    /api/v1/games              # List games
GET    /api/v1/games/:id          # Get game details
POST   /api/v1/games              # Create game (GAME_ADMIN)
PUT    /api/v1/games/:id          # Update game
DELETE /api/v1/games/:id          # Delete game
GET    /api/v1/schedule           # Get season schedule
```

### Standings Module
```
GET    /api/v1/standings          # Get standings
GET    /api/v1/standings/:id      # Get standings by league/season
```

### Stats Module
```
GET    /api/v1/stats/players      # Player statistics
GET    /api/v1/stats/teams        # Team statistics
GET    /api/v1/stats/leaders      # Statistical leaders
```

### Content Module
```
GET    /api/v1/content/news       # List news articles
POST   /api/v1/content/news       # Create news (CONTENT_ADMIN)
GET    /api/v1/content/stories    # List stories
POST   /api/v1/content/stories    # Create story
GET    /api/v1/content/banners    # List banners
POST   /api/v1/content/banners    # Create banner
```

### Analytics Module
```
POST   /api/v1/analytics/track    # Track event
GET    /api/v1/analytics/dashboard # Get analytics dashboard
```

### Reports Module
```
POST   /api/v1/reports/generate   # Generate report
GET    /api/v1/reports            # List reports
```

### Media Module
```
POST   /api/v1/media/upload       # Upload media
GET    /api/v1/media/:id          # Get media
DELETE /api/v1/media/:id          # Delete media
```

---

## 📡 Real-time Features

### WebSocket Connection
```typescript
// Connect to WebSocket
const socket = io('http://localhost:3000', {
  auth: {
    token: '<jwt_token>',
  },
});

// Listen for real-time events
socket.on('game:updated', (data) => {
  console.log('Game score updated:', data);
});

socket.on('live:score', (data) => {
  console.log('Live score:', data);
});
```

### WebSocket Events

#### Subscribe to Game Updates
```typescript
socket.emit('subscribe:game', {
  gameId: 'game-uuid',
  team1Id: 123,
  team2Id: 456,
});
```

#### Update Live Score
```typescript
socket.emit('update:live-score', {
  gameId: 'game-uuid',
  team1Score: 45,
  team2Score: 38,
  quarter: 2,
});
```

#### Game Start
```typescript
socket.on('game:started', {
  gameId: 'game-uuid',
  team1: { id: 123, name: 'Warriors', city: 'San Francisco' },
  team2: { id: 456, name: 'Lakers', city: 'Los Angeles' },
  startedAt: '2025-11-15T20:00:00Z',
});
```

#### Game Ended
```typescript
socket.on('game:ended', {
  gameId: 'game-uuid',
  finalScore: { team1: 95, team2: 92 },
  endedAt: '2025-11-15T22:30:00Z',
  winner: 'team1',
});
```

---

## 🔗 Frontend Integration Example

### Setup Service
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/v1/admin';

  // Get all admins
  getAdmins(role?: string, isActive?: boolean, page = 1, limit = 20) {
    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit);
    if (role) params = params.set('role', role);
    if (isActive !== undefined) params = params.set('isActive', isActive);
    
    return this.http.get(this.apiUrl, { params });
  }

  // Create admin
  createAdmin(data: CreateAdminUserDto) {
    return this.http.post(this.apiUrl, data);
  }

  // Update admin
  updateAdmin(id: string, data: UpdateAdminUserDto) {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  // Delete admin
  deleteAdmin(id: string) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Toggle active status
  toggleActive(id: string) {
    return this.http.put(`${this.apiUrl}/${id}/toggle-active`, {});
  }

  // Assign role
  assignRole(id: string, roleId: number) {
    return this.http.put(`${this.apiUrl}/${id}/assign-role`, { roleId });
  }

  // Assign team
  assignTeam(id: string, teamId: number) {
    return this.http.put(`${this.apiUrl}/${id}/assign-team`, { teamId });
  }
}
```

### Use in Component
```typescript
export class AdminComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);

  ngOnInit() {
    // Load admins
    this.adminApi.getAdmins('super_admin', true, 1, 20).subscribe(
      response => {
        console.log('Admins:', response.data);
        console.log('Total:', response.meta.total);
      },
      error => {
        console.error('Error loading admins:', error);
      }
    );
  }

  createNewAdmin() {
    const dto = {
      email: 'new@gamepulse.com',
      password: 'SecurePass123!',
      fullName: 'New Admin',
      roleId: 2,
      teamId: null,
    };

    this.adminApi.createAdmin(dto).subscribe(
      response => {
        console.log('Admin created:', response.adminId);
      },
      error => {
        console.error('Error creating admin:', error);
      }
    );
  }
}
```

---

## 📝 Database Schema (Supabase PostgreSQL)

### Tables (inferred from API)

#### admin_users
```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  username VARCHAR(100),
  role_id INT NOT NULL REFERENCES admin_roles(id),
  team_id INT REFERENCES teams(id),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### admin_roles
```sql
CREATE TABLE admin_roles (
  id INT PRIMARY KEY,
  role_name VARCHAR(100) NOT NULL,
  permissions JSON NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
```

#### audit_logs
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES admin_users(id),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(100),
  entity_id VARCHAR(255),
  changes JSONB,
  timestamp TIMESTAMP DEFAULT now()
);
```

---

## 🚀 Rate Limiting

The API includes rate limiting:
- **Limit:** 100 requests per 60 seconds
- **Applied to:** All routes
- **Response Header:** `X-RateLimit-Remaining`

---

## 📚 Swagger Documentation

Access API documentation at:
```
http://localhost:3000/api/docs
```

---

## 🔑 Key Integration Points for Frontend

1. **Authentication:** Use JwtAuthGuard - requires Bearer token
2. **Role-Based Access:** Some endpoints only accessible to SUPER_ADMIN
3. **Permission-Based Access:** Some endpoints require specific permissions
4. **Pagination:** Always use page/limit for list endpoints
5. **Error Handling:** Implement proper error handling for all HTTP responses
6. **Audit Logging:** All admin actions are automatically logged
7. **Real-time Updates:** Use WebSocket for live score updates
8. **Caching:** Responses may be cached via Redis

---

## 📞 Support

For API issues or questions, check:
- Swagger docs: `/api/docs`
- Error response messages for specific issues
- Audit logs for tracking changes
- Connection stats for real-time feature health
