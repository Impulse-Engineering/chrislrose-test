import SwiftUI

/// Task-list style row for the Do tab — checkbox on left, title, domain + time
struct TaskRowView: View {
    let link: Link
    let onToggleDone: () -> Void
    let onTap: () -> Void

    @State private var justCompleted = false

    var isDone: Bool { link.status == "done" }

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            // Checkbox
            Button {
                withAnimation(.spring(duration: 0.4, bounce: 0.5)) {
                    justCompleted = true
                }
                // Haptic
                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                // Delay to show animation before toggling
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                    onToggleDone()
                }
            } label: {
                Image(systemName: isDone || justCompleted ? "checkmark.circle.fill" : "circle")
                    .font(.title2)
                    .foregroundStyle(isDone || justCompleted ? .green : Color(.systemGray3))
                    .scaleEffect(justCompleted ? 1.2 : 1.0)
            }
            .buttonStyle(.plain)

            // Content
            Button { onTap() } label: {
                VStack(alignment: .leading, spacing: 4) {
                    Text(link.title ?? link.url)
                        .font(.body)
                        .fontWeight(.medium)
                        .foregroundStyle(isDone ? .secondary : .primary)
                        .strikethrough(isDone, color: .secondary)
                        .lineLimit(2)

                    HStack(spacing: 4) {
                        if let domain = link.domain {
                            Text(domain)
                                .foregroundStyle(.tertiary)
                        }
                        if let savedAt = link.savedAt {
                            Text("·").foregroundStyle(.tertiary)
                            Text(savedAt.timeAgo).foregroundStyle(.tertiary)
                        }
                    }
                    .font(.caption)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .buttonStyle(.plain)

            // Small thumbnail
            if let rawURL = link.image, let imageURL = URL(string: rawURL) {
                CachedAsyncImage(url: imageURL) { img in
                    img.resizable().aspectRatio(contentMode: .fill)
                } placeholder: {
                    Color(.systemGray5)
                }
                .frame(width: 48, height: 48)
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            }
        }
        .padding(.vertical, 6)
    }
}
