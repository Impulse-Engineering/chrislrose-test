import SwiftUI

/// Subtle press animation — scales down on press, springs back on release.
/// Use on cards and rows for tactile feedback.
struct BouncePress: ViewModifier {
    @State private var isPressed = false

    func body(content: Content) -> some View {
        content
            .scaleEffect(isPressed ? 0.96 : 1.0)
            .animation(.spring(duration: 0.25, bounce: 0.4), value: isPressed)
            .simultaneousGesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { _ in
                        if !isPressed {
                            isPressed = true
                            UIImpactFeedbackGenerator(style: .light).impactOccurred()
                        }
                    }
                    .onEnded { _ in
                        isPressed = false
                    }
            )
    }
}

extension View {
    func bouncePress() -> some View {
        modifier(BouncePress())
    }
}

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
