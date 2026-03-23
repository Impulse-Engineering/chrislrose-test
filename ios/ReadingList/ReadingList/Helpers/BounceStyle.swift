import SwiftUI

/// Haptic feedback helpers
enum Haptics {
    static func tap() {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
    }

    static func success() {
        UINotificationFeedbackGenerator().notificationOccurred(.success)
    }

    static func statusChange() {
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    }
}
