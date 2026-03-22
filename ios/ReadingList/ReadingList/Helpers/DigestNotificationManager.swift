import UserNotifications

final class DigestNotificationManager {
    static let shared = DigestNotificationManager()
    private init() {}

    private let notificationID = "daily-digest"

    func requestAndSchedule(links: [Link]) {
        let center = UNUserNotificationCenter.current()
        center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
            guard granted else { return }
            self.schedule(links: links)
        }
    }

    func schedule(links: [Link]) {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [notificationID])

        let unreadCount = links.filter { $0.status != "done" }.count
        let toReadCount = links.filter { $0.status == "to-read" }.count

        // Find the most common category among unread
        var catCounts: [String: Int] = [:]
        for link in links where link.status != "done" {
            if let cat = link.category, !cat.isEmpty {
                catCounts[cat, default: 0] += 1
            }
        }
        let topCategory = catCounts.max(by: { $0.value < $1.value })?.key

        // Build message
        let content = UNMutableNotificationContent()
        content.title = "Reading List"

        var body = "\(unreadCount) unread article\(unreadCount == 1 ? "" : "s")."
        if toReadCount > 0 { body += " \(toReadCount) to read." }
        if let cat = topCategory, let count = catCounts[cat] {
            body += " \(count) about \(cat)."
        }
        content.body = body
        content.sound = .default

        // Schedule for 8:00 AM daily
        var dateComponents = DateComponents()
        dateComponents.hour = 8
        dateComponents.minute = 0

        let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
        let request = UNNotificationRequest(identifier: notificationID, content: content, trigger: trigger)

        center.add(request)
    }

    func updateContent(links: [Link]) {
        // Re-schedule with fresh data
        schedule(links: links)
    }

    func cancel() {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [notificationID])
    }
}
