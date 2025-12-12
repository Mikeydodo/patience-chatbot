# Contributing to Patience

Thank you for your interest in contributing to Patience! This document provides guidelines and instructions for contributing to the native macOS Swift/SwiftUI application.

## Getting Started

### Prerequisites

- **macOS 13.0** or later
- **Xcode 15.0** or later
- **Swift 5.9** knowledge
- **SwiftUI** experience
- **Git** for version control

### Development Setup

1. **Fork the repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/patience-swift.git
   cd patience-swift
   ```

2. **Open in Xcode**
   ```bash
   open Patience.xcodeproj
   ```

3. **Build and run**
   - Press `⌘+R` to build and run
   - Verify the app launches successfully
   - Test basic functionality

4. **Run tests**
   - Press `⌘+U` to run all tests
   - Ensure all tests pass before making changes

## Development Workflow

### Branch Naming

Use descriptive branch names with prefixes:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions or updates
- `ui/` - User interface improvements

Examples:
- `feature/add-websocket-support`
- `fix/memory-leak-in-analysis`
- `ui/improve-adversarial-config-editor`

### Making Changes

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Write or update tests** for your changes

4. **Ensure all tests pass**
   ```bash
   # Run tests in Xcode (⌘+U) or command line
   xcodebuild test -project Patience.xcodeproj -scheme Patience
   ```

5. **Build successfully**
   ```bash
   xcodebuild -project Patience.xcodeproj -scheme Patience build
   ```

6. **Commit your changes**
   ```bash
   git commit -m "feat: add WebSocket support for real-time communication"
   ```

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

**Format**: `type(scope): description`

**Types**:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Test additions or updates
- `chore:` - Build process or auxiliary tool changes
- `ui:` - User interface changes

**Examples**:
```
feat(adversarial): add Claude 3 Opus support
fix(analysis): resolve CSV parsing error with quoted fields
docs(readme): update installation instructions
ui(testing): improve scenario editor layout
test(core): add unit tests for ResponseValidator
refactor(networking): extract HTTP client to separate class
```

### Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new functionality
3. **Ensure all tests pass**
4. **Update CHANGELOG.md** with your changes
5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Create a Pull Request** from your fork to the main repository
7. **Fill out the PR template** completely
8. **Wait for review** and address any feedback

## Coding Standards

### Swift Style Guide

**General Principles**:
- Follow [Swift API Design Guidelines](https://swift.org/documentation/api-design-guidelines/)
- Use meaningful names that express intent
- Prefer clarity over brevity
- Be consistent with existing code style

**Naming Conventions**:
```swift
// Types: UpperCamelCase
struct TestConfiguration { }
class AnalysisEngine { }
enum ValidationResult { }

// Variables and functions: lowerCamelCase
var testResults: [TestResult] = []
func executeScenario() -> ScenarioResult { }

// Constants: lowerCamelCase
let defaultTimeout = 30.0
let maxRetryAttempts = 3

// Private properties: leading underscore optional
private var _internalState: State?
```

**Code Organization**:
```swift
// MARK: - Type Definition
struct TestConfig {
    // MARK: - Properties
    let targetBot: BotConfig
    var scenarios: [Scenario]
    
    // MARK: - Initialization
    init(targetBot: BotConfig, scenarios: [Scenario]) {
        self.targetBot = targetBot
        self.scenarios = scenarios
    }
    
    // MARK: - Public Methods
    func validate() -> ValidationResult {
        // Implementation
    }
    
    // MARK: - Private Methods
    private func validateScenarios() -> Bool {
        // Implementation
    }
}
```

**Documentation**:
```swift
/// Executes a test scenario against the configured bot
/// - Parameters:
///   - scenario: The scenario to execute
///   - config: Test configuration settings
/// - Returns: Results of the scenario execution
/// - Throws: `TestError` if execution fails
func executeScenario(
    _ scenario: Scenario,
    config: TestConfig
) async throws -> ScenarioResult {
    // Implementation
}
```

### SwiftUI Best Practices

**View Structure**:
```swift
struct TestingView: View {
    // MARK: - Properties
    @EnvironmentObject var appState: AppState
    @State private var selectedConfig: TestConfig?
    
    // MARK: - Body
    var body: some View {
        VStack {
            headerView
            contentView
        }
        .navigationTitle("Testing")
    }
    
    // MARK: - Subviews
    private var headerView: some View {
        HStack {
            Text("Live Testing")
                .font(.largeTitle)
            Spacer()
            Button("New Config") { }
        }
        .padding()
    }
    
    private var contentView: some View {
        // Implementation
    }
}
```

**State Management**:
- Use `@State` for local view state
- Use `@StateObject` for view-owned objects
- Use `@EnvironmentObject` for shared app state
- Use `@ObservedObject` for externally-owned objects

**Performance**:
- Keep views small and focused
- Use `LazyVStack`/`LazyHStack` for large lists
- Avoid expensive operations in view body
- Use `@ViewBuilder` for conditional views

### Error Handling

**Error Types**:
```swift
enum TestError: Error, LocalizedError {
    case invalidConfiguration(String)
    case networkFailure(URLError)
    case validationFailed(ValidationResult)
    case timeout
    
    var errorDescription: String? {
        switch self {
        case .invalidConfiguration(let message):
            return "Invalid configuration: \(message)"
        case .networkFailure(let error):
            return "Network error: \(error.localizedDescription)"
        case .validationFailed(let result):
            return "Validation failed: \(result.message ?? "Unknown error")"
        case .timeout:
            return "Request timed out"
        }
    }
}
```

**Error Handling Patterns**:
```swift
// Async functions
func executeTest() async throws -> TestResult {
    do {
        let result = try await performNetworkRequest()
        return result
    } catch {
        logger.error("Test execution failed: \(error)")
        throw TestError.networkFailure(error as! URLError)
    }
}

// Result type for non-throwing functions
func validateConfiguration(_ config: TestConfig) -> Result<Void, TestError> {
    guard !config.scenarios.isEmpty else {
        return .failure(.invalidConfiguration("No scenarios provided"))
    }
    return .success(())
}
```

### Testing Guidelines

**Unit Test Structure**:
```swift
import XCTest
@testable import Patience

final class TestExecutorTests: XCTestCase {
    // MARK: - Properties
    var executor: TestExecutor!
    var mockConfig: TestConfig!
    
    // MARK: - Setup
    override func setUp() {
        super.setUp()
        executor = TestExecutor()
        mockConfig = createMockConfig()
    }
    
    override func tearDown() {
        executor = nil
        mockConfig = nil
        super.tearDown()
    }
    
    // MARK: - Tests
    func testExecuteScenario_WithValidConfig_ReturnsSuccess() async throws {
        // Arrange
        let scenario = createValidScenario()
        
        // Act
        let result = try await executor.executeScenario(scenario, config: mockConfig)
        
        // Assert
        XCTAssertTrue(result.passed)
        XCTAssertEqual(result.scenarioId, scenario.id)
    }
    
    func testExecuteScenario_WithInvalidEndpoint_ThrowsError() async {
        // Arrange
        let invalidConfig = createInvalidConfig()
        let scenario = createValidScenario()
        
        // Act & Assert
        await XCTAssertThrowsError(
            try await executor.executeScenario(scenario, config: invalidConfig)
        ) { error in
            XCTAssertTrue(error is TestError)
        }
    }
    
    // MARK: - Helpers
    private func createMockConfig() -> TestConfig {
        // Implementation
    }
}
```

**Test Naming**:
- Use descriptive test names: `test[MethodName]_[Condition]_[ExpectedResult]`
- Group related tests with `// MARK: - Test Group Name`
- Use helper methods to reduce duplication

**Mocking**:
```swift
protocol NetworkClientProtocol {
    func sendRequest(_ request: URLRequest) async throws -> Data
}

class MockNetworkClient: NetworkClientProtocol {
    var mockResponse: Data?
    var shouldThrowError = false
    
    func sendRequest(_ request: URLRequest) async throws -> Data {
        if shouldThrowError {
            throw URLError(.networkConnectionLost)
        }
        return mockResponse ?? Data()
    }
}
```

## Project Structure

### Directory Organization

```
Patience/
├── PatienceApp.swift          # App entry point
├── ContentView.swift          # Main app interface
├── Models/                    # Data models and types
│   ├── Types.swift           # Core data structures
│   └── AppState.swift        # Application state
├── Core/                     # Business logic
│   ├── TestExecutor.swift    # Test execution engine
│   ├── AnalysisEngine.swift  # Log analysis
│   ├── AdversarialTestOrchestrator.swift
│   └── ReportGenerator.swift
├── Views/                    # SwiftUI views
│   ├── Testing/              # Live testing views
│   ├── Analysis/             # Analysis views
│   ├── Adversarial/          # Adversarial testing views
│   ├── Reports/              # Report views
│   └── Shared/               # Reusable components
├── Resources/                # Assets and resources
│   ├── Assets.xcassets/      # Images and colors
│   └── Localizable.strings   # Localization
└── Tests/                    # Test files
    ├── UnitTests/            # Unit tests
    ├── IntegrationTests/     # Integration tests
    └── UITests/              # UI tests
```

### File Naming Conventions

- **Views**: `[Feature]View.swift` (e.g., `TestingView.swift`)
- **Models**: `[Entity].swift` (e.g., `TestConfig.swift`)
- **Managers**: `[Purpose]Manager.swift` (e.g., `CommunicationManager.swift`)
- **Extensions**: `[Type]+[Purpose].swift` (e.g., `String+Validation.swift`)
- **Tests**: `[ClassUnderTest]Tests.swift` (e.g., `TestExecutorTests.swift`)

## Adding New Features

### Adding a New AI Provider

1. **Create the connector**
   ```swift
   // Core/Connectors/NewProviderConnector.swift
   class NewProviderConnector: AdversarialBotConnector {
       func initialize(config: AdversarialBotSettings) async throws {
           // Implementation
       }
       
       func generateMessage(
           conversationHistory: [Message],
           systemPrompt: String,
           context: ConversationContext?
       ) async throws -> String {
           // Implementation
       }
       
       // Other required methods...
   }
   ```

2. **Update the provider enum**
   ```swift
   enum BotProvider: String, Codable, CaseIterable {
       case ollama = "ollama"
       case openai = "openai"
       case anthropic = "anthropic"
       case newProvider = "newProvider" // Add here
   }
   ```

3. **Update the orchestrator**
   ```swift
   private func createConnector(for config: AdversarialBotSettings) -> AdversarialBotConnector {
       switch config.provider {
       case .ollama: return OllamaConnector()
       case .openai: return OpenAIConnector()
       case .anthropic: return AnthropicConnector()
       case .newProvider: return NewProviderConnector() // Add here
       }
   }
   ```

4. **Add configuration UI**
5. **Write tests**
6. **Update documentation**

### Adding a New Validation Type

1. **Update the enum**
   ```swift
   enum ValidationType: String, Codable, CaseIterable {
       case exact = "exact"
       case pattern = "pattern"
       case semantic = "semantic"
       case custom = "custom"
       case newType = "newType" // Add here
   }
   ```

2. **Implement validation logic**
   ```swift
   func validate(response: BotResponse, criteria: ResponseCriteria, config: ValidationConfig) -> ValidationResult {
       switch criteria.validationType {
       case .exact: return validateExact(response: response, expected: criteria.expected)
       case .pattern: return validatePattern(response: response, pattern: criteria.expected)
       case .semantic: return validateSemantic(response: response, expected: criteria.expected, threshold: criteria.threshold ?? 0.8)
       case .custom: return validateCustom(response: response, validator: criteria.expected)
       case .newType: return validateNewType(response: response, criteria: criteria) // Add here
       }
   }
   ```

3. **Add UI support**
4. **Write tests**
5. **Update documentation**

### Adding a New Log Format

1. **Update the enum**
   ```swift
   enum LogFormat: String, Codable, CaseIterable {
       case json = "json"
       case csv = "csv"
       case text = "text"
       case auto = "auto"
       case newFormat = "newFormat" // Add here
   }
   ```

2. **Implement parser**
   ```swift
   private func parseNewFormat(_ data: Data) throws -> [ConversationHistory] {
       // Implementation
   }
   ```

3. **Update format detection**
4. **Add tests with sample data**
5. **Update documentation**

## Documentation

### Code Documentation

**Use Swift documentation comments**:
```swift
/// A brief description of what this does
///
/// A more detailed explanation if needed. This can span
/// multiple lines and include examples.
///
/// - Parameters:
///   - parameter1: Description of parameter1
///   - parameter2: Description of parameter2
/// - Returns: Description of return value
/// - Throws: Description of errors that can be thrown
///
/// # Example
/// ```swift
/// let result = try await someFunction(param1: "value", param2: 42)
/// ```
func someFunction(parameter1: String, parameter2: Int) async throws -> Result {
    // Implementation
}
```

**Document complex algorithms**:
```swift
// Calculate semantic similarity using cosine similarity
// 1. Convert text to word vectors
// 2. Calculate dot product of normalized vectors
// 3. Return similarity score between 0 and 1
private func calculateSimilarity(_ text1: String, _ text2: String) -> Double {
    // Implementation with inline comments for complex parts
}
```

### README Updates

When adding features, update:
- Feature list in README
- Configuration examples
- Quick start guide if applicable
- API provider setup if relevant

### CHANGELOG Updates

For every change, update CHANGELOG.md:
```markdown
## [Unreleased]

### Added
- New AI provider support for [Provider Name]
- WebSocket protocol support for real-time communication

### Changed
- Improved error handling in network layer
- Updated UI for better accessibility

### Fixed
- Memory leak in log analysis engine
- Crash when importing malformed CSV files
```

## Testing

### Test Categories

**Unit Tests**:
- Test individual functions and methods
- Mock external dependencies
- Focus on business logic
- Fast execution (< 1 second per test)

**Integration Tests**:
- Test component interactions
- Use real data formats
- Test network communication (with mocks)
- Moderate execution time (< 10 seconds per test)

**UI Tests**:
- Test user workflows
- Verify accessibility
- Test critical user paths
- Slower execution (< 30 seconds per test)

### Running Tests

```bash
# All tests
xcodebuild test -project Patience.xcodeproj -scheme Patience

# Specific test class
xcodebuild test -project Patience.xcodeproj -scheme Patience -only-testing:PatienceTests/TestExecutorTests

# UI tests only
xcodebuild test -project Patience.xcodeproj -scheme Patience -only-testing:PatienceUITests
```

### Test Coverage

- Aim for >80% code coverage on business logic
- 100% coverage on critical paths (validation, networking)
- Use Xcode's code coverage tools to identify gaps

## Performance Guidelines

### Memory Management

- Use weak references to avoid retain cycles
- Implement proper cleanup in deinit
- Use lazy properties for expensive computations
- Profile with Instruments regularly

### CPU Optimization

- Use background queues for heavy operations
- Implement cancellation for long-running tasks
- Cache expensive computations
- Use efficient algorithms and data structures

### Network Optimization

- Implement proper timeout handling
- Use connection pooling where appropriate
- Handle rate limiting gracefully
- Provide offline capabilities where possible

## Accessibility

### Requirements

- Support VoiceOver navigation
- Provide meaningful accessibility labels
- Ensure proper focus management
- Support keyboard navigation
- Test with accessibility inspector

### Implementation

```swift
Button("Run Tests") {
    runTests()
}
.accessibilityLabel("Run all configured test scenarios")
.accessibilityHint("Executes the test scenarios and displays results")
.accessibilityIdentifier("runTestsButton")
```

## Localization

### String Management

- Use `NSLocalizedString` for all user-facing text
- Provide meaningful keys and comments
- Support right-to-left languages
- Test with different language settings

```swift
Text(NSLocalizedString("test.execution.progress", 
                      value: "Running test %d of %d", 
                      comment: "Progress message showing current test number"))
```

## Code Review Guidelines

### What to Look For

**Functionality**:
- Does the code solve the intended problem?
- Are edge cases handled properly?
- Is error handling comprehensive?

**Code Quality**:
- Is the code readable and maintainable?
- Are naming conventions followed?
- Is the code properly documented?

**Performance**:
- Are there any obvious performance issues?
- Is memory management handled correctly?
- Are expensive operations optimized?

**Testing**:
- Are there adequate tests for the changes?
- Do all tests pass?
- Is test coverage maintained or improved?

### Review Process

1. **Automated Checks**: Ensure CI passes
2. **Code Review**: At least one reviewer approval required
3. **Testing**: Manual testing of new features
4. **Documentation**: Verify documentation is updated
5. **Merge**: Squash and merge with descriptive commit message

## Getting Help

### Development Questions

1. **Check existing documentation** in this file and DOCUMENTATION.md
2. **Search closed issues** for similar questions
3. **Review the codebase** for similar implementations
4. **Ask in discussions** or open an issue with the "question" label

### Bug Reports

Include:
- macOS version and Xcode version
- Steps to reproduce the issue
- Expected vs actual behavior
- Relevant code snippets or logs
- Screenshots if applicable

### Feature Requests

Include:
- Clear description of the feature
- Use cases and benefits
- Proposed implementation approach
- Willingness to contribute the implementation

## Code of Conduct

### Our Standards

- **Be respectful and inclusive** in all interactions
- **Welcome newcomers** and help them get started
- **Accept constructive criticism** gracefully
- **Focus on what's best for the project** and community
- **Show empathy** towards other contributors

### Unacceptable Behavior

- Harassment, discrimination, or offensive language
- Trolling, insulting comments, or personal attacks
- Publishing others' private information without permission
- Any other unprofessional conduct

### Enforcement

Violations of the code of conduct should be reported to the project maintainers. All reports will be reviewed and investigated promptly and fairly.

## Recognition

Contributors will be recognized through:
- **CHANGELOG.md** entries for their contributions
- **GitHub contributors** page
- **Release notes** for significant contributions
- **Special recognition** for outstanding contributions

## Questions?

If you have questions about contributing:

1. **Read this guide thoroughly**
2. **Check the main documentation**
3. **Search existing issues and discussions**
4. **Open a new issue** with the "question" label

Thank you for contributing to Patience! 🎉

---

**Last Updated**: 2025-01-15