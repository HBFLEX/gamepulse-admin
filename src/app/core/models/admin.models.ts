// Analytics Dashboard Response
export interface AnalyticsDashboardResponse {
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalEvents: number;
    eventsByType: Array<{ eventType: string; count: number }>;
    uniqueUsers: number;
    totalViews: number;
  };
  topContent: Array<{
    entityType: string;
    entityId: number;
    views: number;
  }>;
  userMetrics: {
    uniqueUsers: number;
    authenticatedUsers: number;
    anonymousUsers: number;
  };
  trends: Array<{
    date: string;
    count: number;
  }>;
  generatedAt: string;
}

export interface DashboardStats {
  totalGames: number;
  totalGamesChange: number;
  activeUsers: number;
  activeUsersChange: number;
  totalTeams: number;
  totalNews: number;
}

export interface SystemHealth {
  status: 'operational' | 'degraded' | 'down';
  database: {
    uptime: number;
    status: 'healthy' | 'unhealthy';
  };
  cache: {
    hitRate: number;
    status: 'healthy' | 'unhealthy';
  };
  api: {
    avgResponseTime: number;
    status: 'healthy' | 'unhealthy';
  };
}

export interface RealtimeActivity {
  liveGames: number;
  usersOnline: number;
  activeSessions: number;
  activeScorekeeperUsers: number;
}

export interface UserEngagement {
  date: string;
  activeUsers: number;
  pageViews: number;
  avgSessionDuration: number;
}

// User Activity Response from Analytics
export interface UserActivityResponse {
  uniqueUsers: number;
  totalEvents: number;
  authenticatedEvents: number;
  anonymousEvents: number;
  dailyActiveUsers: Array<{
    date: string;
    count: number;
  }>;
  period: {
    start: string;
    end: string;
  };
}

export interface ContentPerformance {
  id: number;
  title: string;
  views: number;
  type: 'story' | 'moment' | 'news';
  publishedAt: string;
}

// Content Performance Response from Analytics
export interface ContentPerformanceResponse {
  data: Array<{
    entityType: string;
    entityId: number;
    views: number;
    clicks: number;
    shares: number;
    totalEvents: number;
  }>;
  meta: {
    total: number;
    limit: number;
  };
}

export interface AdminAction {
  id: string;
  user: string;
  action: string;
  entity: string;
  entityId: number;
  timestamp: Date;
  details?: string;
}

// Audit Log Response from Admin Module
export interface AuditLogResponse {
  data: Array<{
    id: number;
    user_id: string;
    action: string;
    entity_type: string;
    entity_id: number | null;
    old_values: any;
    new_values: any;
    created_at: string;
    user?: {
      id: string;
      email: string;
      full_name: string;
    };
  }>;
  meta: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  count?: number;
  link?: string;
}

export interface PendingApproval {
  id: string;
  type: 'news' | 'roster' | 'user' | 'game';
  title: string;
  count: number;
  link: string;
}

export interface Game {
  id: number;
  homeTeam: {
    id: number;
    name: string;
    logo?: string;
  };
  awayTeam: {
    id: number;
    name: string;
    logo?: string;
  };
  status: 'scheduled' | 'live' | 'final' | 'postponed' | 'cancelled';
  scheduledDate: string;
  location?: string;
  homeScore?: number;
  awayScore?: number;
}

// Games API Response
export interface GamesResponse {
  data: any[];
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

// Live Game from Socket.IO
export interface LiveGame {
  gameId: number;
  timestamp: string;
  eventType: string;
  homeScore: number;
  awayScore: number;
  quarter: number;
  timeRemaining: number;
  status: string;
  isLive: boolean;
}

export interface Team {
  id: number;
  name: string;
  abbreviation: string;
  logo?: string;
  division?: string;
  league?: string;
}

export interface Story {
  id: number;
  title: string;
  excerpt: string;
  imageUrl?: string;
  author: string;
  publishedAt: string;
  featured: boolean;
  categoryId: number;
  views: number;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  lastLogin?: string;
}
