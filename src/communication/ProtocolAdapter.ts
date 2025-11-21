import { BotConfig, BotResponse } from '../types';

/**
 * Base interface for protocol adapters
 */
export interface ProtocolAdapter {
  connect(config: BotConfig): Promise<void>;
  sendMessage(message: string): Promise<BotResponse>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

/**
 * Custom error class for protocol-specific errors
 */
export class ProtocolError extends Error {
  constructor(
    message: string,
    public protocol: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ProtocolError';
  }
}

/**
 * Abstract base class for protocol adapters with shared error handling
 */
export abstract class BaseProtocolAdapter implements ProtocolAdapter {
  protected config: BotConfig | null = null;
  protected connected: boolean = false;

  abstract connect(config: BotConfig): Promise<void>;
  abstract sendMessage(message: string): Promise<BotResponse>;
  abstract disconnect(): Promise<void>;

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Handle errors with protocol-specific context
   */
  protected handleError(error: unknown, context: string): never {
    const protocol = this.config?.protocol || 'unknown';
    
    if (error instanceof Error) {
      throw new ProtocolError(
        `${context}: ${error.message}`,
        protocol,
        error
      );
    }
    
    throw new ProtocolError(
      `${context}: Unknown error occurred`,
      protocol
    );
  }

  /**
   * Validate that adapter is connected before operations
   */
  protected ensureConnected(): void {
    if (!this.connected) {
      throw new ProtocolError(
        'Adapter is not connected. Call connect() first.',
        this.config?.protocol || 'unknown'
      );
    }
  }

  /**
   * Create a BotResponse object with error information
   */
  protected createErrorResponse(error: Error): BotResponse {
    return {
      content: '',
      timestamp: new Date(),
      error,
      metadata: {
        protocol: this.config?.protocol,
        endpoint: this.config?.endpoint
      }
    };
  }
}
