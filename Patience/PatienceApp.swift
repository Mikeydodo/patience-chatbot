import SwiftUI
import AppKit

@main
struct PatienceApp: App {
    @StateObject private var appState = AppState()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
        }
        .windowStyle(.hiddenTitleBar)
        .windowToolbarStyle(.unified)
        
        Settings {
            SettingsView()
                .environmentObject(appState)
        }
        
        WindowGroup("Help") {
            HelpView()
        }
        .handlesExternalEvents(matching: Set(arrayLiteral: "help"))
        
        .commands {
            CommandGroup(replacing: .help) {
                Button("Patience Help") {
                    NSApp.sendAction(#selector(AppCommands.showHelpWindow), to: nil, from: nil)
                }
            }
        }
    }
}

class AppCommands: NSObject {
    @objc static func showHelpWindow() {
        NotificationCenter.default.post(name: Notification.Name("ShowHelpWindow"), object: nil)
    }
}

struct HelpView: View {
    @State private var window: NSWindow? = nil
    
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Patience Help")
                .font(.largeTitle)
                .padding(.bottom)
            Text("Welcome to Patience! Here are some helpful resources:")
            Link("README", destination: URL(string: "https://github.com/your-repo/Patience#readme")!)
            Link("DOCUMENTATION", destination: URL(string: "https://github.com/your-repo/Patience/wiki")!)
            Spacer()
        }
        .padding()
        .frame(minWidth: 400, minHeight: 200)
        .onAppear {
            DispatchQueue.main.async {
                if window == nil {
                    window = NSApp.windows.first(where: { $0.contentView?.subviews.contains(where: { view in
                        (view as? NSHostingView<HelpView>) != nil
                    }) ?? false})
                }
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: Notification.Name("ShowHelpWindow"))) { _ in
            if let window = window {
                window.makeKeyAndOrderFront(nil)
                NSApp.activate(ignoringOtherApps: true)
            }
        }
    }
}
