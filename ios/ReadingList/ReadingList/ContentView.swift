import SwiftUI

struct ContentView: View {
    @Environment(AuthViewModel.self) private var authVM
    @Environment(\.horizontalSizeClass) private var sizeClass
    @State private var libraryVM = ContentView.sharedLibraryVM

    static let sharedLibraryVM = LibraryViewModel()

    var body: some View {
        Group {
            if sizeClass == .regular {
                iPadLayout
            } else {
                iPhoneLayout
            }
        }
        .task { await libraryVM.load() }
    }

    // MARK: - iPhone (TabView)

    @ViewBuilder
    var iPhoneLayout: some View {
        if #available(iOS 26, *) {
            tabs.tabBarMinimizeBehavior(.onScrollDown)
        } else {
            tabs
        }
    }

    var tabs: some View {
        TabView {
            Tab("Library", systemImage: "books.vertical") {
                LibraryView(statusFilter: nil)
                    .environment(libraryVM)
                    .environment(authVM)
            }
            Tab("Read", systemImage: "book") {
                LibraryView(statusFilter: "to-read")
                    .environment(libraryVM)
                    .environment(authVM)
            }
            Tab("Do", systemImage: "hammer") {
                LibraryView(statusFilter: "to-try")
                    .environment(libraryVM)
                    .environment(authVM)
            }
            Tab("Search", systemImage: "magnifyingglass", role: .search) {
                SearchView()
                    .environment(libraryVM)
            }
        }
    }

    // MARK: - iPad (NavigationSplitView)

    var iPadLayout: some View {
        iPadSplitView
            .environment(libraryVM)
            .environment(authVM)
    }

    var iPadSplitView: some View {
        IPadNavigationView()
            .environment(libraryVM)
            .environment(authVM)
    }
}
