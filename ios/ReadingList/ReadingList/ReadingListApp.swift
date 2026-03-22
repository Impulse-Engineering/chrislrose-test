import SwiftUI
import UserNotifications

@main
struct ReadingListApp: App {
    @State private var authVM = AuthViewModel()
    @State private var showDigest = false
    @State private var deepLinkArticle: Link? = nil
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
                if url.scheme == "procrastinate", url.host == "article" {
                    let articleId = url.lastPathComponent
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        if let link = ContentView.sharedLibraryVM.allLinks.first(where: { $0.id == articleId }) {
                            deepLinkArticle = link
                        }
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
            .fullScreenCover(item: $deepLinkArticle) { link in
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
