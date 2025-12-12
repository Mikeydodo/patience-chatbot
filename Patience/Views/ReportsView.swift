import SwiftUI

struct ReportsView: View {
    @EnvironmentObject var appState: AppState
    @State private var selectedReportId: TestReport.ID?
    @State private var showingExportSheet = false
    @State private var searchText = ""
    
    var filteredReports: [TestReport] {
        if searchText.isEmpty {
            return appState.reports
        } else {
            return appState.reports.filter { report in
                report.scenarioResults.contains { scenario in
                    scenario.scenarioName.localizedCaseInsensitiveContains(searchText)
                }
            }
        }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                VStack(alignment: .leading) {
                    Text("Reports")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    Text("View and export test reports")
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                HStack(spacing: 12) {
                    Button("Export All") {
                        showingExportSheet = true
                    }
                    .buttonStyle(.bordered)
                    .disabled(appState.reports.isEmpty)
                    
                    Button("Clear All") {
                        appState.reports.removeAll()
                    }
                    .buttonStyle(.bordered)
                    .disabled(appState.reports.isEmpty)
                }
            }
            .padding()
            
            Divider()
            
            if appState.reports.isEmpty {
                // Empty state
                if #available(macOS 14.0, *) {
                    ContentUnavailableView(
                        "No Reports Available",
                        systemImage: "doc.text",
                        description: Text("Run some tests to generate reports")
                    )
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    VStack(spacing: 8) {
                        Image(systemName: "doc.text")
                            .font(.largeTitle)
                            .foregroundColor(.secondary)
                        Text("No Reports Available")
                            .font(.headline)
                        Text("Run some tests to generate reports")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            } else {
                // Reports interface
                HSplitView {
                    // Left: Reports list
                    VStack(alignment: .leading, spacing: 0) {
                        // Search bar
                        HStack {
                            Image(systemName: "magnifyingglass")
                                .foregroundColor(.secondary)
                            
                            TextField("Search reports...", text: $searchText)
                                .textFieldStyle(.plain)
                        }
                        .padding(.horizontal)
                        .padding(.vertical, 8)
                        .background(Color(.controlBackgroundColor))
                        .cornerRadius(8)
                        .padding()
                        
                        // Reports list
                        List(filteredReports, selection: $selectedReportId) { report in
                            ReportRow(report: report)
                        }
                        .listStyle(.sidebar)
                    }
                    .frame(minWidth: 350)
                    
                    // Right: Report detail
                    VStack {
                        if let selectedId = selectedReportId, let report = filteredReports.first(where: { $0.id == selectedId }) {
                            ReportDetailView(report: report)
                        } else {
                            if #available(macOS 14.0, *) {
                                ContentUnavailableView(
                                    "Select a Report",
                                    systemImage: "doc.text",
                                    description: Text("Choose a report to view details")
                                )
                            } else {
                                VStack(spacing: 8) {
                                    Image(systemName: "doc.text")
                                        .font(.largeTitle)
                                        .foregroundColor(.secondary)
                                    Text("Select a Report")
                                        .font(.headline)
                                    Text("Choose a report to view details")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }
        }
        .searchable(text: $searchText, prompt: "Search reports...")
        .sheet(isPresented: $showingExportSheet) {
            ExportReportsView()
        }
    }
}

struct ReportRow: View {
    let report: TestReport
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Test Report")
                        .font(.headline)
                    
                    Text(formatDate(report.timestamp))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 2) {
                    HStack(spacing: 4) {
                        Text("\(report.passedScenarios)")
                            .foregroundColor(.green)
                            .fontWeight(.semibold)
                        Text("/")
                            .foregroundColor(.secondary)
                        Text("\(report.totalScenarios)")
                            .fontWeight(.semibold)
                    }
                    .font(.caption)
                    
                    let passRate = Double(report.passedScenarios) / Double(report.totalScenarios) * 100
                    Text("\(Int(passRate))%")
                        .font(.caption2)
                        .foregroundColor(passRate >= 80 ? .green : passRate >= 60 ? .orange : .red)
                }
            }
            
            // Scenario summary
            HStack {
                ForEach(report.scenarioResults.prefix(3), id: \.scenarioId) { scenario in
                    HStack(spacing: 2) {
                        Image(systemName: scenario.passed ? "checkmark.circle.fill" : "xmark.circle.fill")
                            .foregroundColor(scenario.passed ? .green : .red)
                            .font(.caption2)
                        
                        Text(scenario.scenarioName)
                            .font(.caption2)
                            .lineLimit(1)
                    }
                }
                
                if report.scenarioResults.count > 3 {
                    Text("+\(report.scenarioResults.count - 3) more")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
            }
        }
        .padding(.vertical, 4)
        .contextMenu {
            Button("Export as HTML") {
                exportReport(report, format: .html)
            }
            
            Button("Export as JSON") {
                exportReport(report, format: .json)
            }
            
            Button("Export as Markdown") {
                exportReport(report, format: .markdown)
            }
            
            Divider()
            
            Button("Delete", role: .destructive) {
                // Delete report
            }
        }
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
    
    private func exportReport(_ report: TestReport, format: ReportFormat) {
        let generator = ReportGenerator()
        let content = generator.formatReport(report, format: format)
        
        let panel = NSSavePanel()
        panel.allowedContentTypes = [format == .json ? .json : format == .html ? .html : .plainText]
        panel.nameFieldStringValue = "report-\(Int(report.timestamp.timeIntervalSince1970)).\(format.rawValue)"
        
        panel.begin { response in
            if response == .OK, let url = panel.url {
                do {
                    try content.write(to: url, atomically: true, encoding: .utf8)
                } catch {
                    print("Failed to export report: \(error)")
                }
            }
        }
    }
}

struct ReportDetailView: View {
    let report: TestReport
    @State private var selectedScenarioId: ScenarioResult.ID?
    
    var body: some View {
        VStack(spacing: 0) {
            // Report header
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Test Report")
                            .font(.title2)
                            .fontWeight(.bold)
                        
                        Text("Generated \(formatDate(report.timestamp))")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    Menu {
                        Button("Export as HTML") {
                            exportReport(format: .html)
                        }
                        
                        Button("Export as JSON") {
                            exportReport(format: .json)
                        }
                        
                        Button("Export as Markdown") {
                            exportReport(format: .markdown)
                        }
                    } label: {
                        Image(systemName: "square.and.arrow.up")
                    }
                    .buttonStyle(.bordered)
                }
                
                // Summary metrics
                LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 4), spacing: 16) {
                    MetricCard(title: "Total", value: "\(report.totalScenarios)")
                    MetricCard(title: "Passed", value: "\(report.passedScenarios)")
                    MetricCard(title: "Failed", value: "\(report.failedScenarios)")
                    
                    let passRate = Double(report.passedScenarios) / Double(report.totalScenarios) * 100
                    MetricCard(title: "Pass Rate", value: "\(Int(passRate))%")
                }
            }
            .padding()
            .background(Color(.controlBackgroundColor))
            
            Divider()
            
            // Scenario results
            HSplitView {
                // Left: Scenario list
                VStack(alignment: .leading, spacing: 0) {
                    Text("Scenarios")
                        .font(.headline)
                        .padding()
                    
                    List(report.scenarioResults, selection: $selectedScenarioId) { scenario in
                        ScenarioResultRow(scenario: scenario)
                    }
                    .listStyle(.sidebar)
                }
                .frame(minWidth: 300)
                
                // Right: Scenario detail
                VStack {
                    if let selectedId = selectedScenarioId, let scenario = report.scenarioResults.first(where: { $0.id == selectedId }) {
                        ScenarioDetailView(scenario: scenario)
                    } else {
                        if #available(macOS 14.0, *) {
                            ContentUnavailableView(
                                "Select a Scenario",
                                systemImage: "list.bullet",
                                description: Text("Choose a scenario to view details")
                            )
                        } else {
                            VStack(spacing: 8) {
                                Image(systemName: "list.bullet")
                                    .font(.largeTitle)
                                    .foregroundColor(.secondary)
                                Text("Select a Scenario")
                                    .font(.headline)
                                Text("Choose a scenario to view details")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .full
        formatter.timeStyle = .medium
        return formatter.string(from: date)
    }
    
    private func exportReport(format: ReportFormat) {
        let generator = ReportGenerator()
        let content = generator.formatReport(report, format: format)
        
        let panel = NSSavePanel()
        panel.allowedContentTypes = [format == .json ? .json : format == .html ? .html : .plainText]
        panel.nameFieldStringValue = "report-\(Int(report.timestamp.timeIntervalSince1970)).\(format.rawValue)"
        
        panel.begin { response in
            if response == .OK, let url = panel.url {
                do {
                    try content.write(to: url, atomically: true, encoding: .utf8)
                } catch {
                    print("Failed to export report: \(error)")
                }
            }
        }
    }
}

struct ScenarioResultRow: View {
    let scenario: ScenarioResult
    
    var body: some View {
        HStack {
            Image(systemName: scenario.passed ? "checkmark.circle.fill" : "xmark.circle.fill")
                .foregroundColor(scenario.passed ? .green : .red)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(scenario.scenarioName)
                    .font(.headline)
                    .lineLimit(1)
                
                Text("Duration: \(formatDuration(scenario.duration))")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                if !scenario.passed, let error = scenario.error {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.red)
                        .lineLimit(2)
                }
            }
            
            Spacer()
        }
        .padding(.vertical, 4)
    }
    
    private func formatDuration(_ duration: Double) -> String {
        if duration < 1 {
            return String(format: "%.0fms", duration * 1000)
        } else {
            return String(format: "%.1fs", duration)
        }
    }
}

struct ScenarioDetailView: View {
    let scenario: ScenarioResult
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Scenario header
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: scenario.passed ? "checkmark.circle.fill" : "xmark.circle.fill")
                            .foregroundColor(scenario.passed ? .green : .red)
                            .font(.title2)
                        
                        Text(scenario.scenarioName)
                            .font(.title2)
                            .fontWeight(.bold)
                        
                        Spacer()
                    }
                    
                    Text("Duration: \(formatDuration(scenario.duration))")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    if let error = scenario.error {
                        Text("Error: \(error)")
                            .font(.caption)
                            .foregroundColor(.red)
                            .padding(.vertical, 4)
                            .padding(.horizontal, 8)
                            .background(Color.red.opacity(0.1))
                            .cornerRadius(4)
                    }
                }
                
                // Conversation history
                VStack(alignment: .leading, spacing: 12) {
                    Text("Conversation")
                        .font(.headline)
                    
                    LazyVStack(spacing: 8) {
                        ForEach(scenario.conversationHistory.messages) { message in
                            ConversationMessageView(message: message)
                        }
                    }
                }
                
                // Validation results
                if !scenario.validationResults.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Validation Results")
                            .font(.headline)
                        
                        LazyVStack(spacing: 8) {
                            ForEach(scenario.validationResults) { validation in
                                ValidationResultView(validation: validation)
                            }
                        }
                    }
                }
            }
            .padding()
        }
    }
    
    private func formatDuration(_ duration: Double) -> String {
        if duration < 1 {
            return String(format: "%.0fms", duration * 1000)
        } else {
            return String(format: "%.1fs", duration)
        }
    }
}

struct ConversationMessageView: View {
    let message: ConversationMessage
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Avatar
            Circle()
                .fill(message.sender == .patience ? Color.blue : Color.green)
                .frame(width: 32, height: 32)
                .overlay(
                    Text(message.sender == .patience ? "U" : "B")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                )
            
            // Message content
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(message.sender == .patience ? "User" : "Bot")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    Text(formatTime(message.timestamp))
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
                
                Text(message.content)
                    .font(.body)
                    .padding(.vertical, 8)
                    .padding(.horizontal, 12)
                    .background(message.sender == .patience ? Color.blue.opacity(0.1) : Color.green.opacity(0.1))
                    .cornerRadius(8)
            }
        }
    }
    
    private func formatTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .medium
        return formatter.string(from: date)
    }
}

struct ValidationResultView: View {
    let validation: ValidationResult
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: validation.passed ? "checkmark.circle.fill" : "xmark.circle.fill")
                .foregroundColor(validation.passed ? .green : .red)
                .font(.title3)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(validation.message ?? "Validation result")
                    .font(.body)
                    .fontWeight(.medium)
                
                if let expected = validation.expected {
                    Text("Expected: \(expected)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Text("Actual: \(validation.actual)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                if let details = validation.details, !details.isEmpty {
                    VStack(alignment: .leading, spacing: 2) {
                        ForEach(Array(details.keys.sorted()), id: \.self) { key in
                            Text("\(key): \(details[key] ?? "")")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }
            
            Spacer()
        }
        .padding()
        .background(validation.passed ? Color.green.opacity(0.05) : Color.red.opacity(0.05))
        .cornerRadius(8)
    }
}

struct ExportReportsView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var appState: AppState
    @State private var selectedFormat: ReportFormat = .html
    @State private var includeAllReports = true
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Export Options")
                        .font(.headline)
                    
                    Picker("Format", selection: $selectedFormat) {
                        Text("HTML").tag(ReportFormat.html)
                        Text("JSON").tag(ReportFormat.json)
                        Text("Markdown").tag(ReportFormat.markdown)
                    }
                    .pickerStyle(.segmented)
                    
                    Toggle("Include all reports", isOn: $includeAllReports)
                }
                
                Spacer()
                
                HStack(spacing: 12) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .buttonStyle(.bordered)
                    
                    Button("Export") {
                        exportReports()
                        dismiss()
                    }
                    .buttonStyle(.borderedProminent)
                }
            }
            .padding()
            .navigationTitle("Export Reports")
#if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
#endif
        }
    }
    
    private func exportReports() {
        let panel = NSSavePanel()
        panel.allowedContentTypes = [selectedFormat == .json ? .json : selectedFormat == .html ? .html : .plainText]
        panel.nameFieldStringValue = "patience-reports-\(Int(Date().timeIntervalSince1970)).\(selectedFormat.rawValue)"
        
        panel.begin { response in
            if response == .OK, let url = panel.url {
                let generator = ReportGenerator()
                
                if includeAllReports && appState.reports.count > 1 {
                    // Export combined report
                    var combinedContent = ""
                    
                    for (index, report) in appState.reports.enumerated() {
                        let content = generator.formatReport(report, format: selectedFormat)
                        combinedContent += content
                        
                        if index < appState.reports.count - 1 {
                            combinedContent += selectedFormat == .html ? "<hr>" : "\n---\n"
                        }
                    }
                    
                    do {
                        try combinedContent.write(to: url, atomically: true, encoding: .utf8)
                    } catch {
                        print("Failed to export reports: \(error)")
                    }
                } else if let report = appState.reports.first {
                    // Export single report
                    let content = generator.formatReport(report, format: selectedFormat)
                    
                    do {
                        try content.write(to: url, atomically: true, encoding: .utf8)
                    } catch {
                        print("Failed to export report: \(error)")
                    }
                }
            }
        }
    }
}

#Preview {
    ReportsView()
        .environmentObject(AppState())
}
