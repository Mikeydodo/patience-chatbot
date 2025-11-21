/**
 * Communication module
 * Handles protocol-specific interactions with Target Bots
 */

export * from './ProtocolAdapter';
export * from './HTTPAdapter';
export * from './WebSocketAdapter';

import { ProtocolAdapter } from './ProtocolAdapter';
import { HTTPAdapter } from './HTTPAdapter';
import { WebSocketAdapter } from './WebSocketAdapter';
import { BotConfig } from '../types';

/**
 * Factory function to create the appropriate protocol adapter based on configuration
 * @param config Bot configuration containing protocol type
 * @returns Instance of the appropriate protocol adapter
 */
export function createProtocolAdapter(config: BotConfig): ProtocolAdapter {
  switch (config.protocol) {
    case 'http':
      return new HTTPAdapter();
    case 'websocket':
      return new WebSocketAdapter();
    default:
      throw new Error(`Unsupported protocol: ${config.protocol}. Supported protocols are: http, websocket`);
  }
}
