import { Injectable, OnDestroy, signal, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { io, Socket } from 'socket.io-client';

export enum RealtimeEvent {
  // Client -> Server
  SUBSCRIBE_GAME = 'subscribe:game',
  UNSUBSCRIBE_GAME = 'unsubscribe:game',
  SUBSCRIBE_LEAGUE = 'subscribe:league',
  UNSUBSCRIBE_LEAGUE = 'unsubscribe:league',
  SUBSCRIBE_TEAM = 'subscribe:team',
  UNSUBSCRIBE_TEAM = 'unsubscribe:team',

  // Server -> Client
  GAME_UPDATE = 'game:update',
  SCORE_UPDATE = 'score:update',
  QUARTER_END = 'quarter:end',
  GAME_START = 'game:start',
  GAME_END = 'game:end',
  PLAY_BY_PLAY = 'play:update',
  PLAYER_STAT_UPDATE = 'player:stat:update',
  LINEUP_CHANGE = 'lineup:change',

  // League-wide updates
  LEAGUE_STANDINGS_UPDATE = 'league:standings:update',
  MULTIPLE_GAMES_UPDATE = 'league:games:update',

  // System events
  CONNECTION_SUCCESS = 'connection:success',
  ERROR = 'error',
  HEARTBEAT = 'heartbeat',
}

export interface LiveGameUpdate {
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

@Injectable({
  providedIn: 'root',
})
export class WebSocketService implements OnDestroy {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;

  readonly connected = signal(false);
  readonly clientId = signal<string | null>(null);

  // Subjects for different event types
  private readonly liveGamesSubject = new Subject<LiveGameUpdate[]>();
  private readonly gameUpdateSubject = new Subject<LiveGameUpdate>();
  private readonly gameStartSubject = new Subject<any>();
  private readonly gameEndSubject = new Subject<any>();
  private readonly heartbeatSubject = new Subject<{ timestamp: string }>();
  private readonly errorSubject = new Subject<{ message: string }>();

  // Observables
  readonly liveGames$ = this.liveGamesSubject.asObservable();
  readonly gameUpdate$ = this.gameUpdateSubject.asObservable();
  readonly gameStart$ = this.gameStartSubject.asObservable();
  readonly gameEnd$ = this.gameEndSubject.asObservable();
  readonly heartbeat$ = this.heartbeatSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();

  connect(token?: string): void {
    if (this.socket?.connected) {
      console.log('Socket.IO already connected');
      return;
    }

    const wsUrl = environment.apiUrl.replace('/api/v1', '').replace('http', 'ws');

    console.log('Connecting to Socket.IO:', `${wsUrl}/realtime`);

    try {
      const socketOptions: any = {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
      };

      // Add authentication if token is provided
      if (token) {
        socketOptions.query = {
          token: token
        };

        console.log('Connecting with authentication token');
      }

      this.socket = io(`${wsUrl}/realtime`, socketOptions);

      this.setupEventHandlers();
    } catch (error) {
      console.error('Error creating Socket.IO connection:', error);
      this.connected.set(false);
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket.IO connected:', this.socket?.id);
      this.connected.set(true);
      this.reconnectAttempts = 0;

      // Subscribe to league-wide updates
      this.subscribeToLeague();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      this.connected.set(false);
      this.clientId.set(null);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      this.connected.set(false);
      this.reconnectAttempts++;
    });

    // Custom events
    this.socket.on(RealtimeEvent.CONNECTION_SUCCESS, (data: { clientId: string; timestamp: string }) => {
      console.log('Connection success:', data);
      this.clientId.set(data.clientId);
    });

    this.socket.on(RealtimeEvent.MULTIPLE_GAMES_UPDATE, (games: LiveGameUpdate[]) => {
      console.log('Live games update:', games);
      this.liveGamesSubject.next(games);
    });

    this.socket.on(RealtimeEvent.GAME_UPDATE, (game: LiveGameUpdate) => {
      console.log('Game update:', game);
      this.gameUpdateSubject.next(game);
    });

    this.socket.on(RealtimeEvent.GAME_START, (data: any) => {
      console.log('Game started:', data);
      this.gameStartSubject.next(data);
    });

    this.socket.on(RealtimeEvent.GAME_END, (data: any) => {
      console.log('Game ended:', data);
      this.gameEndSubject.next(data);
    });

    this.socket.on(RealtimeEvent.HEARTBEAT, (data: { timestamp: string }) => {
      this.heartbeatSubject.next(data);
    });

    this.socket.on(RealtimeEvent.ERROR, (error: { message: string }) => {
      console.error('Socket.IO error:', error);
      this.errorSubject.next(error);
    });
  }

  subscribeToLeague(): void {
    if (this.socket?.connected) {
      console.log('Subscribing to league updates');
      this.socket.emit(RealtimeEvent.SUBSCRIBE_LEAGUE, {});
    }
  }

  subscribeToGame(gameId: number): void {
    if (this.socket?.connected) {
      console.log('Subscribing to game:', gameId);
      this.socket.emit(RealtimeEvent.SUBSCRIBE_GAME, { gameId });
    }
  }

  unsubscribeFromGame(gameId: number): void {
    if (this.socket?.connected) {
      console.log('Unsubscribing from game:', gameId);
      this.socket.emit(RealtimeEvent.UNSUBSCRIBE_GAME, { gameId });
    }
  }

  unsubscribeFromLeague(): void {
    if (this.socket?.connected) {
      console.log('Unsubscribing from league updates');
      this.socket.emit(RealtimeEvent.UNSUBSCRIBE_LEAGUE, {});
    }
  }

  disconnect(): void {
    if (this.socket) {
      console.log('Disconnecting Socket.IO');
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected.set(false);
    this.clientId.set(null);
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.liveGamesSubject.complete();
    this.gameUpdateSubject.complete();
    this.gameStartSubject.complete();
    this.gameEndSubject.complete();
    this.heartbeatSubject.complete();
    this.errorSubject.complete();
  }
}
