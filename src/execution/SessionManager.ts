import { ResponseStorage, ConversationHistory } from '../types';
import type { ProtocolAdapter } from '../communication/ProtocolAdapter';

/**
 * Session manager for handling conversation sessions
 */
export class SessionManager {
  private storage: ResponseStorage;
  private activeSessions: Map<string, SessionInfo> = new Map();

  constructor(storage?: ResponseStorage) {
    this.storage = storage || new ResponseStorage();
  }

  /**
   * Initialize a new session
   * Sends initial message when session begins
   */
  async initializeSession(
    sessionId: string,
    adapter: ProtocolAdapter,
    initialMessage?: string
  ): Promise<ConversationHistory> {
    // Create conversation history
    const history = this.storage.createHistory(sessionId);

    // Store session info
    this.activeSessions.set(sessionId, {
      sessionId,
      adapter,
      startTime: new Date(),
      messageCount: 0
    });

    // Send initial message if provided
    if (initialMessage) {
      this.storage.storePatienceMessage(sessionId, initialMessage);
      const response = await adapter.sendMessage(initialMessage);
      this.storage.storeResponse(sessionId, response);

      // Update message count
      const sessionInfo = this.activeSessions.get(sessionId);
      if (sessionInfo) {
        sessionInfo.messageCount = 2;
      }
    }

    return history;
  }

  /**
   * Get active session info
   */
  getSessionInfo(sessionId: string): SessionInfo | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Check if session is active
   */
  isSessionActive(sessionId: string): boolean {
    return this.activeSessions.has(sessionId);
  }

  /**
   * End a session
   */
  endSession(sessionId: string): void {
    this.storage.finalizeHistory(sessionId);
    this.activeSessions.delete(sessionId);
  }

  /**
   * Get all active session IDs
   */
  getActiveSessions(): string[] {
    return Array.from(this.activeSessions.keys());
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    return this.activeSessions.size;
  }

  /**
   * Clear all sessions
   */
  clearAllSessions(): void {
    this.activeSessions.clear();
    this.storage.clearAll();
  }

  /**
   * Verify session isolation
   * Ensures that sessions have independent state
   */
  verifySessionIsolation(sessionId1: string, sessionId2: string): boolean {
    const history1 = this.storage.getHistory(sessionId1);
    const history2 = this.storage.getHistory(sessionId2);

    if (!history1 || !history2) {
      return false;
    }

    // Sessions should have different IDs
    if (history1.sessionId === history2.sessionId) {
      return false;
    }

    // Sessions should have independent message lists
    return history1.messages !== history2.messages;
  }

  /**
   * Create isolated session
   * Ensures session has no state leakage from other sessions
   */
  createIsolatedSession(sessionId: string): ConversationHistory {
    // Ensure session ID is unique
    if (this.activeSessions.has(sessionId)) {
      throw new Error(`Session ${sessionId} already exists. Sessions must be isolated.`);
    }

    // Create new history with isolated state
    return this.storage.createHistory(sessionId);
  }

  /**
   * Get session state
   * Returns a copy to prevent external modification
   */
  getSessionState(sessionId: string): ConversationHistory | undefined {
    const history = this.storage.getHistory(sessionId);
    if (!history) {
      return undefined;
    }

    // Return a copy to maintain isolation
    return {
      ...history,
      messages: [...history.messages]
    };
  }
}

/**
 * Session information
 */
export interface SessionInfo {
  sessionId: string;
  adapter: ProtocolAdapter;
  startTime: Date;
  messageCount: number;
}
