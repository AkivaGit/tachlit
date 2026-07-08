package com.example.tachlit

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.Toolbar
import com.google.android.material.button.MaterialButton

class DonationsActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_donations)

        val toolbar = findViewById<Toolbar>(R.id.toolbar)
        setSupportActionBar(toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        findViewById<MaterialButton>(R.id.btnDonateLink).setOnClickListener {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(getString(R.string.donations_url)))
            startActivity(intent)
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
