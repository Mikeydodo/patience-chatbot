# Patience

A comprehensive native macOS application for chatbot testing with three powerful modes: live scenarios, log analysis, and AI-powered adversarial testing.

## Features

### 🚀 Live Testing
- **Scenario-based Testing**: Create multi-step conversation flows with expected responses
- **Protocol Support**: HTTP REST APIs with WebSocket support planned
- **Validation Types**: Exact matching, regex patterns, semantic similarity, and custom validators
- **Realistic Timing**: Configurable delays to simulate human typing patterns
- **Real-time Monitoring**: Live progress tracking and immediate feedback
- **Provider Support**: Generic HTTP endpoints, Ollama local models, and cloud APIs

### 📊 Log Analysis
- **Multi-format Import**: Drag-and-drop support for JSON, CSV, and text log files
- **Automatic Detection**: Smart format detection and parsing
- **Pattern Recognition**: Identify conversation patterns, failures, and success indicators
- **Metrics Calculation**: Response rates, message statistics, and timing analysis
- **Context Analysis**: Multi-turn conversation quality scoring
- **Advanced Filtering**: Date ranges, message counts, and content-based filters

### 🤖 Adversarial Testing
- **AI-Powered Testing**: Let AI models test your chatbot through realistic conversations
- **Multiple Providers**: 
  - **Ollama** - Local models (llama2, mistral) - Free and private
  - **OpenAI** - GPT-4, GPT-3.5 - Requires API key
  - **Anthropic** - Claude 3 models - Requires API key
- **Testing Strategies**:
  - **Exploratory** - Broad questions to map capabilities
  - **Adversarial** - Edge cases and challenging inputs
  - **Focused** - Deep dive into specific features
  - **Stress** - Rapid context switching and complex scenarios
- **Safety Controls**: Cost monitoring, rate limiting, and content filtering

### 📈 Comprehensive Reporting
- **Multiple Formats**: Export as HTML, JSON, or Markdown
- **Interactive Viewing**: Native macOS interface for browsing results
- **Detailed Transcripts**: Complete conversation histories with timestamps
- **Validation Analysis**: Pass/fail rates with detailed explanations
- **Visual Summaries**: Charts and metrics for quick insights

## Requirements

- **macOS 13.0** or later
- **Xcode 15.0** or later (for development)
- **Swift 5.9** or later (for development)

## Installation

### Option 1: Download Release (Recommended)
1. Download the latest release from the releases page
2. Drag `Patience.app` to your Applications folder
3. Launch Patience from Applications or Spotlight

### Option 2: Build from Source
1. Clone this repository
2. Open `Patience.xcodeproj` in Xcode
3. Build and run (⌘+R)

## Quick Start

### 1. Live Testing
1. Click **"New Configuration"** in the Testing tab
2. Enter your bot's endpoint URL
3. Add conversation scenarios with expected responses
4. Click **"Run Tests"** to execute

### 2. Log Analysis
1. Switch to the **Analysis** tab
2. Drag a log file onto the interface or click **"Import Log File"**
3. Configure analysis options (metrics, patterns, context)
4. View results in the interactive interface

### 3. Adversarial Testing
1. Go to the **Adversarial** tab
2. Click **"New Configuration"**
3. Set up your target bot and choose an AI provider
4. Select a testing strategy and parameters
5. Click **"Start Adversarial Testing"**

## Configuration

### Live Testing Configuration

```json
{
  "targetBot": {
    "name": "My Chatbot",
    "protocol": "http",
    "endpoint": "https://api.example.com/chat",
    "provider": "generic"
  },
  "scenarios": [
    {
      "id": "greeting-test",
      "name": "Greeting Test",
      "steps": [
        {
          "message": "Hello!",
          "expectedResponse": {
            "validationType": "pattern",
            "expected": "hello|hi|hey|greetings",
            "threshold": 0.8
          }
        }
      ],
      "expectedOutcomes": [
        {
          "type": "pattern",
          "expected": "friendly.*response",
          "description": "Bot should respond in a friendly manner"
        }
      ]
    }
  ],
  "validation": {
    "defaultType": "pattern",
    "semanticSimilarityThreshold": 0.8
  },
  "timing": {
    "enableDelays": true,
    "baseDelay": 1000,
    "delayPerCharacter": 50,
    "rapidFire": false,
    "responseTimeout": 30000
  },
  "reporting": {
    "outputPath": "~/Documents/Patience Reports",
    "formats": ["html", "json"],
    "includeConversationHistory": true,
    "verboseErrors": true
  }
}
