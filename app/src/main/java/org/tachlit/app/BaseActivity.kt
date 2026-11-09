package org.tachlit.app

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.widget.FrameLayout
import android.widget.TextView
import androidx.annotation.StringRes
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity

/** A form field the user must fill in, with its name in Hebrew and in English. */
class RequiredField(
    val view: TextView,
    @StringRes val hebrewName: Int,
    @StringRes val englishName: Int
)

open class BaseActivity : AppCompatActivity() {

    private var loadingOverlay: View? = null

    override fun onPostCreate(savedInstanceState: Bundle?) {
        super.onPostCreate(savedInstanceState)
        // Android 15+ forces edge-to-edge; keep the UI out of the status bar,
        // camera cutout and navigation bar exactly like before.
        SystemBarsInsets.apply(this)
    }

    private fun attachOverlayIfNeeded() {
        if (loadingOverlay != null) return
        val rootView = window?.decorView?.findViewById<FrameLayout>(android.R.id.content) ?: return
        loadingOverlay = LayoutInflater.from(this).inflate(R.layout.overlay_loading, rootView, false)
        rootView.addView(loadingOverlay)
        loadingOverlay?.visibility = View.GONE
    }

    fun showLoading() {
        runOnUiThread {
            attachOverlayIfNeeded()
            loadingOverlay?.visibility = View.VISIBLE
        }
    }

    fun hideLoading() {
        runOnUiThread {
            loadingOverlay?.visibility = View.GONE
        }
    }

    /** Shows a popup with a title, a message (e.g. the server's failure cause) and an OK button. */
    fun showErrorDialog(title: String, message: String) {
        if (isFinishing || isDestroyed) return
        AlertDialog.Builder(this)
            .setTitle(title)
            .setMessage(message)
            .setPositiveButton(R.string.ok, null)
            .show()
    }

    /**
     * Checks that every field has text. Empty fields get an inline error, and one
     * popup lists all of them in Hebrew and in English.
     * Returns true when nothing is missing.
     */
    fun checkRequiredFields(fields: List<RequiredField>): Boolean {
        val missing = fields.filter { it.view.text.toString().trim().isEmpty() }
        if (missing.isEmpty()) return true

        missing.forEach { it.view.error = getString(R.string.please_fill_all_fields) }

        val message = buildString {
            appendLine(getString(R.string.missing_fields_intro_he))
            missing.forEach { appendLine("• " + getString(it.hebrewName)) }
            appendLine()
            appendLine(getString(R.string.missing_fields_intro_en))
            missing.forEach { appendLine("• " + getString(it.englishName)) }
        }.trimEnd()

        showErrorDialog(getString(R.string.missing_fields_title), message)
        missing.first().view.requestFocus()
        return false
    }
}
