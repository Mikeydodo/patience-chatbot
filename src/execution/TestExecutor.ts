import {
  TestConfig,
  TestResults,
  ScenarioResult,
  Scenario,
  TestContext,
  ResponseStorage
} from '../types';
import { ScenarioRunner } from './ScenarioRunner';
import { TimingManager } from './TimingManager';
import { createProtocolAdapter } from '../communication';

/**
 * Test execution orchestrator
 */
export class TestExecutor {
  private storage: ResponseStorage;
  private timingManager: TimingManager;

  constructor() {
    this.storage = new ResponseStorage();
    // Will be initialized with config
    this.timingManager = new TimingManager({
      enableDelays: false,
      baseDelay: 0,
      delayPerCharacter: 0,
      rapidFire: true,
      responseTimeout: 30000
    });
  }

  /**
   * Execute all tests from configuration
   */
  async executeTests(config: TestConfig): Promise<TestResults> {
    const testRunId = `test-${Date.now()}`;
    const startTime = new Date();
    const scenarioResults: ScenarioResult[] = [];

    // Initialize timing manager with config
    this.timingManager = new TimingManager(config.timing);

    // Execute each scenario
    for (const scenario of config.scenarios) {
      try {
        const result = await this.executeScenario(scenario, config);
        scenarioResults.push(result);
      } catch (error) {
        // Create failed result for scenario
        const failedResult: ScenarioResult = {
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          passed: false,
          conversationHistory: {
            sessionId: `${scenario.id}-failed`,
            messages: [],
            startTime: new Date(),
            endTime: new Date()
          },
          validationResults: [],
          duration: 0,
          error: error instanceof Error ? error : new Error('Unknown error')
        };
        scenarioResults.push(failedResult);
      }
    }

    const endTime = new Date();
    const passed = scenarioResults.filter(r => r.passed).length;
    const failed = scenarioResults.length - passed;

    return {
      testRunId,
      startTime,
      endTime,
      scenarioResults,
      summary: {
        total: scenarioResults.length,
        passed,
        failed
      }
    };
  }

  /**
   * Execute a single scenario
   */
  async executeScenario(scenario: Scenario, config: TestConfig): Promise<ScenarioResult> {
    const startTime = Date.now();

    try {
      // Create protocol adapter
      const adapter = createProtocolAdapter(config.targetBot);

      // Connect to target bot
      await adapter.connect(config.targetBot);

      // Create scenario runner
      const runner = new ScenarioRunner(this.storage);

      // Run the scenario
      const history = await runner.runScenario(scenario, adapter);

      // Disconnect
      await adapter.disconnect();

      // Generate completion report
      const report = runner.generateCompletionReport(history);
      const duration = Date.now() - startTime;

      return {
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        passed: report.success,
        conversationHistory: history,
        validationResults: report.validationResults,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        passed: false,
        conversationHistory: {
          sessionId: `${scenario.id}-error`,
          messages: [],
          startTime: new Date(startTime),
          endTime: new Date()
        },
        validationResults: [],
        duration,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  /**
   * Handle test failure
   */
  handleTestFailure(error: Error, context: TestContext): void {
    console.error(`Test failure in scenario ${context.scenarioId}:`);
    console.error(`  Session: ${context.sessionId}`);
    console.error(`  Step: ${context.currentStep}`);
    console.error(`  Error: ${error.message}`);

    // Log conversation history if available
    if (context.conversationHistory.messages.length > 0) {
      console.error(`  Last messages:`);
      const recent = context.conversationHistory.messages.slice(-3);
      recent.forEach(msg => {
        console.error(`    ${msg.sender}: ${msg.content.substring(0, 50)}...`);
      });
    }
  }

  /**
   * Get storage instance
   */
  getStorage(): ResponseStorage {
    return this.storage;
  }

  /**
   * Get timing manager
   */
  getTimingManager(): TimingManager {
    return this.timingManager;
  }
}
