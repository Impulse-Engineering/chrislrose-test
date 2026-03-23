import Foundation

struct Subtask: Codable, Identifiable, Hashable {
    var id: String = UUID().uuidString
    var text: String
    var isDone: Bool = false
    var createdAt: Date = Date()
}

// MARK: - Store

@Observable
final class SubtaskStore {
    static let shared = SubtaskStore()

    private let defaultsKey = "subtask_store_v2"
    private(set) var storage: [String: [Subtask]] = [:]

    private init() {
        if let data = UserDefaults.standard.data(forKey: defaultsKey),
           let decoded = try? JSONDecoder().decode([String: [Subtask]].self, from: data) {
            storage = decoded
        }
    }

    func subtasks(for linkId: String) -> [Subtask] {
        storage[linkId] ?? []
    }

    func add(text: String, to linkId: String) {
        let trimmed = text.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        var tasks = storage[linkId] ?? []
        tasks.append(Subtask(text: trimmed))
        storage[linkId] = tasks
        save()
    }

    func toggle(id: String, in linkId: String) {
        guard var tasks = storage[linkId],
              let idx = tasks.firstIndex(where: { $0.id == id }) else { return }
        tasks[idx].isDone.toggle()
        storage[linkId] = tasks
        save()
    }

    func delete(id: String, from linkId: String) {
        storage[linkId]?.removeAll { $0.id == id }
        if storage[linkId]?.isEmpty == true { storage.removeValue(forKey: linkId) }
        save()
    }

    func update(_ tasks: [Subtask], for linkId: String) {
        if tasks.isEmpty { storage.removeValue(forKey: linkId) }
        else { storage[linkId] = tasks }
        save()
    }

    private func save() {
        guard let encoded = try? JSONEncoder().encode(storage) else { return }
        UserDefaults.standard.set(encoded, forKey: defaultsKey)
    }
}
