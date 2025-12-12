import SwiftUI
import AppKit

struct HelpView: View {
    @State private var observer: NSObjectProtocol?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Help & Documentation")
                    .font(.largeTitle)
                    .bold()
                
                Group {
                    Text("README")
                        .font(.title2)
                        .bold()
                    if let readmeURL = Bundle.main.url(forResource: "README", withExtension: "md") {
                        Text(readmeURL.absoluteString)
                            .foregroundColor(.secondary)
                    } else {
                        Link("View README on GitHub", destination: URL(string: "https://github.com/username/repository/blob/main/README.md")!)
                    }
                }
                
                Group {
                    Text("Documentation")
                        .font(.title2)
                        .bold()
                    if let docURL = Bundle.main.url(forResource: "DOCUMENTATION", withExtension: "md") {
                        Text(docURL.absoluteString)
                            .foregroundColor(.secondary)
                    } else {
                        Link("View Documentation on GitHub", destination: URL(string: "https://github.com/username/repository/blob/main/DOCUMENTATION.md")!)
                    }
                }
            }
            .padding()
        }
        .onAppear {
            observer = NotificationCenter.default.addObserver(forName: Notification.Name("ShowHelpWindow"), object: nil, queue: .main) { _ in
                NSApp.activate(ignoringOtherApps: true)
            }
        }
        .onDisappear {
            if let observer = observer {
                NotificationCenter.default.removeObserver(observer)
                self.observer = nil
            }
        }
    }
}

#Preview {
    HelpView()
}
