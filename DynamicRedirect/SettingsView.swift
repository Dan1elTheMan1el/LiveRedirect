import SwiftUI

struct SettingsView: View {
    var body: some View {
        NavigationView {
            VStack(spacing: 16) {
                Image(systemName: "safari")
                    .font(.system(size: 48))
                    .foregroundColor(.blue)
                Text("LiveRedirector")
                    .font(.headline)
                Text("Manage URL match rules from the Safari extension.")
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
                Text("Open Safari → tap the LiveRedirector icon → add URLs/domains to match. Matching pages will open in LiveContainer.")
                    .foregroundColor(.secondary)
                    .font(.footnote)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .navigationTitle("LiveRedirector")
        }
    }
}
