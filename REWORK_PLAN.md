# Admin Dashboard Rework Plan - Real Backend Integration

## Analysis Summary

After thoroughly scanning the GamePulse server backend, I've identified all available endpoints and real-time capabilities. The current implementation uses mock data, but the backend provides comprehensive APIs for all dashboard needs.

## Backend Capabilities Discovered

### 1. **Analytics Module** (`/api/v1/analytics/admin/*`)
✅ **Available Endpoints:**
- `GET /dashboard` - Complete dashboard summary with:
  - Total events, events by type
  - Top content by views
  - User metrics (unique users, authenticated/anonymous)
  - Daily trends
- `GET /content-performance` - Content metrics with views, clicks, shares
- `GET /user-activity` - User engagement with daily active users
- `GET /popular-content` - Most viewed content (7/30 days)
- `GET /event-trends` - Event trends over time
- `GET /entity/:entityType/:entityId` - Entity-specific analytics

### 2. **Games Module** (`/api/v1/games`)
✅ **Available Endpoints:**
- `GET /` - All games with filters (total count available)
- `GET /live` - Currently live games
- `GET /schedule` - Game schedule
- `GET /:id` - Game details
- `GET /:id/boxscore` - Game statistics

### 3. **Teams Module** (`/api/v1/teams`)
✅ **Available Endpoints:**
- `GET /` - All teams (can count for dashboard)
- `GET /:id` - Team details
- `GET /:id/roster` - Team roster
- `GET /:id/stats` - Team statistics

### 4. **Content Module** (`/api/v1/content`)
✅ **Available Endpoints:**
- `GET /news` - News articles with counts
- `GET /home/top-stories` - Top performing stories
- `GET /moments` - Video moments

### 5. **Admin Module** (`/api/v1/admin`)
✅ **Available Endpoints:**
- `GET /` - All admin users (paginated)
- `GET /audit/logs` - Audit logs with filters
- `GET /audit/stats` - Audit statistics (recent actions)

### 6. **Socket.IO Realtime** (`ws://localhost:3000/realtime`)
✅ **Available Events:**
- **Subscribe:** `subscribe:league` - Get league-wide updates
- **Receive:** `league:games:update` - Live games updates
- **Receive:** `game:update` - Individual game updates  
- **Receive:** `game:start` - Game started
- **Receive:** `game:end` - Game ended
- **Receive:** `heartbeat` - Connection keepalive
- **Receive:** `connection:success` - Connection established

## Dashboard Components Mapping

### ✅ **Quick Stats Cards** 
**Data Sources:**
1. **Total Games** → `GET /api/v1/games` (count from response)
2. **Active Users** → `GET /api/v1/analytics/admin/user-activity` (uniqueUsers)
3. **Teams** → `GET /api/v1/teams` (count from response)
4. **News** → `GET /api/v1/content/news` (count from response)

**Trend Data:** Compare with previous period using date filters

### ✅ **System Health**
**Data Sources:**
- **Mock/Calculated** (backend doesn't provide health endpoint)
- Can track API response times client-side
- Can monitor WebSocket connection status
- Alternative: Use analytics event counts as proxy for system activity

### ✅ **Real-time Activity**
**Data Sources:**
1. **Live Games** → `GET /api/v1/games/live` + Socket.IO `league:games:update`
2. **Users Online** → `GET /api/v1/analytics/admin/user-activity` (recent events)
3. **Active Sessions** → Analytics events in last 30 minutes
4. **Scorekeeper Users** → Count admin users with live game permissions

### ✅ **User Engagement Chart**
**Data Sources:**
- `GET /api/v1/analytics/admin/event-trends?days=30`
- `GET /api/v1/analytics/admin/user-activity?startDate=X&endDate=Y`
- Daily active users from `dailyActiveUsers` array

### ✅ **Content Performance**
**Data Sources:**
- `GET /api/v1/analytics/admin/content-performance?limit=10`
- `GET /api/v1/analytics/admin/popular-content?days=7&limit=10`
- Returns: entityType, entityId, views, clicks, shares

### ✅ **Admin Actions Table**
**Data Sources:**
- `GET /api/v1/admin/audit/logs?page=1&limit=10`
- Returns: user, action, entityType, entityId, timestamp, old/new values

### ✅ **Alerts & Issues**
**Data Sources:**
- Games without officials: Filter games data
- Pending content: `GET /api/v1/content/news?published=false`
- System warnings: Monitor WebSocket disconnections, API errors

### ✅ **Pending Approvals**
**Data Sources:**
- News pending: `GET /api/v1/content/news?published=false`
- User registrations: `GET /api/v1/admin?isActive=false`
- Roster changes: Check audit logs for pending team updates

## Implementation Plan

### Phase 1: Update WebSocket Service (Socket.IO)
**File:** `src/app/core/services/websocket.service.ts`

**Changes:**
- ✅ Install `socket.io-client`
- Replace WebSocket with Socket.IO client
- Connect to `/realtime` namespace
- Implement event handlers:
  - `subscribe:league`
  - `league:games:update`
  - `game:update`
  - `connection:success`
  - `heartbeat`
- Add authentication (JWT token)
- Auto-reconnection handling

### Phase 2: Rewrite API Service
**File:** `src/app/core/services/admin-api.service.ts`

**Changes:**
- Remove all mock data
- Implement real API calls:
  ```typescript
  // Dashboard Stats
  getDashboardStats() → GET /analytics/admin/dashboard
  
  // Real-time Activity  
  getRealtimeActivity() → GET /games/live + analytics
  
  // User Engagement
  getUserEngagement(days) → GET /analytics/admin/event-trends?days={days}
  
  // Content Performance
  getContentPerformance(limit) → GET /analytics/admin/content-performance?limit={limit}
  
  // Admin Actions
  getAdminActions(limit) → GET /admin/audit/logs?limit={limit}
  
  // Alerts
  getAlerts() → Aggregate from multiple sources
  
  // Pending Approvals
  getPendingApprovals() → Aggregate from admin/content endpoints
  ```

### Phase 3: Update Type Definitions
**File:** `src/app/core/models/admin.models.ts`

**Changes:**
- Match backend response structures
- Add new interfaces from analytics module:
  - `AnalyticsDashboard`
  - `ContentPerformanceResponse`
  - `UserActivityResponse`
  - `AuditLog`
  - `EventTrend`

### Phase 4: Update Components
**No major changes needed** - Components already use signals and reactive patterns

### Phase 5: Environment Configuration
**Files:** `environment.ts`, `environment.prod.ts`

**Changes:**
- Add proper API URLs
- Add WebSocket namespace path
- Add authentication headers

### Phase 6: Add Authentication
**File:** `src/app/core/interceptors/auth.interceptor.ts`

**Changes:**
- Ensure JWT token is sent with all API requests
- Add token to WebSocket connection

## Real vs Mock Data

| Component | Current | After Rework |
|-----------|---------|--------------|
| Quick Stats | Mock | ✅ Real API (`/games`, `/teams`, `/content/news`, `/analytics/admin/user-activity`) |
| System Health | Mock | ⚠️ Hybrid (Client-side monitoring + API response tracking) |
| Realtime Activity | Mock | ✅ Real Socket.IO + API (`/games/live`, `/analytics`) |
| User Engagement | Mock | ✅ Real API (`/analytics/admin/event-trends`) |
| Content Performance | Partial | ✅ Real API (`/analytics/admin/content-performance`) |
| Admin Actions | Mock | ✅ Real API (`/admin/audit/logs`) |
| Alerts | Mock | ✅ Real (Aggregated from multiple sources) |
| Pending Approvals | Mock | ✅ Real (Aggregated from `/admin`, `/content`) |

## Socket.IO Implementation Example

```typescript
import { io, Socket } from 'socket.io-client';

export class WebSocketService {
  private socket: Socket | null = null;
  
  connect(token: string): void {
    this.socket = io('http://localhost:3000/realtime', {
      auth: { token },
      transports: ['websocket'],
    });
    
    this.socket.on('connection:success', (data) => {
      console.log('Connected:', data.clientId);
      // Subscribe to league updates
      this.socket?.emit('subscribe:league', {});
    });
    
    this.socket.on('league:games:update', (games) => {
      this.gamesSubject.next(games);
    });
    
    this.socket.on('heartbeat', (data) => {
      console.log('Heartbeat:', data.timestamp);
    });
  }
}
```

## Benefits of Rework

1. **Real Data**: Dashboard shows actual system metrics
2. **Real-time Updates**: Live games update instantly via Socket.IO
3. **Accurate Analytics**: User engagement and content performance from real tracking
4. **Audit Trail**: Real admin actions logged and displayed
5. **Production Ready**: No mock data, fully integrated with backend
6. **Scalable**: Proper caching and pagination support
7. **Authenticated**: Secure API calls with JWT tokens
8. **Type Safe**: TypeScript interfaces match backend responses

## Testing Strategy

1. **Local Development**:
   - Backend: `http://localhost:3000`
   - WebSocket: `ws://localhost:3000/realtime`
   - Requires backend server running

2. **Production**:
   - Update environment.prod.ts with production URLs
   - Ensure CORS is configured on backend

## Timeline Estimate

- Phase 1 (WebSocket): 30 minutes
- Phase 2 (API Service): 45 minutes  
- Phase 3 (Types): 15 minutes
- Phase 4 (Testing): 30 minutes
- **Total: ~2 hours**

## Next Steps

1. ✅ Install socket.io-client (DONE)
2. Await your approval
3. Implement Phase 1-4
4. Test with running backend
5. Verify all data flows correctly

---

**Ready to proceed with the rework?** This will replace all mock data with real backend integration and Socket.IO for live updates.
