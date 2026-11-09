package org.tachlit.app.network

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertEquals
import org.junit.Test
import retrofit2.Response

class ServerErrorTest {

    private fun reply(code: Int, body: String, type: String = "application/json"): Response<Any> =
        Response.error(code, body.toResponseBody(type.toMediaType()))

    @Test
    fun fieldErrors_listHebrewThenEnglish() {
        val body = """
            {"success":false,"message":"Validation failed","message_he":"חלק מהפרטים אינם תקינים",
             "errors":[
               {"field":"password","message":"Password rule","message_he":"כלל סיסמה","value":"abc"},
               {"field":"phone","message":"Phone rule","message_he":"כלל טלפון","value":"050-1"}
             ]}
        """.trimIndent()

        assertEquals(
            "• כלל סיסמה\n• כלל טלפון\n\n• Password rule\n• Phone rule",
            ServerError.describe(reply(400, body))
        )
    }

    @Test
    fun singleMessage_hebrewThenEnglish() {
        val body = """{"success":false,"message":"User with this email already exists","message_he":"כבר קיים משתמש"}"""

        assertEquals(
            "כבר קיים משתמש\n\nUser with this email already exists",
            ServerError.describe(reply(400, body))
        )
    }

    @Test
    fun noHebrewFromServer_showsEnglishOnly() {
        val body = """{"success":false,"message":"Validation failed","errors":[{"field":"email","message":"Bad email"}]}"""

        assertEquals("Bad email", ServerError.describe(reply(400, body)))
    }

    @Test
    fun htmlErrorPage_fallsBackToCode() {
        assertEquals(
            "שגיאת שרת (HTTP 502)\n\nServer error (HTTP 502)",
            ServerError.describe(reply(502, "<html>Bad Gateway</html>", "text/html"))
        )
    }

    @Test
    fun plainTextReply_shownAsIs() {
        assertEquals(
            "Too many requests",
            ServerError.describe(reply(429, "Too many requests", "text/plain"))
        )
    }
}
