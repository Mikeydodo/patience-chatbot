import { TestConfig, Scenario, ValidationResult } from '../types';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

/**
 * Configuration management class
 */
export class ConfigurationManager {
  private watchers: Map<string, fsSync.FSWatcher> = new Map();
  private currentConfig: TestConfig | null = null;
  private configFilePath: string | null = null;
  private reloadCallbacks: Array<(config: TestConfig) => void> = [];
  /**
   * Load configuration from a file (JSON or YAML)
   * @param filePath Path to the configuration file
   * @returns Parsed TestConfig object
   */
  async loadConfig(filePath: string): Promise<TestConfig> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const ext = path.extname(filePath).toLowerCase();
      
      let config: any;
      
      if (ext === '.json') {
        config = JSON.parse(fileContent);
      } else if (ext === '.yaml' || ext === '.yml') {
        config = yaml.load(fileContent);
      } else {
        throw new Error(`Unsupported file format: ${ext}. Only .json, .yaml, and .yml are supported.`);
      }
      
      this.currentConfig = config as TestConfig;
      this.configFilePath = filePath;
      
      return config as TestConfig;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load configuration from ${filePath}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Validate configuration object
   * @param config TestConfig object to validate
   * @returns ValidationResult with detailed error messages
   */
  validateConfig(config: TestConfig): ValidationResult {
    const errors: string[] = [];

    // Validate targetBot
    if (!config.targetBot) {
      errors.push('Missing required field: targetBot');
    } else {
      if (!config.targetBot.name || typeof config.targetBot.name !== 'string') {
        errors.push('targetBot.name is required and must be a string');
      }
      if (!config.targetBot.protocol || !['http', 'websocket'].includes(config.targetBot.protocol)) {
        errors.push('targetBot.protocol is required and must be either "http" or "websocket"');
      }
      if (!config.targetBot.endpoint || typeof config.targetBot.endpoint !== 'string') {
        errors.push('targetBot.endpoint is required and must be a string');
      }
      
      // Validate authentication if present
      if (config.targetBot.authentication) {
        const auth = config.targetBot.authentication;
        if (!auth.type || !['bearer', 'basic', 'apikey'].includes(auth.type)) {
          errors.push('targetBot.authentication.type must be one of: "bearer", "basic", "apikey"');
        }
        if (!auth.credentials) {
          errors.push('targetBot.authentication.credentials is required when authentication is specified');
        }
      }
    }

    // Validate scenarios
    if (!config.scenarios || !Array.isArray(config.scenarios)) {
      errors.push('scenarios is required and must be an array');
    } else if (config.scenarios.length === 0) {
      errors.push('scenarios array must contain at least one scenario');
    } else {
      config.scenarios.forEach((scenario, index) => {
        if (!scenario.id || typeof scenario.id !== 'string') {
          errors.push(`scenarios[${index}].id is required and must be a string`);
        }
        if (!scenario.name || typeof scenario.name !== 'string') {
          errors.push(`scenarios[${index}].name is required and must be a string`);
        }
        if (!scenario.steps || !Array.isArray(scenario.steps)) {
          errors.push(`scenarios[${index}].steps is required and must be an array`);
        } else if (scenario.steps.length === 0) {
          errors.push(`scenarios[${index}].steps array must contain at least one step`);
        }
        if (!scenario.expectedOutcomes || !Array.isArray(scenario.expectedOutcomes)) {
          errors.push(`scenarios[${index}].expectedOutcomes is required and must be an array`);
        }
      });
    }

    // Validate validation config
    if (!config.validation) {
      errors.push('Missing required field: validation');
    } else {
      if (!config.validation.defaultType || !['exact', 'pattern', 'semantic', 'custom'].includes(config.validation.defaultType)) {
        errors.push('validation.defaultType is required and must be one of: "exact", "pattern", "semantic", "custom"');
      }
      if (config.validation.semanticSimilarityThreshold !== undefined) {
        const threshold = config.validation.semanticSimilarityThreshold;
        if (typeof threshold !== 'number' || threshold < 0 || threshold > 1) {
          errors.push('validation.semanticSimilarityThreshold must be a number between 0 and 1');
        }
      }
    }

    // Validate timing config
    if (!config.timing) {
      errors.push('Missing required field: timing');
    } else {
      if (typeof config.timing.enableDelays !== 'boolean') {
        errors.push('timing.enableDelays is required and must be a boolean');
      }
      if (typeof config.timing.baseDelay !== 'number' || config.timing.baseDelay < 0) {
        errors.push('timing.baseDelay is required and must be a non-negative number');
      }
      if (typeof config.timing.delayPerCharacter !== 'number' || config.timing.delayPerCharacter < 0) {
        errors.push('timing.delayPerCharacter is required and must be a non-negative number');
      }
      if (typeof config.timing.rapidFire !== 'boolean') {
        errors.push('timing.rapidFire is required and must be a boolean');
      }
      if (typeof config.timing.responseTimeout !== 'number' || config.timing.responseTimeout <= 0) {
        errors.push('timing.responseTimeout is required and must be a positive number');
      }
    }

    // Validate reporting config
    if (!config.reporting) {
      errors.push('Missing required field: reporting');
    } else {
      if (!config.reporting.outputPath || typeof config.reporting.outputPath !== 'string') {
        errors.push('reporting.outputPath is required and must be a string');
      }
      if (!config.reporting.formats || !Array.isArray(config.reporting.formats)) {
        errors.push('reporting.formats is required and must be an array');
      } else if (config.reporting.formats.length === 0) {
        errors.push('reporting.formats array must contain at least one format');
      } else {
        const validFormats = ['json', 'html', 'markdown'];
        config.reporting.formats.forEach((format, index) => {
          if (!validFormats.includes(format)) {
            errors.push(`reporting.formats[${index}] must be one of: "json", "html", "markdown"`);
          }
        });
      }
      if (typeof config.reporting.includeConversationHistory !== 'boolean') {
        errors.push('reporting.includeConversationHistory is required and must be a boolean');
      }
      if (typeof config.reporting.verboseErrors !== 'boolean') {
        errors.push('reporting.verboseErrors is required and must be a boolean');
      }
    }

    const passed = errors.length === 0;
    return {
      passed,
      actual: passed ? 'Valid configuration' : 'Invalid configuration',
      message: errors.length > 0 ? errors.join('; ') : 'Configuration is valid',
      details: { errors }
    };
  }

  /**
   * Load scenarios from a file (JSON or YAML)
   * @param scenarioPath Path to the scenario file
   * @returns Array of Scenario objects
   */
  async loadScenarios(scenarioPath: string): Promise<Scenario[]> {
    try {
      const fileContent = await fs.readFile(scenarioPath, 'utf-8');
      const ext = path.extname(scenarioPath).toLowerCase();
      
      let data: any;
      
      if (ext === '.json') {
        data = JSON.parse(fileContent);
      } else if (ext === '.yaml' || ext === '.yml') {
        data = yaml.load(fileContent);
      } else {
        throw new Error(`Unsupported file format: ${ext}. Only .json, .yaml, and .yml are supported.`);
      }
      
      // Support both array of scenarios and object with scenarios property
      let scenarios: Scenario[];
      if (Array.isArray(data)) {
        scenarios = data;
      } else if (data.scenarios && Array.isArray(data.scenarios)) {
        scenarios = data.scenarios;
      } else {
        throw new Error('Scenario file must contain an array of scenarios or an object with a "scenarios" property');
      }
      
      return scenarios;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load scenarios from ${scenarioPath}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Enable hot-reload for configuration file
   * @param callback Function to call when configuration is reloaded
   */
  enableHotReload(callback?: (config: TestConfig) => void): void {
    if (!this.configFilePath) {
      throw new Error('No configuration file loaded. Call loadConfig first.');
    }

    if (callback) {
      this.reloadCallbacks.push(callback);
    }

    // Stop existing watcher if any
    if (this.watchers.has(this.configFilePath)) {
      this.watchers.get(this.configFilePath)?.close();
    }

    // Create new watcher
    const watcher = fsSync.watch(this.configFilePath, async (eventType) => {
      if (eventType === 'change') {
        try {
          const newConfig = await this.loadConfig(this.configFilePath!);
          
          // Notify all callbacks
          this.reloadCallbacks.forEach(cb => cb(newConfig));
        } catch (error) {
          console.error('Failed to reload configuration:', error);
        }
      }
    });

    this.watchers.set(this.configFilePath, watcher);
  }

  /**
   * Disable hot-reload for configuration file
   */
  disableHotReload(): void {
    this.watchers.forEach(watcher => watcher.close());
    this.watchers.clear();
    this.reloadCallbacks = [];
  }

  /**
   * Get the current loaded configuration
   * @returns Current TestConfig or null if not loaded
   */
  getCurrentConfig(): TestConfig | null {
    return this.currentConfig;
  }

  /**
   * Manually reload configuration from the previously loaded file
   * @returns Reloaded TestConfig
   */
  async reloadConfig(): Promise<TestConfig> {
    if (!this.configFilePath) {
      throw new Error('No configuration file loaded. Call loadConfig first.');
    }

    const newConfig = await this.loadConfig(this.configFilePath);
    
    // Notify all callbacks
    this.reloadCallbacks.forEach(cb => cb(newConfig));
    
    return newConfig;
  }
}
