package org.tachlit.app

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import org.tachlit.app.session.SessionManager

class SplashActivity : BaseActivity() {

    private val splashTimeOut: Long = 2000 // 2 seconds

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)

        // After the splash delay, route the user according to their persisted
        // session: supervisors auto-open the supervisor screen, other roles
        // land on their personal home, and users without a session see the
        // main "choose your role" screen.
        Handler(Looper.getMainLooper()).postDelayed({
            if (SessionManager.isLoggedIn(this)) {
                SessionManager.startHomeForCurrentRole(this)
            } else {
                startActivity(Intent(this, MainActivity::class.java))
            }
            finish()
        }, splashTimeOut)
    }
}