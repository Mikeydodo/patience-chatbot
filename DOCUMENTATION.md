# Patience Documentation Guide

This document provides comprehensive documentation for the Patience macOS application - a native Swift/SwiftUI chatbot testing framework.

## 📚 Main Documentation

### [README.md](README.md)
**The main entry point for all users**

Contains:
- Project overview and features
- Installation instructions
- Quick start guides for all three modes
- Configuration examples
- Architecture overview
- API provider setup
- Troubleshooting guide

**Start here if you're new to Patience!**

---

### [CONTRIBUTING.md](CONTRIBUTING.md)
**Guide for contributors**

Contains:
- Development setup with Xcode
- Swift coding standards and style guide
- SwiftUI best practices
- Git workflow and branch naming
- Pull request process
- Testing guidelines with XCTest
- How to add new features
- Code of conduct

**Read this if you want to contribute to Patience!**

---

### [CHANGELOG.md](CHANGELOG.md)
**Version history and changes**

Contains:
- Release notes for each version
- New features added
- Bug fixes and improvements
- Breaking changes
- Migration guides

**Check this to see what's new in each release!**

---

## 🎯 Feature Documentation

### Live Testing

**Purpose**: Test your chatbot in real-time with predefined scenarios

**Key Features**:
- Multi-step conversation flows
- Various validation types (exact, pattern, semantic)
- Configurable timing and delays
- Real-time progress monitoring
- Comprehensive reporting

**Configuration Structure**:
```swift
struct TestConfig {
    var targetBot: BotConfig
    var scenarios: [Scenario]
    var validation: ValidationConfig
    var timing: TimingConfig
    var reporting: ReportConfig
}
```

**Validation Types**:
- **Exact**: Perfect string matching
- **Pattern**: Regular expression matching
- **Semantic**: AI-powered similarity scoring
- **Custom**: User-defined validation logic

**Best Practices**:
- Start with simple scenarios and build complexity
- Use realistic timing delays for human-like interaction
- Include both positive and negative test cases
- Test edge cases and error conditions

---

### Log Analysis

**Purpose**: Analyze historical conversation logs to identify patterns and issues

**Key Features**:
- Multi-format support (JSON, CSV, text)
- Automatic format detection
- Pattern recognition and anomaly detection
- Conversation metrics calculation
- Advanced filtering capabilities

**Supported Log Formats**:

**JSON Format**:
```json
{
  "sessionId": "unique-session-id",
  "messages": [
    {
      "sender": "user|bot",
      "content": "message text",
      "timestamp": "ISO8601 timestamp"
    }
  ],
  "startTime": "ISO8601 timestamp",
  "endTime": "ISO8601 timestamp"
}
```

**CSV Format**:
```csv
timestamp,sender,content
2025-01-15T10:30:00Z,user,Hello
2025-01-15T10:30:01Z,bot,Hi there!
```

**Text Format**:
```
User: Hello
Bot: Hi there! How can I help you?
User: What's the weather?
Bot: I don't have weather information.
```

**Analysis Capabilities**:
- **Metrics**: Response rates, message counts, timing analysis
- **Patterns**: Common phrases, failure indicators, success patterns
- **Context**: Multi-turn conversation quality scoring
- **Filtering**: Date ranges, message counts, content matching

---

### Adversarial Testing

**Purpose**: Use AI models to automatically test your chatbot through realistic conversations

**Key Features**:
- Multiple AI provider support
- Various testing strategies
- Configurable conversation parameters
- Safety controls and monitoring
- Detailed conversation logging

**Supported Providers**:

**Ollama (Local, Free)**:
- Models: llama2, mistral, codellama, etc.
- Endpoint: `http://localhost:11434`
- No API key required
- Complete privacy and control

**OpenAI**:
- Models: gpt-4, gpt-4-turbo, gpt-3.5-turbo
- Requires API key from OpenAI Platform
- Pay-per-use pricing
- High-quality responses

**Anthropic**:
- Models: claude-3-opus, claude-3-sonnet, claude-3-haiku
- Requires API key from Anthropic Console
- Pay-per-use pricing
- Strong reasoning capabilities

**Testing Strategies**:

**Exploratory**:
- Broad, diverse questions to map capabilities
- Discovers functionality and limitations
- Good for initial assessment

**Adversarial**:
- Edge cases, contradictions, challenging inputs
- Finds weaknesses and failure modes
- Tests robustness and error handling

**Focused**:
- Deep dive into specific features or topics
- Requires predefined goals
- Thorough testing of particular areas

**Stress**:
- Rapid context switching and complex inputs
- Tests performance under pressure
- Identifies breaking points

---

## 🏗️ Architecture Documentation

### Core Components

**AppState**:
- Centralized state management using `@StateObject`
- Manages configurations, results, and application settings
- Provides reactive updates to UI components

**TestExecutor**:
- Orchestrates live test execution
- Manages scenario processing and validation
- Provides progress callbacks for UI updates

**AnalysisEngine**:
- Handles log file parsing and analysis
- Implements pattern detection algorithms
- Calculates conversation metrics

**AdversarialTestOrchestrator**:
- Coordinates AI-powered testing sessions
- Manages provider connections and strategies
- Handles conversation flow and validation

**ReportGenerator**:
- Creates formatted reports in multiple formats
- Supports HTML, JSON, and Markdown output
- Provides interactive and static report options

### Communication Layer

**CommunicationManager**:
- Handles HTTP and WebSocket protocols
- Manages authentication and headers
- Provides timeout and retry logic

**ResponseValidator**:
- Implements all validation types
- Provides detailed validation results
- Supports custom validation logic

**AI Connectors**:
- Abstract interface for AI providers
- Handles provider-specific API calls
- Manages rate limiting and error handling

### User Interface

**SwiftUI Architecture**:
- Declarative UI with reactive data binding
- Native macOS design patterns
- Accessibility support built-in

**Navigation Structure**:
- Sidebar-based navigation
- Tab-based feature organization
- Modal sheets for configuration editing

**State Management**:
- `@StateObject` for app-wide state
- `@EnvironmentObject` for shared data
- `@State` for local component state

---

## 🔧 Configuration Reference

### Test Configuration

```swift
struct TestConfig: Codable {
    var targetBot: BotConfig
    var scenarios: [Scenario]
    var validation: ValidationConfig
    var timing: TimingConfig
    var reporting: ReportConfig
}

struct BotConfig: Codable {
    var name: String
    var protocol: BotProtocol // .http or .websocket
    var endpoint: String
    var authentication: AuthConfig?
    var headers: [String: String]?
    var provider: BotProvider? // .ollama, .openai, .anthropic, .generic
    var model: String?
}

struct Scenario: Codable {
    var id: String
    var name: String
    var description: String?
    var steps: [ConversationStep]
    var expectedOutcomes: [ValidationCriteria]
}
```

### Analysis Configuration

```swift
struct AnalysisConfig: Codable {
    var logSource: LogSource
    var filters: AnalysisFilters?
    var analysis: AnalysisSettings
    var reporting: ReportConfig
}

struct LogSource: Codable {
    var path: String
    var format: LogFormat // .json, .csv, .text, .auto
}

struct AnalysisSettings: Codable {
    var calculateMetrics: Bool
    var detectPatterns: Bool
    var checkContextRetention: Bool
}
```

### Adversarial Configuration

```swift
struct AdversarialTestConfig: Codable {
    var targetBot: AdversarialBotConfig
    var adversarialBot: AdversarialBotSettings
    var conversation: ConversationSettings
    var execution: ExecutionSettings
    var reporting: AdversarialReportConfig
}

struct ConversationSettings: Codable {
    var strategy: ConversationStrategy // .exploratory, .adversarial, .focused, .stress
    var maxTurns: Int
    var goals: [String]?
    var timeout: Int?
}
```

---

## 🧪 Testing Documentation

### Unit Testing

**Framework**: XCTest with Swift Testing
**Location**: `PatienceTests/` directory
**Coverage**: Core business logic and data models

**Test Structure**:
```swift
import XCTest
@testable import Patience

final class TestExecutorTests: XCTestCase {
    func testScenarioExecution() async throws {
        // Arrange
        let config = createTestConfig()
        let executor = TestExecutor()
        
        // Act
        let results = try await executor.executeTests(config: config) { _, _ in }
        
        // Assert
        XCTAssertEqual(results.summary.total, 1)
        XCTAssertTrue(results.summary.passed > 0)
    }
}
```

### Integration Testing

**Purpose**: Test component interactions and external API calls
**Approach**: Mock external dependencies, test real data flows
**Focus Areas**: Network communication, file I/O, AI provider integration

### UI Testing

**Framework**: XCTest UI Testing
**Purpose**: Test user interface interactions and workflows
**Coverage**: Critical user paths and accessibility

---

## 🚀 Deployment Documentation

### Building for Distribution

**Debug Build**:
```bash
xcodebuild -project Patience.xcodeproj -scheme Patience -configuration Debug build
```

**Release Build**:
```bash
xcodebuild -project Patience.xcodeproj -scheme Patience -configuration Release build
```

**Archive for Distribution**:
```bash
xcodebuild -project Patience.xcodeproj -scheme Patience archive -archivePath Patience.xcarchive
```

### Code Signing

**Development**: Automatic signing with Xcode
**Distribution**: Manual signing with distribution certificate
**Notarization**: Required for distribution outside App Store

### App Store Submission

1. Archive the application
2. Upload to App Store Connect
3. Complete app metadata
4. Submit for review
5. Release to App Store

---

## 🔒 Security Documentation

### App Sandboxing

**Entitlements**:
- `com.apple.security.app-sandbox`: Enables sandboxing
- `com.apple.security.network.client`: Network access
- `com.apple.security.files.user-selected.read-write`: File access

**Security Measures**:
- All file access through user selection
- Network requests only to configured endpoints
- API keys stored in Keychain
- No arbitrary code execution

### Privacy Protection

**Data Handling**:
- All processing happens locally
- No data sent to third parties (except configured AI providers)
- User controls all data sharing
- Transparent about API usage

**API Key Security**:
- Stored in macOS Keychain
- Never logged or displayed
- Encrypted at rest
- Secure transmission only

---

## 📊 Performance Documentation

### Optimization Strategies

**Memory Management**:
- Automatic Reference Counting (ARC)
- Lazy loading of large datasets
- Efficient data structures
- Memory-mapped file I/O for large logs

**CPU Optimization**:
- Async/await for non-blocking operations
- Background queues for heavy processing
- Efficient algorithms for pattern detection
- Caching of computed results

**Network Optimization**:
- Connection pooling and reuse
- Request batching where possible
- Timeout and retry logic
- Rate limiting compliance

### Performance Monitoring

**Metrics**:
- Test execution time
- Memory usage during analysis
- Network request latency
- UI responsiveness

**Profiling Tools**:
- Xcode Instruments
- Memory debugger
- Network profiler
- Time profiler

---

## 🐛 Debugging Documentation

### Common Issues

**Build Errors**:
- Verify Xcode version compatibility
- Check Swift version requirements
- Resolve dependency conflicts
- Clean build folder if needed

**Runtime Errors**:
- Check network connectivity
- Verify API key configuration
- Validate input file formats
- Review error logs

**Performance Issues**:
- Profile with Instruments
- Check for memory leaks
- Optimize heavy operations
- Use background queues

### Debugging Tools

**Xcode Debugger**:
- Breakpoints and step-through debugging
- Variable inspection
- Call stack analysis
- Memory graph debugger

**Console Logging**:
- Structured logging with os_log
- Different log levels (debug, info, error)
- Subsystem organization
- Performance logging

**Crash Reporting**:
- Automatic crash collection
- Symbolicated stack traces
- Crash analytics
- User feedback integration

---

## 🔄 Maintenance Documentation

### Code Maintenance

**Regular Tasks**:
- Update dependencies
- Review and update documentation
- Refactor deprecated APIs
- Optimize performance bottlenecks

**Code Quality**:
- SwiftLint for style consistency
- Code reviews for all changes
- Unit test coverage maintenance
- Documentation updates

### Dependency Management

**Swift Package Manager**:
- Regular dependency updates
- Security vulnerability monitoring
- Compatibility testing
- License compliance

---

## 💡 Best Practices

### Development

**Swift Coding**:
- Follow Swift API Design Guidelines
- Use meaningful names and documentation
- Prefer value types over reference types
- Handle errors gracefully

**SwiftUI Development**:
- Keep views small and focused
- Use proper state management
- Implement accessibility features
- Test on different screen sizes

**Testing**:
- Write tests before implementing features
- Test both success and failure cases
- Use dependency injection for testability
- Maintain high test coverage

### User Experience

**Interface Design**:
- Follow macOS Human Interface Guidelines
- Provide clear feedback for all actions
- Handle errors gracefully with helpful messages
- Support keyboard navigation

**Performance**:
- Keep UI responsive during long operations
- Provide progress indicators
- Cache expensive computations
- Optimize for battery life

---

## 📧 Getting Help

### Documentation Issues

If you find errors or gaps in this documentation:

1. **Search existing issues** for similar problems
2. **Check the latest version** of documentation
3. **Open a documentation issue** with specific details
4. **Suggest improvements** or corrections

### Development Questions

For development-related questions:

1. **Review this documentation** thoroughly
2. **Check the code examples** in the project
3. **Search closed issues** for similar questions
4. **Open a new issue** with the "question" label

### Bug Reports

For bug reports:

1. **Use the latest version** of Patience
2. **Include system information** (macOS version, Xcode version)
3. **Provide reproduction steps** with specific details
4. **Include relevant logs** and error messages

---

**Last Updated**: 2025-01-15
**Version**: 1.0.0