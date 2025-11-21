import {
  Scenario,
  ConversationHistory,
  ConversationStep,
  BotResponse,
  Condition,
  ConversationMessage,
  ResponseStorage,
  ResponseParser,
  ValidationResult
} from '../types';
import type { ProtocolAdapter } from '../communication/ProtocolAdapter';
import { ResponseValidator } from '../validation/ResponseValidator';
import { MessageGenerator } from './MessageGenerator';

/**
 * Scenario execution runner
 */
export class ScenarioRunner {
  private storage: ResponseStorage;
  private validator: ResponseValidator;
  private messageGenerator: MessageGenerator;
  private currentAdapter: ProtocolAdapter | null = null;
  private currentStepIndex: number = 0;
  private currentScenario: Scenario | null = null;

  constructor(storage?: ResponseStorage) {
    this.storage = storage || new ResponseStorage();
    this.validator = new ResponseValidator();
    this.messageGenerator = new MessageGenerator();
  }

  /**
   * Run a complete scenario
   * Executes all steps and returns conversation history
   */
  async runScenario(scenario: Scenario, adapter: ProtocolAdapter): Promise<ConversationHistory> {
    this.currentAdapter = adapter;
    this.currentScenario = scenario;
    this.currentStepIndex = 0;
    const sessionId = `${scenario.id}-${Date.now()}`;

    // Create conversation history
    const history = this.storage.createHistory(sessionId);

    try {
      // Execute each step in sequence
      for (let i = 0; i < scenario.steps.length; i++) {
        this.currentStepIndex = i;
        const step = scenario.steps[i];

        // Execute the step
        const response = await this.executeStep(step);

        // Store the interaction
        const message = this.getStepMessage(step);
        this.storage.storePatienceMessage(sessionId, message);
        this.storage.storeResponse(sessionId, response);

        // Validate response if criteria specified
        if (step.expectedResponse) {
          const validationResult = this.validator.validate(response, {
            type: step.expectedResponse.validationType,
            expected: step.expectedResponse.expected,
            threshold: step.expectedResponse.threshold
          });

          // Update last message with validation result
          const messages = this.storage.getMessages(sessionId);
          if (messages.length > 0) {
            messages[messages.length - 1].validationResult = validationResult;
          }
        }

        // Handle conditional branches
        if (step.conditionalBranches && step.conditionalBranches.length > 0) {
          const nextStep = this.handleConditionalBranches(step.conditionalBranches, response);
          if (nextStep) {
            // Execute the conditional branch step
            const branchResponse = await this.executeStep(nextStep);
            const branchMessage = this.getStepMessage(nextStep);
            this.storage.storePatienceMessage(sessionId, branchMessage);
            this.storage.storeResponse(sessionId, branchResponse);
          }
        }

        // Apply delay if specified
        if (step.delay) {
          await this.delay(step.delay);
        }
      }

      // Finalize history
      this.storage.finalizeHistory(sessionId);

      return this.storage.getHistory(sessionId)!;
    } catch (error) {
      // Finalize history even on error
      this.storage.finalizeHistory(sessionId);

      // Add error to history
      const history = this.storage.getHistory(sessionId);
      if (history) {
        return history;
      }

      throw error;
    }
  }

  /**
   * Execute a single conversation step
   */
  async executeStep(step: ConversationStep): Promise<BotResponse> {
    if (!this.currentAdapter) {
      throw new Error('No adapter configured. Call runScenario first.');
    }

    // Get the message to send
    const message = this.getStepMessage(step);

    // Send message and get response
    const response = await this.currentAdapter.sendMessage(message);

    return response;
  }

  /**
   * Get the message content from a conversation step
   */
  private getStepMessage(step: ConversationStep): string {
    if (typeof step.message === 'string') {
      return step.message;
    }

    // Generate message based on configuration
    const config = step.message;
    return this.messageGenerator.generateMessage(config.type, config.constraints);
  }

  /**
   * Handle conditional branches
   * Returns the next step to execute based on conditions
   */
  private handleConditionalBranches(
    branches: Array<{ condition: Condition; nextStep: ConversationStep }>,
    response: BotResponse
  ): ConversationStep | null {
    for (let i = 0; i < branches.length; i++) {
      const branch = branches[i];
      if (this.evaluateCondition(branch.condition, response)) {
        return branch.nextStep;
      }
    }

    return null;
  }

  /**
   * Handle a single conditional branch (public method)
   * Evaluates condition and returns the appropriate next step
   */
  handleConditionalBranch(condition: Condition, response: BotResponse): ConversationStep | null {
    // Evaluate the condition
    const matches = this.evaluateCondition(condition, response);
    
    // This method doesn't have access to the next step, so it returns null
    // The actual branch selection happens in handleConditionalBranches
    return null;
  }

  /**
   * Select the appropriate branch based on response
   * Returns the index of the selected branch, or -1 if none match
   */
  selectBranch(
    branches: Array<{ condition: Condition; nextStep: ConversationStep }>,
    response: BotResponse
  ): number {
    for (let i = 0; i < branches.length; i++) {
      if (this.evaluateCondition(branches[i].condition, response)) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Evaluate a condition against a response
   */
  private evaluateCondition(condition: Condition, response: BotResponse): boolean {
    const content = ResponseParser.extractText(response);

    switch (condition.type) {
      case 'contains':
        return content.includes(String(condition.value));

      case 'matches':
        if (condition.value instanceof RegExp) {
          return condition.value.test(content);
        }
        return new RegExp(String(condition.value)).test(content);

      case 'equals':
        return content === String(condition.value);

      case 'custom':
        if (condition.customEvaluator) {
          return condition.customEvaluator(response);
        }
        return false;

      default:
        return false;
    }
  }

  /**
   * Delay execution for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get the current conversation history
   */
  getHistory(sessionId: string): ConversationHistory | undefined {
    return this.storage.getHistory(sessionId);
  }

  /**
   * Get the current step index
   */
  getCurrentStepIndex(): number {
    return this.currentStepIndex;
  }

  /**
   * Get the current scenario
   */
  getCurrentScenario(): Scenario | null {
    return this.currentScenario;
  }

  /**
   * Check if there are more steps to execute
   */
  hasMoreSteps(): boolean {
    if (!this.currentScenario) {
      return false;
    }
    return this.currentStepIndex < this.currentScenario.steps.length - 1;
  }

  /**
   * Advance to the next step
   */
  advanceStep(): boolean {
    if (this.hasMoreSteps()) {
      this.currentStepIndex++;
      return true;
    }
    return false;
  }

  /**
   * Generate a completion report for a scenario
   */
  generateCompletionReport(history: ConversationHistory): {
    scenarioId: string;
    completed: boolean;
    totalSteps: number;
    executedSteps: number;
    validationResults: ValidationResult[];
    allValidationsPassed: boolean;
    duration: number;
    success: boolean;
  } {
    const validationResults: ValidationResult[] = [];
    let allValidationsPassed = true;

    // Extract validation results from messages
    for (const message of history.messages) {
      if (message.validationResult) {
        validationResults.push(message.validationResult);
        if (!message.validationResult.passed) {
          allValidationsPassed = false;
        }
      }
    }

    const duration = history.endTime.getTime() - history.startTime.getTime();
    const executedSteps = Math.floor(history.messages.length / 2); // Each step has 2 messages (patience + target)

    return {
      scenarioId: history.sessionId,
      completed: true,
      totalSteps: this.currentScenario?.steps.length || executedSteps,
      executedSteps,
      validationResults,
      allValidationsPassed,
      duration,
      success: allValidationsPassed
    };
  }

  /**
   * Check if scenario execution was successful
   */
  isScenarioSuccessful(history: ConversationHistory): boolean {
    // Check if all validations passed
    for (const message of history.messages) {
      if (message.validationResult && !message.validationResult.passed) {
        return false;
      }
    }

    // Check if there were any errors
    const hasErrors = history.messages.some(msg => 
      msg.content.includes('Error:') || msg.content.includes('error')
    );

    return !hasErrors;
  }

  /**
   * Get scenario execution summary
   */
  getExecutionSummary(history: ConversationHistory): {
    totalMessages: number;
    patienceMessages: number;
    targetMessages: number;
    validations: number;
    passedValidations: number;
    failedValidations: number;
  } {
    const messages = history.messages;
    const patienceMessages = messages.filter(m => m.sender === 'patience').length;
    const targetMessages = messages.filter(m => m.sender === 'target').length;
    
    const validations = messages.filter(m => m.validationResult).length;
    const passedValidations = messages.filter(m => 
      m.validationResult && m.validationResult.passed
    ).length;
    const failedValidations = validations - passedValidations;

    return {
      totalMessages: messages.length,
      patienceMessages,
      targetMessages,
      validations,
      passedValidations,
      failedValidations
    };
  }
}
