import SwiftUI
import UserNotifications

@main
struct ReadingListApp: App {
    @State private var authVM = AuthViewModel()
    @State private var showDigest = false
    @State private var deepLinkArticleId: String? = nil
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        WindowGroup {
            Group {
                if authVM.isAuthenticated {
                    ContentView()
                        .environment(authVM)
                } else {
                    SignInView()
                        .environment(authVM)
                }
            }
            .animation(.spring(duration: 0.5, bounce: 0.3), value: authVM.isAuthenticated)
            .preferredColorScheme(.dark)
            .onOpenURL { url in
                // Handle deep links from widget: procrastinate://article/ARTICLE_ID
                if url.scheme == "procrastinate", url.host == "article" {
                    let articleId = url.lastPathComponent
                    // Small delay to let the app finish launching
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        deepLinkArticleId = articleId
                    }
                }
            }
            .onReceive(NotificationCenter.default.publisher(for: .openDigest)) { _ in
                showDigest = true
            }
            .sheet(isPresented: $showDigest) {
                if authVM.isAuthenticated {
                    DigestView()
                        .environment(ContentView.sharedLibraryVM)
                }
            }
            .fullScreenCover(item: Binding(
                get: {
                    guard let id = deepLinkArticleId else { return nil }
                    return ContentView.sharedLibraryVM.allLinks.first { $0.id == id }
                },
                set: { _ in deepLinkArticleId = nil }
            )) { link in
                ArticleReaderContainer(
                    links: [link],
                    initialIndex: 0,
                    vm: ContentView.sharedLibraryVM
                )
            }
        }
    }
}

// MARK: - Notification name

extension Notification.Name {
    static let openDigest = Notification.Name("openDigest")
}

// MARK: - App Delegate for notification handling

class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        return true
    }

    // Handle notification tap when app is in foreground or background
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        if response.notification.request.identifier.hasPrefix("daily-digest") {
            NotificationCenter.default.post(name: .openDigest, object: nil)
        }
        completionHandler()
    }

    // Show notification even when app is in foreground
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound])
    }
}
