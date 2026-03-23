import SwiftUI

struct TagCloudView: View {
    let tagCounts: [(tag: String, count: Int)]
    let onSelect: (String) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var searchText = ""

    var filtered: [(tag: String, count: Int)] {
        guard !searchText.isEmpty else { return tagCounts }
        return tagCounts.filter { $0.tag.localizedCaseInsensitiveContains(searchText) }
    }

    var minCount: Int { tagCounts.map(\.count).min() ?? 1 }
    var maxCount: Int { tagCounts.map(\.count).max() ?? 1 }

    func fontSize(for count: Int) -> CGFloat {
        guard maxCount > minCount else { return 18 }
        let t = CGFloat(count - minCount) / CGFloat(maxCount - minCount)
        return 13 + t * 20   // 13pt → 33pt
    }

    func bgOpacity(for count: Int) -> Double {
        guard maxCount > minCount else { return 0.15 }
        let t = Double(count - minCount) / Double(maxCount - minCount)
        return 0.08 + t * 0.22   // subtle → vibrant fill
    }

    func fgOpacity(for count: Int) -> Double {
        guard maxCount > minCount else { return 0.75 }
        let t = Double(count - minCount) / Double(maxCount - minCount)
        return 0.45 + t * 0.55
    }

    func fontWeight(for count: Int) -> Font.Weight {
        guard maxCount > minCount else { return .medium }
        let t = Double(count - minCount) / Double(maxCount - minCount)
        if t > 0.65 { return .bold }
        if t > 0.3  { return .semibold }
        return .medium
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                if filtered.isEmpty {
                    ContentUnavailableView.search(text: searchText)
                        .padding(.top, 60)
                } else {
                    TagFlowLayout(spacing: 10) {
                        ForEach(filtered, id: \.tag) { item in
                            Button {
                                onSelect(item.tag)
                                dismiss()
                            } label: {
                                tagPill(item)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, 16)
                    .animation(.spring(duration: 0.3), value: filtered.map(\.tag))
                }
            }
            .searchable(text: $searchText, prompt: "Filter tags…")
            .navigationTitle("Tags")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .fontWeight(.semibold)
                }
            }
        }
    }

    func tagPill(_ item: (tag: String, count: Int)) -> some View {
        HStack(spacing: 5) {
            Text(item.tag)
                .font(.system(size: fontSize(for: item.count),
                              weight: fontWeight(for: item.count)))
            Text("\(item.count)")
                .font(.system(size: max(fontSize(for: item.count) - 5, 10),
                              weight: .regular))
                .padding(.horizontal, 5)
                .padding(.vertical, 2)
                .background(Color.indigo.opacity(bgOpacity(for: item.count) + 0.1))
                .clipShape(Capsule())
                .opacity(0.8)
        }
        .padding(.horizontal, 13)
        .padding(.vertical, 8)
        .background(Color.indigo.opacity(bgOpacity(for: item.count)))
        .foregroundStyle(Color.indigo.opacity(fgOpacity(for: item.count)))
        .clipShape(Capsule())
    }
}

// MARK: - True wrapping flow layout

struct TagFlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let rows = makeRows(width: proposal.width ?? 0, subviews: subviews)
        let totalHeight = rows.reduce(0.0) { h, row in
            h + (row.map { $0.sizeThatFits(.unspecified).height }.max() ?? 0) + spacing
        }
        return CGSize(width: proposal.width ?? 0, height: max(totalHeight - spacing, 0))
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let rows = makeRows(width: bounds.width, subviews: subviews)
        var y = bounds.minY
        for row in rows {
            var x = bounds.minX
            let rowHeight = row.map { $0.sizeThatFits(.unspecified).height }.max() ?? 0
            for subview in row {
                let size = subview.sizeThatFits(.unspecified)
                subview.place(at: CGPoint(x: x, y: y + (rowHeight - size.height) / 2),
                              proposal: ProposedViewSize(size))
                x += size.width + spacing
            }
            y += rowHeight + spacing
        }
    }

    private func makeRows(width: CGFloat, subviews: Subviews) -> [[LayoutSubview]] {
        var rows: [[LayoutSubview]] = [[]]
        var x: CGFloat = 0
        for subview in subviews {
            let w = subview.sizeThatFits(.unspecified).width
            if x + w > width, !rows.last!.isEmpty {
                rows.append([])
                x = 0
            }
            rows[rows.count - 1].append(subview)
            x += w + spacing
        }
        return rows.filter { !$0.isEmpty }
    }
}
