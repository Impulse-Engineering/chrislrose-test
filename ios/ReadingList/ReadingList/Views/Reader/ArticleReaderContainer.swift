import SwiftUI

/// Full-screen immersive reader with swipe navigation between articles.
struct ArticleReaderContainer: View {
    let links: [Link]
    let initialIndex: Int
    let vm: LibraryViewModel

    @Environment(\.dismiss) private var dismiss

    @State private var currentIndex: Int
    @State private var showInfo = false
    @State private var showTypography = false
    @State private var isReaderMode = false

    @AppStorage("readerFontSize") private var fontSize: Double = 17
    @AppStorage("readerFont") private var fontRaw: String = "system"
    @AppStorage("readerTheme") private var themeRaw: String = "dark"

    init(links: [Link], initialIndex: Int, vm: LibraryViewModel) {
        self.links = links
        self.initialIndex = initialIndex
        self.vm = vm
        self._currentIndex = State(initialValue: initialIndex)
    }

    var currentLink: Link {
        links[min(currentIndex, links.count - 1)]
    }

    var font: ReaderFont { ReaderFont(rawValue: fontRaw) ?? .system }
    var theme: ReaderTheme { ReaderTheme(rawValue: themeRaw) ?? .dark }

    var body: some View {
        NavigationStack {
            readerContent
                .gesture(swipeGesture)
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    // Leading: back/close button
                    ToolbarItem(placement: .topBarLeading) {
                        Button { dismiss() } label: {
                            Image(systemName: "chevron.left")
                                .font(.system(size: 17, weight: .medium))
                        }
                    }

                    // Trailing: action buttons
                    ToolbarItemGroup(placement: .topBarTrailing) {
                        // Typography (Aa)
                        Button { showTypography = true } label: {
                            Image(systemName: "textformat.size")
                        }

                        // Reader/Web toggle
                        Button {
                            withAnimation(.spring(duration: 0.3)) { isReaderMode.toggle() }
                        } label: {
                            Image(systemName: isReaderMode ? "globe" : "doc.text")
                        }

                        // Share
                        Button { shareArticle() } label: {
                            Image(systemName: "square.and.arrow.up")
                        }

                        // Overflow: info, safari, copy
                        Menu {
                            Button { showInfo = true } label: {
                                Label("Article Info", systemImage: "info.circle")
                            }
                            Button {
                                guard let url = URL(string: currentLink.url) else { return }
                                UIApplication.shared.open(url)
                            } label: {
                                Label("Open in Safari", systemImage: "safari")
                            }
                            Button {
                                UIPasteboard.general.string = currentLink.url
                            } label: {
                                Label("Copy URL", systemImage: "doc.on.doc")
                            }
                            Divider()
                            Text("\(currentIndex + 1) of \(links.count)")
                        } label: {
                            Image(systemName: "ellipsis")
                        }
                    }
                }
        }
        .sheet(isPresented: $showInfo) {
            ArticleDetailView(link: currentLink)
                .environment(vm)
        }
        .sheet(isPresented: $showTypography) {
            TypographySheet()
        }
    }

    // MARK: - Reader Content

    @ViewBuilder
    var readerContent: some View {
        if let webURL = URL(string: currentLink.url) {
            if isReaderMode {
                ReaderWebView(
                    url: webURL,
                    fontSize: fontSize,
                    font: font,
                    theme: theme,
                    onFallback: { withAnimation { isReaderMode = false } }
                )
                .id(currentLink.id + "reader")
                .ignoresSafeArea(edges: .bottom)
            } else {
                WebView(url: webURL)
                    .id(currentLink.id + "web")
                    .ignoresSafeArea(edges: .bottom)
            }
        } else {
            ContentUnavailableView("Invalid URL", systemImage: "link.badge.plus")
        }
    }

    // MARK: - Swipe Gesture

    var swipeGesture: some Gesture {
        DragGesture(minimumDistance: 50)
            .onEnded { value in
                let horizontal = value.translation.width
                let vertical = value.translation.height
                guard abs(horizontal) > abs(vertical) else { return }

                if horizontal < -50 && currentIndex < links.count - 1 {
                    withAnimation(.spring(duration: 0.3)) { currentIndex += 1 }
                } else if horizontal > 50 && currentIndex > 0 {
                    withAnimation(.spring(duration: 0.3)) { currentIndex -= 1 }
                }
            }
    }

    // MARK: - Share

    func shareArticle() {
        guard let url = URL(string: currentLink.url) else { return }
        let av = UIActivityViewController(activityItems: [url], applicationActivities: nil)
        if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let root = scene.windows.first?.rootViewController {
            root.present(av, animated: true)
        }
    }
}
