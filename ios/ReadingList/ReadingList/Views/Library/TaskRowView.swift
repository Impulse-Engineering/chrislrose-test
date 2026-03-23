import SwiftUI

struct TaskRowView: View {
    let link: Link
    let onToggleDone: () -> Void
    let onTap: () -> Void

    @State private var justCompleted = false
    @State private var isExpanded = false
    @State private var showEditor = false
    private let store = SubtaskStore.shared

    var isDone: Bool { link.status == "done" }
    var subtasks: [Subtask] { store.subtasks(for: link.id) }
    var pendingCount: Int { subtasks.filter { !$0.isDone }.count }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Main row
            HStack(alignment: .top, spacing: 14) {
                // Checkbox
                Button {
                    withAnimation(.spring(duration: 0.4, bounce: 0.5)) { justCompleted = true }
                    UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { onToggleDone() }
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
                                Text(domain).foregroundStyle(.tertiary)
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

                // Right side: thumbnail + subtask expand chevron
                VStack(alignment: .trailing, spacing: 6) {
                    if let rawURL = link.image, let imageURL = URL(string: rawURL) {
                        CachedAsyncImage(url: imageURL) { img in
                            img.resizable().aspectRatio(contentMode: .fill)
                        } placeholder: {
                            Color(.systemGray5)
                        }
                        .frame(width: 48, height: 48)
                        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                    }

                    if !subtasks.isEmpty {
                        subtaskChevron
                    }
                }
            }
            .padding(.vertical, 6)

            // Subtask expand area
            if !subtasks.isEmpty {
                subtaskSummaryRow
            }

            // Expanded subtask list
            if isExpanded {
                VStack(spacing: 0) {
                    ForEach(subtasks) { subtask in
                        inlineSubtaskRow(subtask)
                            .transition(.asymmetric(
                                insertion: .push(from: .top).combined(with: .opacity),
                                removal: .push(from: .bottom).combined(with: .opacity)
                            ))
                    }

                    // Add subtask shortcut
                    Button {
                        showEditor = true
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "plus.circle")
                                .font(.caption)
                                .foregroundStyle(.indigo)
                            Text("Add subtask")
                                .font(.caption)
                                .foregroundStyle(.indigo)
                        }
                        .padding(.leading, 28)
                        .padding(.vertical, 8)
                    }
                    .buttonStyle(.plain)
                    .transition(.opacity)
                }
            }
        }
        .contentShape(Rectangle())
        .contextMenu {
            Button {
                showEditor = true
            } label: {
                Label("Manage Subtasks", systemImage: "checklist")
            }
        }
        .sheet(isPresented: $showEditor) {
            SubtaskEditorView(linkId: link.id, linkTitle: link.title ?? link.url)
        }
    }

    // MARK: - Sub-views

    var subtaskChevron: some View {
        Image(systemName: "chevron.right")
            .font(.caption2.weight(.semibold))
            .foregroundStyle(.secondary)
            .rotationEffect(isExpanded ? .degrees(90) : .zero)
            .animation(.spring(duration: 0.3, bounce: 0.4), value: isExpanded)
    }

    var subtaskSummaryRow: some View {
        Button {
            withAnimation(.spring(duration: 0.35, bounce: 0.35)) {
                isExpanded.toggle()
            }
        } label: {
            HStack(spacing: 6) {
                // Mini progress capsule
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Color(.systemGray5))
                        .frame(width: 36, height: 4)
                    Capsule()
                        .fill(Color.indigo)
                        .frame(width: subtasks.isEmpty ? 0 : 36 * CGFloat(subtasks.filter { $0.isDone }.count) / CGFloat(subtasks.count), height: 4)
                        .animation(.spring(duration: 0.4), value: subtasks.filter { $0.isDone }.count)
                }

                Text(pendingCount > 0 ? "\(pendingCount) remaining" : "All done")
                    .font(.caption)
                    .foregroundStyle(pendingCount == 0 ? .green : .secondary)

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(.tertiary)
                    .rotationEffect(isExpanded ? .degrees(90) : .zero)
                    .animation(.spring(duration: 0.3, bounce: 0.4), value: isExpanded)
            }
            .padding(.leading, 38)   // align with content column
            .padding(.bottom, 6)
        }
        .buttonStyle(.plain)
    }

    func inlineSubtaskRow(_ subtask: Subtask) -> some View {
        HStack(spacing: 10) {
            Button {
                withAnimation(.spring(duration: 0.3, bounce: 0.4)) {
                    store.toggle(id: subtask.id, in: link.id)
                }
                UIImpactFeedbackGenerator(style: .light).impactOccurred()
            } label: {
                Image(systemName: subtask.isDone ? "checkmark.circle.fill" : "circle")
                    .font(.subheadline)
                    .foregroundStyle(subtask.isDone ? .green : Color(.systemGray3))
                    .scaleEffect(subtask.isDone ? 1.1 : 1.0)
                    .animation(.spring(duration: 0.25, bounce: 0.5), value: subtask.isDone)
            }
            .buttonStyle(.plain)

            Text(subtask.text)
                .font(.subheadline)
                .foregroundStyle(subtask.isDone ? .tertiary : .secondary)
                .strikethrough(subtask.isDone, color: Color(.tertiaryLabel))
                .frame(maxWidth: .infinity, alignment: .leading)
                .animation(.easeOut(duration: 0.2), value: subtask.isDone)
        }
        .padding(.leading, 28)
        .padding(.vertical, 5)
    }
}
