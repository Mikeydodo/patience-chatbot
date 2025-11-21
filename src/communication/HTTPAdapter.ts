import { BaseProtocolAdapter } from './ProtocolAdapter';
import { BotConfig, BotResponse } from '../types';
import axios, { AxiosInstance, AxiosError } from 'axios';

/**
 * HTTP protocol adapter implementation
 */
export class HTTPAdapter extends BaseProtocolAdapter {
  private client: AxiosInstance | null = null;

  /**
   * Connect to the HTTP endpoint
   */
  async connect(config: BotConfig): Promise<void> {
    try {
      this.config = config;

      // Create axios instance with configuration
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...config.headers
      };

      // Add authentication headers if configured
      if (config.authentication) {
        const auth = config.authentication;
        if (auth.type === 'bearer' && typeof auth.credentials === 'string') {
          headers['Authorization'] = `Bearer ${auth.credentials}`;
        } else if (auth.type === 'apikey' && typeof auth.credentials === 'string') {
          headers['X-API-Key'] = auth.credentials;
        }
        // Basic auth is handled by axios config below
      }

      this.client = axios.create({
        baseURL: config.endpoint,
        headers,
        timeout: 30000, // 30 second timeout
        validateStatus: () => true // Don't throw on any status code
      });

      // Add basic auth if configured
      if (config.authentication?.type === 'basic' && typeof config.authentication.credentials === 'object') {
        const { username, password } = config.authentication.credentials;
        this.client.defaults.auth = { username, password };
      }

      // Test connection with a simple request (optional)
      this.connected = true;
    } catch (error) {
      this.handleError(error, 'Failed to connect to HTTP endpoint');
    }
  }

  /**
   * Send a message via HTTP POST request
   */
  async sendMessage(message: string): Promise<BotResponse> {
    this.ensureConnected();

    const startTime = Date.now();

    try {
      const response = await this.client!.post('', {
        message
      });

      const responseTime = Date.now() - startTime;

      // Handle error status codes
      if (response.status >= 400) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        return this.createErrorResponse(error);
      }

      return {
        content: response.data,
        timestamp: new Date(),
        responseTime,
        metadata: {
          statusCode: response.status,
          headers: response.headers,
          protocol: 'http'
        }
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const errorMessage = axiosError.response
          ? `HTTP ${axiosError.response.status}: ${axiosError.message}`
          : `Network error: ${axiosError.message}`;
        
        const err = new Error(errorMessage);
        return {
          ...this.createErrorResponse(err),
          responseTime
        };
      }

      return {
        ...this.createErrorResponse(error as Error),
        responseTime
      };
    }
  }

  /**
   * Disconnect from HTTP endpoint (cleanup)
   */
  async disconnect(): Promise<void> {
    this.client = null;
    this.connected = false;
  }
}
