package com.example.tachlit

import android.view.LayoutInflater
import android.view.View
import android.widget.FrameLayout
import androidx.appcompat.app.AppCompatActivity

open class BaseActivity : AppCompatActivity() {

    private var loadingOverlay: View? = null

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
