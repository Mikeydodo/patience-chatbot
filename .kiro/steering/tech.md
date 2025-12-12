---
inclusion: always
---

# Technology Stack

## Primary Technologies

- **Language**: Swift 5.9+
- **Framework**: SwiftUI for native macOS GUI
- **Platform**: macOS 12.0+
- **IDE**: Xcode (primary), VSCode with Kiro AI assistant (secondary)
- **MCP**: Model Context Protocol enabled for extended AI capabilities

## Development Setup

### Requirements
- Xcode 14.0 or later
- macOS 12.0 or later
- Swift 5.9+

### Build Commands
```bash
# Open in Xcode
open Patience.xcodeproj

# Build from command line
xcodebuild -project Patience.xcodeproj -scheme Patience build

# Run tests
xcodebuild test -project Patience.xcodeproj -scheme Patience
```

## Common Commands

- **Build**: `⌘+B` in Xcode or `xcodebuild build`
- **Run**: `⌘+R` in Xcode
- **Test**: `⌘+U` in Xcode or `xcodebuild test`
- **Clean**: `⌘+Shift+K` in Xcode or `xcodebuild clean`
