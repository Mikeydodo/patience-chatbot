import { BotResponse } from './index';

/**
 * Builder class for creating BotResponse objects
 */
export class ResponseBuilder {
  private response: Partial<BotResponse> = {
    timestamp: new Date()
  };

  /**
   * Set the response content
   */
  withContent(content: string | object): ResponseBuilder {
    this.response.content = content;
    return this;
  }

  /**
   * Set the timestamp
   */
  withTimestamp(timestamp: Date): ResponseBuilder {
    this.response.timestamp = timestamp;
    return this;
  }

  /**
   * Set metadata
   */
  withMetadata(metadata: Record<string, any>): ResponseBuilder {
    this.response.metadata = metadata;
    return this;
  }

  /**
   * Add metadata field
   */
  addMetadata(key: string, value: any): ResponseBuilder {
    if (!this.response.metadata) {
      this.response.metadata = {};
    }
    this.response.metadata[key] = value;
    return this;
  }

  /**
   * Set error
   */
  withError(error: Error): ResponseBuilder {
    this.response.error = error;
    return this;
  }

  /**
   * Set response time
   */
  withResponseTime(responseTime: number): ResponseBuilder {
    this.response.responseTime = responseTime;
    return this;
  }

  /**
   * Build the BotResponse object
   */
  build(): BotResponse {
    if (!this.response.content && !this.response.error) {
      throw new Error('BotResponse must have either content or error');
    }

    return {
      content: this.response.content || '',
      timestamp: this.response.timestamp!,
      metadata: this.response.metadata,
      error: this.response.error,
      responseTime: this.response.responseTime
    };
  }
}

/**
 * Create a new ResponseBuilder instance
 */
export function createResponseBuilder(): ResponseBuilder {
  return new ResponseBuilder();
}
