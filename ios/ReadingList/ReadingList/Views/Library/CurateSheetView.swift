import SwiftUI

struct CurateSheetView: View {
    let selectedLinks: [Link]
    let onDone: () -> Void

    @Environment(\.dismiss) private var dismiss

    @State private var recipient = ""
    @State private var message = ""
    @State private var isSaving = false
    @State private var shareURL: String? = nil
    @State private var error: String? = nil

    var body: some View {
        NavigationStack {
            Group {
                if let url = shareURL {
                    successView(url: url)
                } else {
                    formView
                }
            }
            .navigationTitle("Curate Collection")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") {
                        onDone()
                        dismiss()
                    }
                }
            }
        }
        .presentationDetents([.medium])
        .presentationDragIndicator(.visible)
    }

    // MARK: - Form

    var formView: some View {
        List {
            Section {
                Text("\(selectedLinks.count) article\(selectedLinks.count == 1 ? "" : "s") selected")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            Section("Who is this for?") {
                TextField("Recipient name (optional)", text: $recipient)
            }

            Section("Add a message") {
                TextField("Message (optional)", text: $message, axis: .vertical)
                    .lineLimit(3...6)
            }

            if let error {
                Section {
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(.red)
                }
            }

            Section {
                Button {
                    Task { await createCollection() }
                } label: {
                    HStack {
                        Spacer()
                        if isSaving {
                            ProgressView()
                        } else {
                            Label("Create Share Link", systemImage: "link.badge.plus")
                                .fontWeight(.semibold)
                        }
                        Spacer()
                    }
                }
                .disabled(isSaving)
            }
        }
    }

    // MARK: - Success

    func successView(url: String) -> some View {
        VStack(spacing: 20) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 56))
                .foregroundStyle(.green)

            Text("Collection Created!")
                .font(.title3)
                .fontWeight(.bold)

            Text(url)
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            HStack(spacing: 16) {
                Button {
                    UIPasteboard.general.string = url
                } label: {
                    Label("Copy Link", systemImage: "doc.on.doc")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)

                Button {
                    shareURL(url)
                } label: {
                    Label("Share", systemImage: "square.and.arrow.up")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
            }
            .padding(.horizontal, 32)

            Button("Done") {
                onDone()
                dismiss()
            }
            .foregroundStyle(.secondary)
            .padding(.top, 8)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Logic

    func createCollection() async {
        isSaving = true
        error = nil
        do {
            let ids = selectedLinks.map(\.id)
            let collectionId = try await SupabaseClient.shared.createCollection(
                recipient: recipient.isEmpty ? nil : recipient,
                message: message.isEmpty ? nil : message,
                linkIds: ids
            )
            shareURL = "https://chrislrose.aseva.ai/reading-list.html?collection=\(collectionId)"
        } catch {
            self.error = error.localizedDescription
        }
        isSaving = false
    }

    func shareURL(_ urlString: String) {
        guard let url = URL(string: urlString) else { return }
        let av = UIActivityViewController(activityItems: [url], applicationActivities: nil)
        if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let root = scene.windows.first?.rootViewController {
            var topController = root
            while let presented = topController.presentedViewController {
                topController = presented
            }
            topController.present(av, animated: true)
        }
    }
}
