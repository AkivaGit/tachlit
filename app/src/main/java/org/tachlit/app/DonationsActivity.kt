package org.tachlit.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import com.google.android.material.button.MaterialButton

class DonationsActivity : BaseActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_donations)

        findViewById<MaterialButton>(R.id.btnDonateLink).setOnClickListener {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(getString(R.string.donations_url)))
            startActivity(intent)
        }

        findViewById<MaterialButton>(R.id.btnJGiveLink).setOnClickListener {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(getString(R.string.jgive_url)))
            startActivity(intent)
        }
    }
}
