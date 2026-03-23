import SwiftUI
#if canImport(FoundationModels)
import FoundationModels
#endif

// MARK: - Enrich Sheet

struct EnrichSheetView: View {
    let link: Link
    let onSaved: (Link) -> Void

    @Environment(LibraryViewModel.self) private var vm
    @Environment(\.dismiss) private var dismiss

    @State private var phase: EnrichPhase = .loading
    @State private var suggestions: EnrichSuggestions? = nil

    // Accept toggles
    @State private var acceptTitle = true
    @State private var acceptSummary = true
    @State private var acceptTags = true
    @State private var acceptCategory = true
    @State private var acceptStatus = false  // Status default off — user should confirm

    enum EnrichPhase {
        case loading, ready, saving, unavailable(String), error(String)
        var isReady: Bool { if case .ready = self { return true }; return false }
    }

    var body: some View {
        NavigationStack {
            Group {
                switch phase {
                case .loading:
                    loadingView
                case .ready:
                    suggestionsList
                case .saving:
                    savingView
                case .unavailable(let msg):
                    unavailableView(msg)
                case .error(let msg):
                    errorView(msg)
                }
            }
            .navigationTitle("Enrich with AI")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                if phase.isReady && suggestions != nil {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("Save") { Task { await save() } }
                            .fontWeight(.semibold)
                    }
                }
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
        .task { await runEnrich() }
    }

    // MARK: - Views

    var loadingView: some View {
        VStack(spacing: 20) {
            ProgressView()
                .scaleEffect(1.4)
            VStack(spacing: 6) {
                Text("Analyzing article…")
                    .font(.headline)
                Text("On-device AI is reading the metadata")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
    }

    var savingView: some View {
        VStack(spacing: 16) {
            ProgressView()
            Text("Saving…").foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    func unavailableView(_ msg: String) -> some View {
        ContentUnavailableView {
            Label("AI Not Available", systemImage: "sparkles")
        } description: {
            Text(msg)
        }
    }

    func errorView(_ msg: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.largeTitle)
                .foregroundStyle(.orange)
            Text("Enrichment failed")
                .font(.headline)
            Text(msg)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            Button("Try Again") { Task { await runEnrich() } }
                .buttonStyle(.borderedProminent)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    var suggestionsList: some View {
        List {
            if let s = suggestions {
                if s.cleanTitle != (link.title ?? "") {
                    enrichRow(
                        icon: "text.cursor",
                        label: "Clean Title",
                        original: link.title,
                        suggestion: s.cleanTitle,
                        isAccepted: $acceptTitle
                    )
                }

                enrichRow(
                    icon: "text.alignleft",
                    label: "Summary",
                    original: link.summary,
                    suggestion: s.summary,
                    isAccepted: $acceptSummary
                )

                if !s.tags.isEmpty {
                    enrichRow(
                        icon: "tag",
                        label: "Tags",
                        original: link.tags,
                        suggestion: s.tags,
                        isAccepted: $acceptTags
                    )
                }

                if !s.category.isEmpty {
                    enrichRow(
                        icon: "folder",
                        label: "Category",
                        original: link.category,
                        suggestion: s.category,
                        isAccepted: $acceptCategory
                    )
                }

                enrichRow(
                    icon: "circle.dotted",
                    label: "Status",
                    original: link.status,
                    suggestion: s.status,
                    isAccepted: $acceptStatus
                )
            }
        }
        .listStyle(.insetGrouped)
    }

    func enrichRow(icon: String, label: String, original: String?, suggestion: String, isAccepted: Binding<Bool>) -> some View {
        Section {
            VStack(alignment: .leading, spacing: 10) {
                if let orig = original, !orig.isEmpty, orig != suggestion {
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: "arrow.uturn.backward")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .padding(.top, 2)
                        Text(orig)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .strikethrough(!isAccepted.wrappedValue, color: .secondary)
                    }
                }
                HStack(alignment: .top, spacing: 8) {
                    Image(systemName: "sparkles")
                        .font(.caption)
                        .foregroundStyle(.purple)
                        .padding(.top, 2)
                    Text(suggestion)
                        .font(.subheadline)
                        .foregroundStyle(isAccepted.wrappedValue ? .primary : .secondary)
                }
            }
            .padding(.vertical, 4)
        } header: {
            HStack {
                Label(label, systemImage: icon)
                    .font(.footnote)
                    .textCase(nil)
                Spacer()
                Toggle("", isOn: isAccepted)
                    .labelsHidden()
                    .tint(.purple)
            }
        }
    }

    // MARK: - Logic

    func runEnrich() async {
        phase = .loading
        suggestions = nil

        if #available(iOS 26, *) {
            await runFoundationModels()
        } else {
            phase = .unavailable("Enrich requires iOS 26 and Apple Intelligence.")
        }
    }

    @available(iOS 26, *)
    func runFoundationModels() async {
        #if canImport(FoundationModels)
        do {
            let result = try await EnrichEngine.enrich(
                link: link,
                categories: vm.categories.map(\.name)
            )
            suggestions = result
            phase = .ready
        } catch EnrichError.unavailable {
            phase = .unavailable("Apple Intelligence is not available on this device or is not enabled.")
        } catch {
            phase = .error(error.localizedDescription)
        }
        #else
        phase = .unavailable("FoundationModels framework is not available in this build.")
        #endif
    }

    func save() async {
        guard let s = suggestions else { return }
        phase = .saving

        var updatedLink = link
        var fields: [String: Any] = [:]

        if acceptTitle && s.cleanTitle != (link.title ?? "") {
            fields["title"] = s.cleanTitle
            updatedLink.title = s.cleanTitle
        }
        if acceptSummary && !s.summary.isEmpty {
            fields["summary"] = s.summary
            updatedLink.summary = s.summary
        }
        if acceptTags && !s.tags.isEmpty {
            let merged = mergeTags(existing: link.tags, new: s.tags)
            fields["tags"] = merged
            updatedLink.tags = merged
        }
        if acceptCategory && !s.category.isEmpty {
            fields["category"] = s.category
            updatedLink.category = s.category
        }
        if acceptStatus && !s.status.isEmpty {
            fields["status"] = s.status
            fields["read"] = (s.status == "done")
            updatedLink.status = s.status
            updatedLink.read = (s.status == "done")
        }

        await vm.updateEnrich(link: link, fields: fields)
        onSaved(updatedLink)
        dismiss()
    }

    func mergeTags(existing: String?, new: String) -> String {
        guard let existing, !existing.isEmpty else { return new }
        let existingSet = Set(existing.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces).lowercased() })
        let newTags = new.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }
        let combined = newTags.filter { !existingSet.contains($0.lowercased()) }
        return (existing.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) } + combined).joined(separator: ", ")
    }
}

// MARK: - Enrich Result Model

struct EnrichSuggestions {
    var cleanTitle: String
    var summary: String
    var tags: String
    var category: String
    var status: String
}

// MARK: - EnrichError

enum EnrichError: LocalizedError {
    case unavailable
    case parseFailure(String)

    var errorDescription: String? {
        switch self {
        case .unavailable: return "Apple Intelligence is not available."
        case .parseFailure(let raw): return "Could not parse AI response: \(raw.prefix(200))"
        }
    }
}

// MARK: - EnrichEngine (Foundation Models)

#if canImport(FoundationModels)
@available(iOS 26, *)
enum EnrichEngine {

    // MARK: - Category keyword rules (specific beats general)
    // Each rule: if ANY keyword matches the article text, use that category.
    // Rules are evaluated in order — first match wins, so put most-specific first.
    static let categoryRules: [(keywords: [String], category: String)] = [
        // Most specific — product/tool names
        (["apple intelligence", "apple vision", "vision pro", "visionos"], "Apple"),
        (["iphone", "ipad", "macbook", "mac mini", "mac pro", "apple watch",
          "airpods", "homepod", "apple tv", "apple silicon", "m1", "m2", "m3", "m4",
          "ios ", "ipados", "macos", "watchos", "tvos", "xcode", "swift ", "swiftui",
          "wwdc", "apple developer", "app store", "testflight", "uikit", "appkit"], "Apple"),
        (["claude ", "anthropic", "claude.ai", "claude code", "claude opus",
          "claude sonnet", "claude haiku"], "Claude"),
        // Broad AI — after Claude/Apple-specific checks
        (["openai", "chatgpt", "gpt-4", "gpt-3", "gemini", "llama", "mistral",
          "copilot", "cursor ", "midjourney", "stable diffusion", "dall-e",
          "large language model", "llm", "generative ai", "ai agent",
          "artificial intelligence", "machine learning", "deep learning",
          "neural network", "foundation model", "rag ", "vector database"], "AI"),
        // Tech — after AI-specific checks
        (["javascript", "typescript", "python", "rust ", "golang", "react ",
          "kubernetes", "docker ", "aws ", "cloud ", "api ", "developer",
          "programming", "software engineer", "open source", "github",
          "database", "backend", "frontend", "devops", "cybersecurity",
          "security vulnerability", "zero day", "infosec"], "Tech"),
    ]

    /// Apply keyword-based category override rules.
    /// Returns the best matching category from `available`, or falls back to `aiSuggestion`.
    static func refineCategory(
        aiSuggestion: String,
        title: String,
        description: String,
        url: String,
        available: [String]
    ) -> String {
        let haystack = "\(title) \(description) \(url)".lowercased()
        let availableLower = available.map { $0.lowercased() }

        for rule in categoryRules {
            guard rule.keywords.contains(where: { haystack.contains($0) }) else { continue }
            // Find this category in the available list (case-insensitive)
            if let match = available.first(where: { $0.lowercased() == rule.category.lowercased() }) {
                return match
            }
        }
        // No rule matched — return the AI suggestion if it's a known category, else first available
        if available.isEmpty { return aiSuggestion }
        return available.first(where: { $0.lowercased() == aiSuggestion.lowercased() }) ?? aiSuggestion
    }

    // MARK: - Main enrich function

    static func enrich(link: Link, categories: [String]) async throws -> EnrichSuggestions {
        let categoryList = categories.isEmpty
            ? "General, Tech, Design, Business"
            : categories.joined(separator: ", ")

        let prompt = """
        Analyze this saved article and provide enrichment suggestions.

        Title: \(link.title ?? "Untitled")
        URL: \(link.url)
        Description: \(link.description ?? "")
        Domain: \(link.domain ?? "")
        Existing note: \(link.note ?? "")
        Existing tags: \(link.tags ?? "")

        Available categories: \(categoryList)

        Category selection rules — prefer the most specific match:
        - If the article is about Apple products, iOS, macOS, Swift, or Xcode → pick "Apple" if available
        - If it mentions Claude or Anthropic specifically → pick "Claude" if available
        - If it's about AI/ML tools or LLMs in general → pick "AI" if available
        - "AI" is more specific than "Tech" — don't pick "Tech" for AI content
        - Only use "Tech" for general software/engineering content with no better match

        Respond with only a JSON object with these exact keys:
        - cleanTitle: the title cleaned up (remove site name, pipes, SEO noise; keep it concise)
        - summary: 2-3 sentence summary based on the title and description
        - tags: 3-6 comma-separated relevant tags (lowercase, concise, no duplicates)
        - category: single best category from the available list
        - status: one of "to-read" (essays/long reads), "to-try" (tutorials/how-tos), "to-share" (news/opinions), "done" (already completed)

        Return only valid JSON, no markdown, no explanation.
        """

        do {
            let session = LanguageModelSession()
            let response = try await session.respond(to: prompt)
            var text = response.content.trimmingCharacters(in: .whitespacesAndNewlines)

            // Strip markdown code fences
            if text.hasPrefix("```") {
                if let firstNewline = text.firstIndex(of: "\n") {
                    text = String(text[text.index(after: firstNewline)...])
                }
                if text.hasSuffix("```") { text = String(text.dropLast(3)) }
                text = text.trimmingCharacters(in: .whitespacesAndNewlines)
            }

            // Extract JSON object
            if let start = text.firstIndex(of: "{"), let end = text.lastIndex(of: "}") {
                text = String(text[start...end])
            }

            guard let data = text.data(using: .utf8),
                  let rawJson = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                throw EnrichError.parseFailure(text)
            }

            func str(_ key: String) -> String {
                if let s = rawJson[key] as? String { return s }
                if let n = rawJson[key] as? NSNumber { return n.stringValue }
                return ""
            }

            // Apply keyword override rules on top of AI category suggestion
            let aiCategory = str("category")
            let refinedCategory = refineCategory(
                aiSuggestion: aiCategory,
                title: link.title ?? "",
                description: link.description ?? "",
                url: link.url,
                available: categories
            )

            return EnrichSuggestions(
                cleanTitle: str("cleanTitle").isEmpty ? (link.title ?? "") : str("cleanTitle"),
                summary: str("summary"),
                tags: str("tags"),
                category: refinedCategory,
                status: str("status").isEmpty ? "to-read" : str("status")
            )
        } catch let error as EnrichError {
            throw error
        } catch {
            let desc = error.localizedDescription.lowercased()
            if desc.contains("available") || desc.contains("support") || desc.contains("not supported") {
                throw EnrichError.unavailable
            }
            throw error
        }
    }
}
#endif
