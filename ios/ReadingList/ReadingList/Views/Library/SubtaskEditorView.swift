import SwiftUI

struct SubtaskEditorView: View {
    let linkId: String
    let linkTitle: String

    @Environment(\.dismiss) private var dismiss
    private let store = SubtaskStore.shared
    @State private var newText = ""
    @FocusState private var fieldFocused: Bool
    @State private var appearedIds: Set<String> = []

    var subtasks: [Subtask] { store.subtasks(for: linkId) }
    var doneCount: Int { subtasks.filter { $0.isDone }.count }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {

                // Progress bar
                if !subtasks.isEmpty {
                    progressBar
                        .padding(.horizontal, 20)
                        .padding(.top, 4)
                        .padding(.bottom, 14)
                }

                // Add field
                addField
                    .padding(.horizontal, 16)

                Divider().padding(.top, 16)

                // Subtask list
                if subtasks.isEmpty {
                    emptyState
                } else {
                    ScrollView {
                        LazyVStack(spacing: 0) {
                            ForEach(subtasks) { subtask in
                                subtaskRow(subtask)
                                    .opacity(appearedIds.contains(subtask.id) ? 1 : 0)
                                    .offset(y: appearedIds.contains(subtask.id) ? 0 : 14)
                                    .onAppear {
                                        let delay = Double(subtasks.firstIndex(where: { $0.id == subtask.id }) ?? 0) * 0.06
                                        withAnimation(.spring(duration: 0.4, bounce: 0.3).delay(delay)) {
                                            appearedIds.insert(subtask.id)
                                        }
                                    }
                                Divider().padding(.leading, 50)
                            }
                        }
                        .padding(.top, 4)
                    }
                }
            }
            .navigationTitle(linkTitle)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    if !subtasks.isEmpty {
                        Text("\(doneCount) of \(subtasks.count) done")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .fontWeight(.semibold)
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
        .presentationCornerRadius(24)
        .onAppear { fieldFocused = true }
    }

    // MARK: - Sub-views

    var progressBar: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule()
                    .fill(Color(.systemGray5))
                    .frame(height: 5)
                Capsule()
                    .fill(Color.indigo)
                    .frame(
                        width: subtasks.isEmpty ? 0 : geo.size.width * CGFloat(doneCount) / CGFloat(subtasks.count),
                        height: 5
                    )
                    .animation(.spring(duration: 0.5, bounce: 0.3), value: doneCount)
            }
        }
        .frame(height: 5)
    }

    var addField: some View {
        HStack(spacing: 12) {
            Image(systemName: "plus.circle.fill")
                .font(.title3)
                .foregroundStyle(newText.isEmpty ? Color(.systemGray3) : .indigo)
                .animation(.spring(duration: 0.2), value: newText.isEmpty)

            TextField("Add a subtask…", text: $newText)
                .focused($fieldFocused)
                .submitLabel(.done)
                .onSubmit { commitAdd() }

            if !newText.isEmpty {
                Button { commitAdd() } label: {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.title3)
                        .foregroundStyle(.indigo)
                }
                .transition(.scale.combined(with: .opacity))
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 13)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .animation(.spring(duration: 0.2), value: newText.isEmpty)
    }

    var emptyState: some View {
        VStack(spacing: 10) {
            Image(systemName: "checklist")
                .font(.system(size: 40))
                .foregroundStyle(Color(.systemGray3))
            Text("No subtasks yet")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Text("Break this task into smaller steps")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(.top, 40)
    }

    func subtaskRow(_ subtask: Subtask) -> some View {
        HStack(spacing: 14) {
            Button {
                withAnimation(.spring(duration: 0.3, bounce: 0.4)) {
                    store.toggle(id: subtask.id, in: linkId)
                }
                UIImpactFeedbackGenerator(style: .light).impactOccurred()
            } label: {
                Image(systemName: subtask.isDone ? "checkmark.circle.fill" : "circle")
                    .font(.title3)
                    .foregroundStyle(subtask.isDone ? Color.green : Color(.systemGray3))
                    .scaleEffect(subtask.isDone ? 1.1 : 1.0)
                    .animation(.spring(duration: 0.25, bounce: 0.5), value: subtask.isDone)
            }
            .buttonStyle(.plain)

            Text(subtask.text)
                .font(.body)
                .foregroundStyle(subtask.isDone ? .secondary : .primary)
                .strikethrough(subtask.isDone, color: Color(.tertiaryLabel))
                .frame(maxWidth: .infinity, alignment: .leading)
                .animation(.easeOut(duration: 0.2), value: subtask.isDone)

            Button {
                withAnimation(.spring(duration: 0.3)) {
                    store.delete(id: subtask.id, from: linkId)
                }
            } label: {
                Image(systemName: "minus.circle.fill")
                    .foregroundStyle(Color(.systemGray3))
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
        .contentShape(Rectangle())
    }

    func commitAdd() {
        guard !newText.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        let text = newText
        withAnimation(.spring(duration: 0.35, bounce: 0.4)) {
            store.add(text: text, to: linkId)
            newText = ""
        }
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
    }
}
