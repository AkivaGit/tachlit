package org.tachlit.app

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.widget.FrameLayout
import androidx.appcompat.app.AppCompatActivity

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
}
