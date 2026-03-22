import SwiftUI

struct ArticleDetailView: View {
    let link: Link
    @Environment(LibraryViewModel.self) private var vm
    @Environment(\.dismiss) private var dismiss

    @State private var editedNote: String = ""
    @State private var isEditingNote = false
    @State private var showReader = false
    @State private var currentLink: Link

    init(link: Link) {
        self.link = link
        self._currentLink = State(initialValue: link)
        self._editedNote = State(initialValue: link.note ?? "")
    }

    @State private var showEnrich = false

    var body: some View {
        ZStack {
            // Full-screen blurred background
            backgroundLayer.ignoresSafeArea()

            // Content
            ScrollView {
                VStack(spacing: 12) {
                    // Hero image
                    heroSection

                    // Cards
                    VStack(spacing: 10) {
                        titleCard
                        readButton
                        enrichButton
                        ratingAndStatusCard
                        noteCard
                        if currentLink.category != nil || hasTagContent {
                            metaCard
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 60)
                }
            }
        }
        // Floating close + share buttons — overlay so they don't shift content
        .overlay(alignment: .topTrailing) {
            HStack(spacing: 12) {
                navButton(icon: "square.and.arrow.up") { shareArticle() }
                navButton(icon: "xmark") { dismiss() }
            }
            .padding(.top, 56)
            .padding(.trailing, 20)
        }
        .sheet(isPresented: $showReader) {
            WebReaderView(url: currentLink.url, title: currentLink.title ?? currentLink.url)
        }
        .sheet(isPresented: $showEnrich) {
            EnrichSheetView(link: currentLink) { updatedLink in
                currentLink = updatedLink
            }
            .environment(vm)
        }
    }

    var hasTagContent: Bool {
        if let tags = currentLink.tags { return !tags.isEmpty }
        return false
    }

    // MARK: - Background

    @ViewBuilder
    var backgroundLayer: some View {
        if let rawURL = currentLink.image, let imageURL = URL(string: rawURL) {
            AsyncImage(url: imageURL) { phase in
                if case .success(let img) = phase {
                    img.resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .blur(radius: 60)
                        .saturation(0.6)
                        .overlay(Color.black.opacity(0.55))
                } else {
                    darkGradientBackground
                }
            }
        } else {
            darkGradientBackground
        }
    }

    var darkGradientBackground: some View {
        LinearGradient(
            colors: domainGradient(for: currentLink.domain).map { $0.opacity(0.6) } + [Color.black.opacity(0.3)],
            startPoint: .top,
            endPoint: .bottom
        )
    }

    // MARK: - Hero

    @ViewBuilder
    var heroSection: some View {
        if let rawURL = currentLink.image, let imageURL = URL(string: rawURL) {
            AsyncImage(url: imageURL) { phase in
                if case .success(let img) = phase {
                    img.resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(maxWidth: .infinity)
                        .frame(height: 280)
                        .clipped()
                } else {
                    fallbackHero
                }
            }
        } else {
            fallbackHero
        }
    }

    var fallbackHero: some View {
        ZStack {
            LinearGradient(colors: domainGradient(for: currentLink.domain),
                           startPoint: .topLeading, endPoint: .bottomTrailing)
            if let first = currentLink.domain?.first {
                Text(String(first).uppercased())
                    .font(.system(size: 80, weight: .black, design: .rounded))
                    .foregroundStyle(.white.opacity(0.2))
            }
        }
        .frame(height: 240)
    }

    // MARK: - Title Card

    var titleCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                faviconView
                Text(currentLink.domain ?? "")
                    .font(.subheadline).foregroundStyle(.secondary)
                Spacer()
                if let savedAt = currentLink.savedAt {
                    Text(savedAt.formatted(date: .abbreviated, time: .omitted))
                        .font(.caption).foregroundStyle(.secondary)
                }
            }
            Text(currentLink.title ?? currentLink.url)
                .font(.title2).fontWeight(.bold).foregroundStyle(.primary)
            if let desc = currentLink.description {
                Text(desc).font(.subheadline).foregroundStyle(.secondary).lineLimit(3)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .materialCard()
    }

    @ViewBuilder
    var faviconView: some View {
        if let rawFavicon = currentLink.favicon, let faviconURL = URL(string: rawFavicon) {
            AsyncImage(url: faviconURL) { phase in
                if case .success(let img) = phase {
                    img.resizable().frame(width: 16, height: 16).clipShape(Circle())
                }
            }
        }
    }

    // MARK: - Read Button

    var readButton: some View {
        Button { showReader = true } label: {
            HStack(spacing: 10) {
                Image(systemName: "book.open.fill")
                Text("Read Article").fontWeight(.semibold)
            }
            .font(.headline)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .foregroundStyle(.white)
            .background(Color.accentColor, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
    }

    // MARK: - Enrich Button

    var enrichButton: some View {
        Button { showEnrich = true } label: {
            HStack(spacing: 10) {
                Image(systemName: "sparkles")
                Text("Enrich with AI").fontWeight(.semibold)
            }
            .font(.headline)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .foregroundStyle(.white)
            .background(
                LinearGradient(colors: [Color.purple, Color.indigo],
                               startPoint: .leading, endPoint: .trailing),
                in: RoundedRectangle(cornerRadius: 14, style: .continuous)
            )
        }
    }

    // MARK: - Rating + Status Card

    var ratingAndStatusCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Stars
            VStack(alignment: .leading, spacing: 10) {
                sectionLabel("Rating", icon: "star")
                HStack(spacing: 8) {
                    ForEach(1...5, id: \.self) { i in
                        Button {
                            let n = currentLink.stars == i ? 0 : i
                            currentLink.stars = n
                            Task { await vm.updateStars(link: link, stars: n) }
                        } label: {
                            Image(systemName: i <= (currentLink.stars ?? 0) ? "star.fill" : "star")
                                .font(.title2)
                                .foregroundStyle(i <= (currentLink.stars ?? 0) ? .yellow : Color(.systemGray3))
                        }
                        .buttonStyle(.plain)
                        .animation(.spring(duration: 0.2, bounce: 0.6), value: currentLink.stars)
                    }
                    Spacer()
                }
            }

            Divider()

            // Status
            VStack(alignment: .leading, spacing: 10) {
                sectionLabel("Status", icon: "tag")
                HStack(spacing: 8) {
                    ForEach(["to-read", "to-try", "to-share", "done"], id: \.self) { status in
                        let isSelected = currentLink.status == status
                        Button {
                            let newStatus = isSelected ? nil : status
                            currentLink.status = newStatus
                            currentLink.read = newStatus == "done"
                            Task { await vm.updateStatus(link: link, status: newStatus) }
                        } label: {
                            StatusPill(status: status)
                                .scaleEffect(isSelected ? 1.08 : 1)
                                .opacity(currentLink.status == nil || isSelected ? 1 : 0.4)
                        }
                        .buttonStyle(.plain)
                        .animation(.spring(duration: 0.25, bounce: 0.5), value: currentLink.status)
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .materialCard()
    }

    // MARK: - Note Card

    var noteCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionLabel("Note", icon: "note.text")
            if isEditingNote {
                TextEditor(text: $editedNote)
                    .frame(minHeight: 80)
                    .padding(8)
                    .background(Color(.systemGray5))
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                HStack {
                    Button("Cancel") {
                        editedNote = currentLink.note ?? ""
                        isEditingNote = false
                    }.foregroundStyle(.secondary)
                    Spacer()
                    Button("Save") {
                        currentLink.note = editedNote.isEmpty ? nil : editedNote
                        isEditingNote = false
                        Task { await vm.updateNote(link: link, note: editedNote) }
                    }.fontWeight(.semibold)
                }
            } else {
                Button { isEditingNote = true } label: {
                    if let note = currentLink.note, !note.isEmpty {
                        Text(note).font(.body).foregroundStyle(.primary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    } else {
                        Label("Add a note…", systemImage: "plus.circle")
                            .foregroundStyle(.secondary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }.buttonStyle(.plain)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .materialCard()
    }

    // MARK: - Meta Card

    var metaCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            if let category = currentLink.category {
                VStack(alignment: .leading, spacing: 6) {
                    sectionLabel("Category", icon: "folder")
                    Text(category)
                        .font(.subheadline)
                        .padding(.horizontal, 10).padding(.vertical, 4)
                        .background(Color.indigo.opacity(0.2))
                        .foregroundStyle(.indigo)
                        .clipShape(Capsule())
                }
            }
            if let tags = currentLink.tags, !tags.isEmpty {
                if currentLink.category != nil { Divider() }
                VStack(alignment: .leading, spacing: 6) {
                    sectionLabel("Tags", icon: "tag")
                    FlowLayout(tags: tags.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) })
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .materialCard()
    }

    // MARK: - Helpers

    func sectionLabel(_ text: String, icon: String) -> some View {
        Label(text, systemImage: icon)
            .font(.footnote).fontWeight(.semibold).foregroundStyle(.secondary)
    }

    func navButton(icon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(.white)
                .frame(width: 36, height: 36)
                .background(.ultraThinMaterial, in: Circle())
        }
    }

    func shareArticle() {
        guard let url = URL(string: currentLink.url) else { return }
        let av = UIActivityViewController(activityItems: [url], applicationActivities: nil)
        if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let root = scene.windows.first?.rootViewController {
            root.present(av, animated: true)
        }
    }
}

// MARK: - Material Card modifier

extension View {
    func materialCard() -> some View {
        self
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(Color(white: 0.14).opacity(0.92))
                    .overlay(
                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                            .strokeBorder(Color.white.opacity(0.1), lineWidth: 0.5)
                    )
            )
    }

    func glassCard() -> some View { materialCard() }
}

// MARK: - Flow layout

struct FlowLayout: View {
    let tags: [String]
    var body: some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 60), spacing: 6)], alignment: .leading, spacing: 6) {
            ForEach(tags, id: \.self) { tag in
                Text(tag).font(.caption)
                    .padding(.horizontal, 8).padding(.vertical, 4)
                    .background(Color(.systemGray5))
                    .foregroundStyle(.secondary)
                    .clipShape(Capsule())
            }
        }
    }
}
