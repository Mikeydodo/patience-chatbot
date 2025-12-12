import Foundation

class AdversarialTestOrchestrator {
    private let communicationManager = CommunicationManager()
    private var adversarialConnector: AdversarialBotConnector?
    
    func run(config: AdversarialTestConfig) async throws -> [ConversationResult] {
        var results: [ConversationResult] = []
        
        // Initialize adversarial bot connector
        adversarialConnector = createConnector(for: config.adversarialBot)
        try await adversarialConnector?.initialize(config: config.adversarialBot)
        
        defer {
            Task {
                await adversarialConnector?.disconnect()
            }
        }
        
        // Connect to target bot
        let targetBotConfig = BotConfig(
            name: config.targetBot.name,
            botProtocol: config.targetBot.botProtocol,
            endpoint: config.targetBot.endpoint,
            authentication: config.targetBot.authentication.map { auth in
                AuthConfig(type: AuthType(rawValue: auth.type.rawValue) ?? .bearer, credentials: auth.credentials)
            },
            headers: config.targetBot.headers,
            provider: .generic,
            model: nil
        )
        
        try await communicationManager.connect(to: targetBotConfig)
        
        defer {
            Task {
                await communicationManager.disconnect()
            }
        }
        
        // Run conversations
        for conversationIndex in 0..<config.execution.numConversations {
            let result = try await runSingleConversation(
                config: config,
                conversationIndex: conversationIndex
            )
            results.append(result)
            
            // Delay between conversations if configured
            if let delay = config.execution.delayBetweenConversations, delay > 0 {
                try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000))
            }
        }
        
        return results
    }
    
    private func runSingleConversation(
        config: AdversarialTestConfig,
        conversationIndex: Int
    ) async throws -> ConversationResult {
        
        let conversationId = UUID().uuidString
        let startTime = Date()
        var messages: [AdversarialMessage] = []
        var validationResults: [ValidationResult] = []
        var terminationReason: TerminationReason = .max_turns
        
        // Get system prompt from strategy
        let strategy = createStrategy(for: config.conversation.strategy)
        let systemPrompt = strategy.getSystemPrompt(config: config)
        
        // Run conversation turns
        for turnNumber in 0..<config.conversation.maxTurns {
            // Check if adversarial bot wants to end conversation
            if let connector = adversarialConnector {
                let shouldEnd = try await connector.shouldEndConversation(messages: messages.map { $0.toMessage() })
                if shouldEnd {
                    terminationReason = .adversarial_ended
                    break
                }
            }
            
            // Generate adversarial message
            guard let connector = adversarialConnector else {
                throw AdversarialError.connectorNotInitialized
            }
            
            let context = ConversationContext(
                conversationId: conversationId,
                turnNumber: turnNumber,
                validationResults: validationResults,
                goals: config.conversation.goals
            )
            
            let adversarialContent = try await connector.generateMessage(
                conversationHistory: messages.map { $0.toMessage() },
                systemPrompt: systemPrompt,
                context: context
            )
            
            let adversarialMessage = AdversarialMessage(
                id: UUID().uuidString,
                role: .adversarial,
                content: adversarialContent,
                timestamp: Date(),
                metadata: nil
            )
            messages.append(adversarialMessage)
            
            // Send to target bot and get response
            let targetResponse = try await communicationManager.sendMessage(adversarialContent)
            
            let targetMessage = AdversarialMessage(
                id: UUID().uuidString,
                role: .target,
                content: targetResponse.content,
                timestamp: targetResponse.timestamp,
                metadata: [
                    "responseTime": String(targetResponse.responseTime ?? 0)
                ]
            )
            messages.append(targetMessage)
            
            // Validate response if rules are configured
            if let validationConfig = config.validation {
                for rule in validationConfig.rules {
                    let validation = validateResponse(
                        response: targetResponse,
                        criteria: rule
                    )
                    validationResults.append(validation)
                }
            }
            
            // Check if goals are achieved
            if strategy.isGoalAchieved(
                conversationHistory: messages.map { $0.toMessage() },
                validationResults: validationResults
            ) {
                terminationReason = .goal_achieved
                break
            }
            
            // Delay between turns if configured
            if let delay = config.execution.delayBetweenTurns, delay > 0 {
                try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000))
            }
        }
        
        let endTime = Date()
        let duration = endTime.timeIntervalSince(startTime) * 1000 // Convert to milliseconds
        
        // Calculate metrics
        let responseTimes = messages.compactMap { message -> Double? in
            guard message.role == .target,
                  let responseTimeString = message.metadata?["responseTime"],
                  let responseTime = Double(responseTimeString) else {
                return nil
            }
            return responseTime
        }
        
        let avgResponseTime = responseTimes.isEmpty ? 0.0 : responseTimes.reduce(0, +) / Double(responseTimes.count)
        let targetBotResponseRate = Double(messages.filter { $0.role == .target }.count) / Double(messages.filter { $0.role == .adversarial }.count)
        
        let passRate = validationResults.isEmpty ? 1.0 : Double(validationResults.filter { $0.passed }.count) / Double(validationResults.count)
        
        let metrics = ConversationMetrics(
            avgResponseTime: avgResponseTime,
            targetBotResponseRate: targetBotResponseRate,
            conversationQuality: passRate
        )
        
        return ConversationResult(
            conversationId: conversationId,
            timestamp: startTime,
            config: config,
            messages: messages.map { $0.toMessage() },
            turns: messages.filter { $0.role == .adversarial }.count,
            duration: duration,
            validationResults: validationResults,
            passRate: passRate,
            metrics: metrics,
            terminationReason: terminationReason,
            terminationMessage: nil,
            patterns: nil,
            contextAnalysis: nil
        )
    }
    
    private func createConnector(for config: AdversarialBotSettings) -> AdversarialBotConnector {
        switch config.provider {
        case .openai:
            return OpenAIConnector()
        case .anthropic:
            return AnthropicConnector()
        case .ollama:
            return OllamaConnector()
        case .generic:
            return GenericConnector()
        }
    }
    
    private func createStrategy(for strategyType: ConversationStrategy) -> PromptStrategy {
        switch strategyType {
        case .exploratory:
            return ExploratoryStrategy()
        case .adversarial:
            return AdversarialStrategy()
        case .focused:
            return FocusedStrategy()
        case .stress:
            return StressStrategy()
        case .custom:
            return CustomStrategy()
        }
    }
    
    private func validateResponse(response: BotResponse, criteria: ValidationCriteria) -> ValidationResult {
        let validator = ResponseValidator()
        let responseCriteria = ResponseCriteria(
            validationType: criteria.type,
            expected: criteria.expected,
            threshold: criteria.threshold
        )
        
        let validationConfig = ValidationConfig(
            defaultType: criteria.type,
            semanticSimilarityThreshold: criteria.threshold,
            customValidators: nil
        )
        
        return validator.validate(response: response, criteria: responseCriteria, config: validationConfig)
    }
}

// MARK: - Supporting Types

struct AdversarialMessage: Sendable {
    let id: String
    let role: MessageRole
    let content: String
    let timestamp: Date
    let metadata: [String: String]?
    
    func toMessage() -> Message {
        return Message(
            id: id,
            role: role,
            content: content,
            timestamp: timestamp,
            metadata: MessageMetadata(
                responseTime: metadata?["responseTime"].flatMap(Double.init),
                tokenCount: metadata?["tokenCount"].flatMap(Int.init),
                cost: metadata?["cost"].flatMap(Double.init)
            )
        )
    }
}

enum MessageRole: String, Codable, Sendable {
    case adversarial = "adversarial"
    case target = "target"
}

struct Message: Sendable {
    let id: String
    let role: MessageRole
    let content: String
    let timestamp: Date
    let metadata: MessageMetadata?
}

struct MessageMetadata: Sendable {
    let responseTime: Double?
    let tokenCount: Int?
    let cost: Double?
}

struct ConversationContext: Sendable {
    let conversationId: String
    let turnNumber: Int
    let validationResults: [ValidationResult]
    let goals: [String]?
}

struct ConversationMetrics: Sendable {
    let avgResponseTime: Double
    let targetBotResponseRate: Double
    let conversationQuality: Double
}

struct ConversationResult: Sendable {
    let conversationId: String
    let timestamp: Date
    let config: AdversarialTestConfig
    let messages: [Message]
    let turns: Int
    let duration: Double
    let validationResults: [ValidationResult]
    let passRate: Double
    let metrics: ConversationMetrics
    let terminationReason: TerminationReason
    let terminationMessage: String?
    let patterns: [any Sendable]?
    let contextAnalysis: (any Sendable)?
}

enum TerminationReason: String, Codable, Sendable {
    case max_turns = "max_turns"
    case goal_achieved = "goal_achieved"
    case timeout = "timeout"
    case error = "error"
    case manual = "manual"
    case adversarial_ended = "adversarial_ended"
}

// MARK: - Connector Protocols

protocol AdversarialBotConnector {
    func initialize(config: AdversarialBotSettings) async throws
    func generateMessage(conversationHistory: [Message], systemPrompt: String, context: ConversationContext?) async throws -> String
    func shouldEndConversation(messages: [Message]) async throws -> Bool
    func disconnect() async
    func getName() -> String
}

// MARK: - Strategy Protocols

protocol PromptStrategy {
    func getSystemPrompt(config: AdversarialTestConfig) -> String
    func getNextTurnInstructions(conversationHistory: [Message], validationResults: [ValidationResult]) -> String
    func isGoalAchieved(conversationHistory: [Message], validationResults: [ValidationResult]) -> Bool
    func getName() -> String
}

// MARK: - Connector Implementations

class OpenAIConnector: AdversarialBotConnector {
    private var config: AdversarialBotSettings?
    
    func initialize(config: AdversarialBotSettings) async throws {
        self.config = config
        // Initialize OpenAI client
    }
    
    func generateMessage(conversationHistory: [Message], systemPrompt: String, context: ConversationContext?) async throws -> String {
        // Implement OpenAI API call
        return "OpenAI generated message"
    }
    
    func shouldEndConversation(messages: [Message]) async throws -> Bool {
        return messages.count > 20 // Simple heuristic
    }
    
    func disconnect() async {
        // Clean up OpenAI resources
    }
    
    func getName() -> String {
        return "OpenAI Connector"
    }
}

class AnthropicConnector: AdversarialBotConnector {
    private var config: AdversarialBotSettings?
    
    func initialize(config: AdversarialBotSettings) async throws {
        self.config = config
    }
    
    func generateMessage(conversationHistory: [Message], systemPrompt: String, context: ConversationContext?) async throws -> String {
        return "Anthropic generated message"
    }
    
    func shouldEndConversation(messages: [Message]) async throws -> Bool {
        return messages.count > 20
    }
    
    func disconnect() async {}
    
    func getName() -> String {
        return "Anthropic Connector"
    }
}

class OllamaConnector: AdversarialBotConnector {
    private var config: AdversarialBotSettings?
    
    func initialize(config: AdversarialBotSettings) async throws {
        self.config = config
    }
    
    func generateMessage(conversationHistory: [Message], systemPrompt: String, context: ConversationContext?) async throws -> String {
        return "Ollama generated message"
    }
    
    func shouldEndConversation(messages: [Message]) async throws -> Bool {
        return messages.count > 15
    }
    
    func disconnect() async {}
    
    func getName() -> String {
        return "Ollama Connector"
    }
}

class GenericConnector: AdversarialBotConnector {
    private var config: AdversarialBotSettings?
    
    func initialize(config: AdversarialBotSettings) async throws {
        self.config = config
    }
    
    func generateMessage(conversationHistory: [Message], systemPrompt: String, context: ConversationContext?) async throws -> String {
        return "Generic generated message"
    }
    
    func shouldEndConversation(messages: [Message]) async throws -> Bool {
        return messages.count > 10
    }
    
    func disconnect() async {}
    
    func getName() -> String {
        return "Generic Connector"
    }
}

// MARK: - Strategy Implementations

class ExploratoryStrategy: PromptStrategy {
    func getSystemPrompt(config: AdversarialTestConfig) -> String {
        return "You are an exploratory testing bot. Ask diverse questions to understand the target bot's capabilities."
    }
    
    func getNextTurnInstructions(conversationHistory: [Message], validationResults: [ValidationResult]) -> String {
        return "Ask a different type of question to explore new capabilities."
    }
    
    func isGoalAchieved(conversationHistory: [Message], validationResults: [ValidationResult]) -> Bool {
        return false // Continue until max turns
    }
    
    func getName() -> String {
        return "Exploratory Strategy"
    }
}

class AdversarialStrategy: PromptStrategy {
    func getSystemPrompt(config: AdversarialTestConfig) -> String {
        return "You are an adversarial testing bot. Try to find edge cases and potential failures in the target bot."
    }
    
    func getNextTurnInstructions(conversationHistory: [Message], validationResults: [ValidationResult]) -> String {
        return "Try to find weaknesses or edge cases in the bot's responses."
    }
    
    func isGoalAchieved(conversationHistory: [Message], validationResults: [ValidationResult]) -> Bool {
        return validationResults.contains { !$0.passed }
    }
    
    func getName() -> String {
        return "Adversarial Strategy"
    }
}

class FocusedStrategy: PromptStrategy {
    func getSystemPrompt(config: AdversarialTestConfig) -> String {
        let goals = config.conversation.goals?.joined(separator: ", ") ?? "general functionality"
        return "You are a focused testing bot. Test specifically for: \(goals)"
    }
    
    func getNextTurnInstructions(conversationHistory: [Message], validationResults: [ValidationResult]) -> String {
        return "Continue testing the specific goals defined in the configuration."
    }
    
    func isGoalAchieved(conversationHistory: [Message], validationResults: [ValidationResult]) -> Bool {
        return validationResults.filter { $0.passed }.count >= 3
    }
    
    func getName() -> String {
        return "Focused Strategy"
    }
}

class StressStrategy: PromptStrategy {
    func getSystemPrompt(config: AdversarialTestConfig) -> String {
        return "You are a stress testing bot. Send rapid, complex, and challenging inputs to test the bot's limits."
    }
    
    func getNextTurnInstructions(conversationHistory: [Message], validationResults: [ValidationResult]) -> String {
        return "Send increasingly complex or rapid messages to stress test the bot."
    }
    
    func isGoalAchieved(conversationHistory: [Message], validationResults: [ValidationResult]) -> Bool {
        return false // Continue until max turns or failure
    }
    
    func getName() -> String {
        return "Stress Strategy"
    }
}

class CustomStrategy: PromptStrategy {
    func getSystemPrompt(config: AdversarialTestConfig) -> String {
        return config.conversation.systemPrompt ?? "You are a custom testing bot."
    }
    
    func getNextTurnInstructions(conversationHistory: [Message], validationResults: [ValidationResult]) -> String {
        return "Follow the custom strategy defined in the configuration."
    }
    
    func isGoalAchieved(conversationHistory: [Message], validationResults: [ValidationResult]) -> Bool {
        return false // Custom logic would go here
    }
    
    func getName() -> String {
        return "Custom Strategy"
    }
}

enum AdversarialError: Error, LocalizedError, Sendable {
    case connectorNotInitialized
    case invalidConfiguration(String)
    case apiError(String)
    case timeout
    
    var errorDescription: String? {
        switch self {
        case .connectorNotInitialized:
            return "Adversarial bot connector not initialized"
        case .invalidConfiguration(let message):
            return "Invalid configuration: \(message)"
        case .apiError(let message):
            return "API error: \(message)"
        case .timeout:
            return "Request timeout"
        }
    }
}
