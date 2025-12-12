---
inclusion: always
---

# Project Structure

## Directory Organization

```
.
├── .kiro/                      # Kiro AI assistant configuration
│   └── steering/               # AI guidance documents
├── .vscode/                    # VSCode workspace settings
├── Patience/                   # Swift source code
│   ├── Assets.xcassets/        # App icons and images
│   ├── Core/                   # Business logic and algorithms
│   ├── Models/                 # Data models and structures
│   ├── Views/                  # SwiftUI view components
│   ├── Preview Content/        # SwiftUI preview assets
│   ├── ContentView.swift       # Main app view
│   ├── PatienceApp.swift       # App entry point
│   └── Patience.entitlements   # App permissions
├── Patience.xcodeproj/         # Xcode project configuration
└── Documentation files         # README, CHANGELOG, etc.
```

## Conventions

### File Organization

- **Models/**: Data structures, enums, and business entities
- **Core/**: Business logic, algorithms, and utilities
- **Views/**: SwiftUI views organized by feature
- **Assets.xcassets/**: Images, colors, and other visual assets
- Keep configuration files at the root level
- Group related functionality into dedicated directories

### Naming Conventions

- **Swift Files**: PascalCase (e.g., `ContentView.swift`, `GameEngine.swift`)
- **Directories**: PascalCase for Swift modules, lowercase for general folders
- **Assets**: Descriptive names in Assets.xcassets
- **Views**: Suffix with "View" (e.g., `GameView`, `SettingsView`)
- **Models**: Descriptive nouns (e.g., `Card`, `GameState`)

## Notes

This is a native macOS SwiftUI application structure following Apple's recommended patterns.
