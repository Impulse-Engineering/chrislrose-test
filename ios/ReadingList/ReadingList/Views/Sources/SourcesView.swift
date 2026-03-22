import SwiftUI

struct SourcesView: View {
    @Environment(LibraryViewModel.self) private var vm
    @Environment(\.dismiss) private var dismiss

    @State private var selectedLink: Link? = nil

    /// Sources with 2+ articles, sorted by count descending
    var sources: [(domain: String, favicon: String?, links: [Link])] {
        var grouped: [String: [Link]] = [:]
        for link in vm.allLinks {
            guard let domain = link.domain, !domain.isEmpty else { continue }
            grouped[domain, default: []].append(link)
        }
        return grouped
            .filter { $0.value.count >= 2 }
            .map { (domain: $0.key, favicon: $0.value.first?.favicon, links: $0.value.sorted { ($0.savedAt ?? .distantPast) > ($1.savedAt ?? .distantPast) }) }
            .sorted { $0.links.count > $1.links.count }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 28) {
                    ForEach(sources, id: \.domain) { source in
                        SourceRowView(
                            domain: source.domain,
                            favicon: source.favicon,
                            links: source.links,
                            allLinks: vm.allLinks,
                            vm: vm
                        )
                    }
                }
                .padding(.top, 8)
                .padding(.bottom, 100)
            }
            .navigationTitle("Sources")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Done") { dismiss() }
                }
            }
        }
        .fullScreenCover(item: $selectedLink) { link in
            let allFromSource = vm.allLinks.filter { $0.domain == link.domain }
            if let idx = allFromSource.firstIndex(where: { $0.id == link.id }) {
                ArticleReaderContainer(links: allFromSource, initialIndex: idx, vm: vm)
            }
        }
    }
}

// MARK: - Source Row (one domain)

struct SourceRowView: View {
    let domain: String
    let favicon: String?
    let links: [Link]
    let allLinks: [Link]
    let vm: LibraryViewModel

    @State private var showAll = false
    @State private var selectedLink: Link? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header: domain name + chevron
            Button { showAll = true } label: {
                HStack(spacing: 8) {
                    if let rawFavicon = favicon, let faviconURL = URL(string: rawFavicon) {
                        CachedAsyncImage(url: faviconURL) { img in
                            img.resizable().frame(width: 20, height: 20).clipShape(Circle())
                        } placeholder: {
                            Circle().fill(Color(.systemGray4)).frame(width: 20, height: 20)
                        }
                    }
                    Text(domain)
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundStyle(.primary)
                    Image(systemName: "chevron.right")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text("\(links.count)")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 16)

            // Horizontal scroll of article cards
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 14) {
                    ForEach(links.prefix(10)) { link in
                        Button { selectedLink = link } label: {
                            SourceArticleCard(link: link)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 16)
            }
        }
        .sheet(isPresented: $showAll) {
            SourceAllView(domain: domain, links: links, vm: vm)
        }
        .fullScreenCover(item: $selectedLink) { link in
            if let idx = links.firstIndex(where: { $0.id == link.id }) {
                ArticleReaderContainer(links: links, initialIndex: idx, vm: vm)
            }
        }
    }
}

// MARK: - Small Article Card (for horizontal scroll)

struct SourceArticleCard: View {
    let link: Link

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            // Thumbnail
            Color.clear
                .frame(width: 160, height: 100)
                .overlay {
                    if let rawURL = link.image, let imageURL = URL(string: rawURL) {
                        CachedAsyncImage(url: imageURL) { img in
                            img.resizable().aspectRatio(contentMode: .fill)
                        } placeholder: {
                            fallbackThumb
                        }
                    } else {
                        fallbackThumb
                    }
                }
                .clipped()
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

            Text(link.title ?? link.url)
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundStyle(.primary)
                .lineLimit(2)
                .frame(width: 160, alignment: .leading)

            if let status = link.status {
                StatusPill(status: status)
            }
        }
    }

    var fallbackThumb: some View {
        ZStack {
            LinearGradient(colors: domainGradient(for: link.domain),
                           startPoint: .topLeading, endPoint: .bottomTrailing)
            if let first = link.domain?.first {
                Text(String(first).uppercased())
                    .font(.system(size: 32, weight: .black, design: .rounded))
                    .foregroundStyle(.white.opacity(0.3))
            }
        }
    }
}

// MARK: - "See All" view for a single source

struct SourceAllView: View {
    let domain: String
    let links: [Link]
    let vm: LibraryViewModel

    @Environment(\.dismiss) private var dismiss
    @State private var selectedLink: Link? = nil

    var body: some View {
        NavigationStack {
            List {
                ForEach(links) { link in
                    ArticleRowView(link: link)
                        .contentShape(Rectangle())
                        .onTapGesture { selectedLink = link }
                        .listRowSeparator(.hidden)
                        .listRowInsets(EdgeInsets(top: 4, leading: 0, bottom: 4, trailing: 0))
                        .listRowBackground(Color.clear)
                }
            }
            .listStyle(.plain)
            .navigationTitle(domain)
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Done") { dismiss() }
                }
            }
        }
        .fullScreenCover(item: $selectedLink) { link in
            if let idx = links.firstIndex(where: { $0.id == link.id }) {
                ArticleReaderContainer(links: links, initialIndex: idx, vm: vm)
            }
        }
    }
}
