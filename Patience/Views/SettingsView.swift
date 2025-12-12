import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        TabView {
            GeneralSettingsView()
                .tabItem {
                    Label("General", systemImage: "gear")
                }
            
            TestingSettingsView()
                .tabItem {
                    Label("Testing", systemImage: "play.circle")
                }
            
            ReportingSettingsView()
                .tabItem {
                    Label("Reporting", systemImage: "doc.text")
                }
        }
        .frame(width: 500, height: 400)
    }
}

struct GeneralSettingsView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        Form {
            Section("Application") {
                Toggle("Auto-save configurations", isOn: $appState.autoSaveConfigs)
                Toggle("Show detailed logs", isOn: $appState.showDetailedLogs)
            }
            
            Section("Default Paths") {
                HStack {
                    TextField("Output Path", text: $appState.defaultOutputPath)
                    
                    Button("Browse") {
                        selectOutputPath()
                    }
                }
            }
        }
        .padding()
    }
    
    private func selectOutputPath() {
        let panel = NSOpenPanel()
        panel.canChooseDirectories = true
        panel.canChooseFiles = false
        panel.allowsMultipleSelection = false
        
        panel.begin { response in
            if response == .OK, let url = panel.url {
                appState.defaultOutputPath = url.path
            }
        }
    }
}

struct TestingSettingsView: View {
    @AppStorage("defaultTimeout") private var defaultTimeout: Double = 30.0
    @AppStorage("enableRetries") private var enableRetries: Bool = true
    @AppStorage("maxRetries") private var maxRetries: Int = 3
    
    var body: some View {
        Form {
            Section("Default Test Settings") {
                LabeledContent("Default Timeout") {
                    HStack(spacing: 8) {
                        TextField("Seconds", value: $defaultTimeout, format: .number)
                            .frame(width: 140)
                        Text("seconds")
                            .foregroundColor(.secondary)
                    }
                }
                
                Toggle("Enable retries on failure", isOn: $enableRetries)
                
                if enableRetries {
                    Stepper("Max retries: \(maxRetries)", value: $maxRetries, in: 1...10)
                }
            }
            
            Section("Validation") {
                // Add validation settings here
            }
        }
        .padding()
    }
}

struct ReportingSettingsView: View {
    @AppStorage("defaultReportFormat") private var defaultReportFormat: String = "html"
    @AppStorage("includeTimestamps") private var includeTimestamps: Bool = true
    @AppStorage("compressReports") private var compressReports: Bool = false
    
    var body: some View {
        Form {
            Section("Report Generation") {
                Picker("Default Format", selection: $defaultReportFormat) {
                    Text("HTML").tag("html")
                    Text("JSON").tag("json")
                    Text("Markdown").tag("markdown")
                }
                
                Toggle("Include timestamps", isOn: $includeTimestamps)
                Toggle("Compress large reports", isOn: $compressReports)
            }
        }
        .padding()
    }
}

#Preview {
    SettingsView()
        .environmentObject(AppState())
}
