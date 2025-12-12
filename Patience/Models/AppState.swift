import SwiftUI
import Combine
import Security

@MainActor
class AppState: ObservableObject {
    @Published var testConfigs: [TestConfig] = []
    // API keys are stored in Keychain; this array never persists apiKey values.
    @Published var adversarialConfigs: [AdversarialTestConfig] = []
    @Published var analysisConfigs: [AnalysisConfig] = []
    @Published var testResults: [TestResults] = []
    @Published var analysisResults: [AnalysisResults] = []
    @Published var reports: [TestReport] = []
    
    @Published var isRunningTest = false
    @Published var isRunningAnalysis = false
    @Published var isRunningAdversarial = false
    
    @Published var currentTestProgress: Double = 0.0
    @Published var currentTestStatus: String = ""
    
    // Settings
    @Published var defaultOutputPath: String = "~/Documents/Patience Reports"
    @Published var autoSaveConfigs: Bool = true
    @Published var showDetailedLogs: Bool = false
    
    init() {
        loadSampleData()
    }
    
    // MARK: - Test Configuration Management
    
    func addTestConfig(_ config: TestConfig) {
        testConfigs.append(config)
        saveConfigs()
    }
    
    func updateTestConfig(_ config: TestConfig) {
        if let index = testConfigs.firstIndex(where: { $0.id == config.id }) {
            testConfigs[index] = config
            saveConfigs()
        }
    }
    
    func deleteTestConfig(_ config: TestConfig) {
        testConfigs.removeAll { $0.id == config.id }
        saveConfigs()
    }
    
    // MARK: - Adversarial Configuration Management
    
    func addAdversarialConfig(_ config: AdversarialTestConfig) {
        var sanitized = config
        if let key = sanitized.adversarialBot.apiKey {
            _ = KeychainManager.shared.saveAPIKey(for: sanitized.id, key: key)
            sanitized.adversarialBot.apiKey = nil
        }
        adversarialConfigs.append(sanitized)
        saveConfigs()
    }
    
    func updateAdversarialConfig(_ config: AdversarialTestConfig) {
        if let index = adversarialConfigs.firstIndex(where: { $0.id == config.id }) {
            var sanitized = config
            if let key = sanitized.adversarialBot.apiKey {
                _ = KeychainManager.shared.saveAPIKey(for: sanitized.id, key: key)
                sanitized.adversarialBot.apiKey = nil
            }
            adversarialConfigs[index] = sanitized
            saveConfigs()
        }
    }
    
    func deleteAdversarialConfig(_ config: AdversarialTestConfig) {
        _ = KeychainManager.shared.deleteAPIKey(for: config.id)
        adversarialConfigs.removeAll { $0.id == config.id }
        saveConfigs()
    }
    
    // MARK: - Analysis Configuration Management
    
    func addAnalysisConfig(_ config: AnalysisConfig) {
        analysisConfigs.append(config)
        saveConfigs()
    }
    
    func updateAnalysisConfig(_ config: AnalysisConfig) {
        if let index = analysisConfigs.firstIndex(where: { $0.id == config.id }) {
            analysisConfigs[index] = config
            saveConfigs()
        }
    }
    
    func deleteAnalysisConfig(_ config: AnalysisConfig) {
        analysisConfigs.removeAll { $0.id == config.id }
        saveConfigs()
    }
    
    // MARK: - Test Execution
    
    func runTest(config: TestConfig) async {
        isRunningTest = true
        currentTestProgress = 0.0
        currentTestStatus = "Initializing test..."
        
        defer {
            isRunningTest = false
            currentTestProgress = 0.0
            currentTestStatus = ""
        }
        
        do {
            let executor = TestExecutor()
            let results = try await executor.executeTests(config: config) { progress, status in
                await MainActor.run {
                    self.currentTestProgress = progress
                    self.currentTestStatus = status
                }
            }
            
            testResults.append(results)
            
            // Generate report
            let reportGenerator = ReportGenerator()
            let report = reportGenerator.generateReport(from: results)
            reports.append(report)
            
        } catch {
            print("Test execution failed: \(error)")
        }
    }
    
    func runAnalysis(config: AnalysisConfig) async {
        isRunningAnalysis = true
        
        defer {
            isRunningAnalysis = false
        }
        
        do {
            let analyzer = AnalysisEngine()
            let results = try await analyzer.analyze(config: config)
            analysisResults.append(results)
        } catch {
            print("Analysis failed: \(error)")
        }
    }
    
    func runAdversarialTest(config: AdversarialTestConfig) async {
        isRunningAdversarial = true
        
        defer {
            isRunningAdversarial = false
        }
        
        do {
            let orchestrator = AdversarialTestOrchestrator()
            _ = try await orchestrator.run(config: config)
            // Handle adversarial results
        } catch {
            print("Adversarial test failed: \(error)")
        }
    }
    
    // MARK: - Data Persistence
    
    private func saveConfigs() {
        guard autoSaveConfigs else { return }
        
        // Save to UserDefaults or file system
        if let encoded = try? JSONEncoder().encode(testConfigs) {
            UserDefaults.standard.set(encoded, forKey: "testConfigs")
        }
        
        if let encoded = try? JSONEncoder().encode(adversarialConfigs) {
            // apiKey is nil for all adversarialConfigs here due to sanitization before save
            UserDefaults.standard.set(encoded, forKey: "adversarialConfigs")
        }
        
        if let encoded = try? JSONEncoder().encode(analysisConfigs) {
            UserDefaults.standard.set(encoded, forKey: "analysisConfigs")
        }
    }
    
    // MARK: - Sample Data
    
    private func loadSampleData() {
        // Add sample test configuration
        let sampleBot = BotConfig(
            name: "Sample Bot",
            botProtocol: .http,
            endpoint: "http://localhost:3000/chat",
            authentication: nil,
            headers: nil,
            provider: .generic,
            model: nil
        )
        
        let sampleScenario = Scenario(
            id: "greeting-test",
            name: "Greeting Test",
            description: "Test basic greeting functionality",
            steps: [
                ConversationStep(
                    message: "Hello",
                    expectedResponse: ResponseCriteria(
                        validationType: .pattern,
                        expected: "hello|hi|greetings",
                        threshold: 0.8
                    )
                )
            ],
            expectedOutcomes: [
                ValidationCriteria(
                    type: .pattern,
                    expected: "friendly response",
                    threshold: 0.7,
                    description: "Bot should respond in a friendly manner"
                )
            ]
        )
        
        let sampleConfig = TestConfig(
            targetBot: sampleBot,
            scenarios: [sampleScenario],
            validation: ValidationConfig(
                defaultType: .pattern,
                semanticSimilarityThreshold: 0.8,
                customValidators: nil
            ),
            timing: TimingConfig(
                enableDelays: true,
                baseDelay: 1000,
                delayPerCharacter: 50,
                rapidFire: false,
                responseTimeout: 30000
            ),
            reporting: ReportConfig(
                outputPath: "~/Documents/Patience Reports",
                formats: [.json, .html],
                includeConversationHistory: true,
                verboseErrors: true
            )
        )
        
        testConfigs.append(sampleConfig)
    }
}
