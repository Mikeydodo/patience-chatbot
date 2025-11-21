import { ResponseStorage, ConversationMessage } from '../types';

/**
 * Context manager for handling multi-turn conversation context
 */
export class ContextManager {
  private storage: ResponseStorage;

  constructor(storage?: ResponseStorage) {
    this.storage = storage || new ResponseStorage();
  }

  /**
   * Generate a message that references previous context
   * Adds referential links to earlier messages
   */
  generateContextualMessage(
    sessionId: string,
    baseMessage: string,
    referenceCount: number = 1
  ): string {
    const messages = this.storage.getMessages(sessionId);
    
    if (messages.length === 0) {
      return baseMessage;
    }

    // Get recent messages to reference
    const recentMessages = messages.slice(-referenceCount * 2); // *2 to account for both patience and target
    
    // Extract key terms from previous messages
    const previousContent = recentMessages
      .filter(m => m.sender === 'target')
      .map(m => m.content)
      .join(' ');

    // Add contextual reference
    if (previousContent.length > 0) {
      const snippet = this.extractKeyPhrase(previousContent);
      return `Regarding "${snippet}", ${baseMessage}`;
    }

    return baseMessage;
  }

  /**
   * Extract a key phrase from content for referencing
   */
  private extractKeyPhrase(content: string, maxLength: number = 30): string {
    const words = content.trim().split(/\s+/);
    
    if (words.length <= 5) {
      return content;
    }

    // Take first few words
    const phrase = words.slice(0, 5).join(' ');
    
    if (phrase.length > maxLength) {
      return phrase.substring(0, maxLength) + '...';
    }

    return phrase;
  }

  /**
   * Get conversation context for a session
   * Returns recent messages that can be referenced
   */
  getConversationContext(sessionId: string, messageCount: number = 5): ConversationMessage[] {
    return this.storage.getRecentMessages(sessionId, messageCount);
  }

  /**
   * Check if a message references previous context
   * Looks for referential words and phrases
   */
  hasContextReference(message: string): boolean {
    const referentialWords = [
      'that',
      'this',
      'it',
      'the above',
      'what you mentioned',
      'as you said',
      'previously',
      'earlier',
      'before',
      'regarding',
      'about that',
      'your previous',
      'you said',
      'you mentioned'
    ];

    const lowerMessage = message.toLowerCase();
    return referentialWords.some(word => lowerMessage.includes(word));
  }

  /**
   * Build context summary from conversation history
   */
  buildContextSummary(sessionId: string): string {
    const messages = this.storage.getMessages(sessionId);
    
    if (messages.length === 0) {
      return 'No conversation history';
    }

    const summary: string[] = [];
    summary.push(`Total messages: ${messages.length}`);
    summary.push(`Patience messages: ${messages.filter(m => m.sender === 'patience').length}`);
    summary.push(`Target messages: ${messages.filter(m => m.sender === 'target').length}`);

    // Add recent exchange
    const recent = messages.slice(-2);
    if (recent.length > 0) {
      summary.push('\nRecent exchange:');
      recent.forEach(msg => {
        const preview = msg.content.substring(0, 50);
        summary.push(`  ${msg.sender}: ${preview}${msg.content.length > 50 ? '...' : ''}`);
      });
    }

    return summary.join('\n');
  }

  /**
   * Get all messages from a specific sender
   */
  getMessagesBySender(sessionId: string, sender: 'patience' | 'target'): ConversationMessage[] {
    return this.storage.getMessagesBySender(sessionId, sender);
  }

  /**
   * Find messages containing specific content
   */
  findMessagesContaining(sessionId: string, searchTerm: string): ConversationMessage[] {
    const messages = this.storage.getMessages(sessionId);
    return messages.filter(msg => 
      msg.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  /**
   * Get the last message from Target Bot
   */
  getLastTargetMessage(sessionId: string): ConversationMessage | undefined {
    const targetMessages = this.getMessagesBySender(sessionId, 'target');
    return targetMessages[targetMessages.length - 1];
  }

  /**
   * Get the last message from Patience
   */
  getLastPatienceMessage(sessionId: string): ConversationMessage | undefined {
    const patienceMessages = this.getMessagesBySender(sessionId, 'patience');
    return patienceMessages[patienceMessages.length - 1];
  }

  /**
   * Create a follow-up message based on previous response
   */
  createFollowUpMessage(sessionId: string, baseQuestion: string): string {
    const lastTarget = this.getLastTargetMessage(sessionId);
    
    if (!lastTarget) {
      return baseQuestion;
    }

    // Extract key term from last response
    const keyPhrase = this.extractKeyPhrase(lastTarget.content, 20);
    
    return `You mentioned "${keyPhrase}". ${baseQuestion}`;
  }

  /**
   * Validate that Target Bot demonstrates context awareness
   * Checks if response references or relates to previous conversation
   */
  validateContextRetention(
    sessionId: string,
    currentResponse: string,
    lookbackCount: number = 3
  ): {
    hasContext: boolean;
    confidence: number;
    details: string;
  } {
    const recentMessages = this.storage.getRecentMessages(sessionId, lookbackCount * 2);
    
    if (recentMessages.length < 2) {
      return {
        hasContext: false,
        confidence: 0,
        details: 'Not enough conversation history to validate context'
      };
    }

    // Get previous Patience messages (what we asked)
    const previousPatienceMessages = recentMessages
      .filter(m => m.sender === 'patience')
      .map(m => m.content);

    // Check if current response relates to previous questions
    let contextScore = 0;
    const maxScore = previousPatienceMessages.length;

    for (const prevMessage of previousPatienceMessages) {
      if (this.responsesRelate(prevMessage, currentResponse)) {
        contextScore++;
      }
    }

    const confidence = maxScore > 0 ? contextScore / maxScore : 0;
    const hasContext = confidence > 0.3; // 30% threshold

    return {
      hasContext,
      confidence,
      details: `Response relates to ${contextScore} of ${maxScore} previous messages`
    };
  }

  /**
   * Check if a response relates to a previous message
   * Uses word overlap and topic similarity
   */
  private responsesRelate(message: string, response: string): boolean {
    // Extract significant words (longer than 3 characters)
    const messageWords = new Set(
      message.toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 3)
    );

    const responseWords = new Set(
      response.toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 3)
    );

    // Count common words
    let commonWords = 0;
    for (const word of messageWords) {
      if (responseWords.has(word)) {
        commonWords++;
      }
    }

    // If at least 2 significant words overlap, consider them related
    return commonWords >= 2;
  }

  /**
   * Validate context-dependent response
   * Checks if response is appropriate given conversation history
   */
  validateContextDependentResponse(
    sessionId: string,
    response: string,
    expectedContextElements: string[]
  ): {
    valid: boolean;
    foundElements: string[];
    missingElements: string[];
  } {
    const lowerResponse = response.toLowerCase();
    const foundElements: string[] = [];
    const missingElements: string[] = [];

    for (const element of expectedContextElements) {
      if (lowerResponse.includes(element.toLowerCase())) {
        foundElements.push(element);
      } else {
        missingElements.push(element);
      }
    }

    return {
      valid: missingElements.length === 0,
      foundElements,
      missingElements
    };
  }

  /**
   * Check if Target Bot maintains topic consistency
   */
  validateTopicConsistency(sessionId: string, expectedTopic: string): {
    consistent: boolean;
    topicMentions: number;
    totalMessages: number;
  } {
    const targetMessages = this.getMessagesBySender(sessionId, 'target');
    const topicMentions = targetMessages.filter(msg =>
      msg.content.toLowerCase().includes(expectedTopic.toLowerCase())
    ).length;

    const consistent = targetMessages.length > 0 && 
                      (topicMentions / targetMessages.length) >= 0.5;

    return {
      consistent,
      topicMentions,
      totalMessages: targetMessages.length
    };
  }

  /**
   * Mark a context reset point in the conversation
   * Used to track when context should be cleared
   */
  markContextReset(sessionId: string): number {
    const messages = this.storage.getMessages(sessionId);
    return messages.length; // Return message count at reset point
  }

  /**
   * Validate that Target Bot does not reference pre-reset context
   * Checks if response avoids mentioning elements from before reset
   */
  validateContextReset(
    sessionId: string,
    resetPoint: number,
    currentResponse: string
  ): {
    valid: boolean;
    preResetReferences: number;
    details: string;
  } {
    const allMessages = this.storage.getMessages(sessionId);
    
    if (resetPoint >= allMessages.length) {
      return {
        valid: true,
        preResetReferences: 0,
        details: 'No messages after reset point'
      };
    }

    // Get messages before reset
    const preResetMessages = allMessages.slice(0, resetPoint);
    
    // Extract key terms from pre-reset messages
    const preResetTerms = this.extractKeyTerms(
      preResetMessages.map(m => m.content).join(' ')
    );

    // Check if current response references pre-reset terms
    let references = 0;
    const lowerResponse = currentResponse.toLowerCase();

    for (const term of preResetTerms) {
      if (lowerResponse.includes(term.toLowerCase())) {
        references++;
      }
    }

    // Valid if no or minimal references to pre-reset context
    const valid = references === 0;

    return {
      valid,
      preResetReferences: references,
      details: valid 
        ? 'No references to pre-reset context'
        : `Found ${references} references to pre-reset context`
    };
  }

  /**
   * Extract key terms from text for context tracking
   */
  private extractKeyTerms(text: string, minLength: number = 4): string[] {
    // Common words to ignore
    const stopWords = new Set([
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her',
      'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how',
      'that', 'this', 'with', 'have', 'from', 'they', 'will', 'what', 'when'
    ]);

    const words = text.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length >= minLength && !stopWords.has(w));

    // Return unique terms
    return Array.from(new Set(words));
  }

  /**
   * Check if response avoids specific context elements
   */
  validateContextAvoidance(
    response: string,
    avoidElements: string[]
  ): {
    valid: boolean;
    foundElements: string[];
  } {
    const lowerResponse = response.toLowerCase();
    const foundElements: string[] = [];

    for (const element of avoidElements) {
      if (lowerResponse.includes(element.toLowerCase())) {
        foundElements.push(element);
      }
    }

    return {
      valid: foundElements.length === 0,
      foundElements
    };
  }

  /**
   * Get context window for a session
   * Returns messages within a specific range
   */
  getContextWindow(
    sessionId: string,
    startIndex: number,
    endIndex?: number
  ): ConversationMessage[] {
    const messages = this.storage.getMessages(sessionId);
    return messages.slice(startIndex, endIndex);
  }
}
