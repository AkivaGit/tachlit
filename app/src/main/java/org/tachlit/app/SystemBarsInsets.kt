package org.tachlit.app

import android.app.Activity
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.os.Build
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.view.WindowManager
import androidx.core.graphics.Insets
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import kotlin.math.max

/**
 * Keeps app content out of the status bar, the camera cutout ("notch") and the
 * navigation bar / gesture area, so every screen looks the way it did when the
 * app targeted API 34.
 *
 * On Android 15+ apps targeting API 35+ are forced to draw edge-to-edge, and
 * from API 36 there is no opt-out. On those devices this:
 *  - pads the whole window content (action bar / toolbar included) by the
 *    system bar and display cutout insets, so nothing is drawn behind them;
 *  - paints the status bar area with the theme's `android:statusBarColor` and
 *    the navigation bar area with `android:navigationBarColor`, which the
 *    system no longer does itself. When the status bar is hidden (full-screen
 *    splash) the cutout area is painted black, like the old letterbox;
 *  - keeps the keyboard resizing the screen, like `adjustResize` did before.
 *
 * On Android 14 and lower the system still does all of this, so nothing is
 * changed there.
 */
object SystemBarsInsets {

    fun apply(activity: Activity) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) return

        val window = activity.window
        val decor = window.decorView as? ViewGroup ?: return
        val root = windowContentRoot(activity, decor) ?: return

        // We paint the navigation bar area ourselves; don't let the system
        // add its translucent 3-button scrim on top of it.
        window.isNavigationBarContrastEnforced = false
        useResizeForKeyboard(window)

        // Deprecated attributes, read on purpose: we paint these colors ourselves now.
        @Suppress("DEPRECATION")
        val scrims = BarScrims(
            decor = decor,
            statusBarColor = activity.themeColor(android.R.attr.statusBarColor),
            navigationBarColor = activity.themeColor(android.R.attr.navigationBarColor),
        )

        ViewCompat.setOnApplyWindowInsetsListener(root) { view, insets ->
            val bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
            )
            val imeBottom = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom
            view.setPadding(bars.left, bars.top, bars.right, max(bars.bottom, imeBottom))
            scrims.update(bars, insets.isVisible(WindowInsetsCompat.Type.statusBars()))
            // Everything inside is already in the safe area; stop children
            // (e.g. the AppCompat action bar) from insetting themselves again.
            WindowInsetsCompat.CONSUMED
        }
        ViewCompat.requestApplyInsets(root)
    }

    /**
     * Edge-to-edge windows are not resized by the keyboard; the IME height is
     * added to the bottom padding instead. Pin the mode to "resize" so the
     * system never pans the window on top of that padding.
     */
    @Suppress("DEPRECATION")
    private fun useResizeForKeyboard(window: Window) {
        val mode = window.attributes.softInputMode
        val adjust = mode and WindowManager.LayoutParams.SOFT_INPUT_MASK_ADJUST
        if (adjust == WindowManager.LayoutParams.SOFT_INPUT_ADJUST_UNSPECIFIED) {
            window.setSoftInputMode(
                (mode and WindowManager.LayoutParams.SOFT_INPUT_MASK_ADJUST.inv()) or
                    WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
            )
        }
    }

    /** The decor view's direct child that holds the action bar and the content. */
    private fun windowContentRoot(activity: Activity, decor: ViewGroup): View? {
        var view: View = activity.findViewById<View?>(android.R.id.content) ?: return null
        while (true) {
            val parent = view.parent as? View ?: return null
            if (parent === decor) return view
            view = parent
        }
    }

    private fun Activity.themeColor(attr: Int): Int {
        val a = obtainStyledAttributes(intArrayOf(attr))
        return try {
            a.getColor(0, Color.BLACK)
        } finally {
            a.recycle()
        }
    }

    /** Solid color bands drawn over the inset areas left empty by the padding. */
    private class BarScrims(
        private val decor: ViewGroup,
        private val statusBarColor: Int,
        navigationBarColor: Int,
    ) {
        private val top = ColorDrawable(statusBarColor)
        private val bottom = ColorDrawable(navigationBarColor)
        private val left = ColorDrawable(navigationBarColor)
        private val right = ColorDrawable(navigationBarColor)
        private var insets = Insets.NONE

        init {
            listOf(top, bottom, left, right).forEach { decor.overlay.add(it) }
            decor.addOnLayoutChangeListener { _, _, _, _, _, _, _, _, _ -> layout() }
        }

        fun update(insets: Insets, statusBarVisible: Boolean) {
            this.insets = insets
            top.color = if (statusBarVisible) statusBarColor else Color.BLACK
            layout()
        }

        private fun layout() {
            val w = decor.width
            val h = decor.height
            top.setBounds(0, 0, w, insets.top)
            bottom.setBounds(0, h - insets.bottom, w, h)
            left.setBounds(0, insets.top, insets.left, h - insets.bottom)
            right.setBounds(w - insets.right, insets.top, w, h - insets.bottom)
            decor.invalidate()
        }
    }
}
