package org.tachlit.app.network

import com.google.gson.Gson
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import retrofit2.Response

/**
 * Turns a failed server reply into a readable cause to show the user,
 * in Hebrew first and then English.
 *
 * On an error (4xx/5xx) Retrofit leaves `body()` null and puts the server's
 * JSON in `errorBody()`. The server replies with:
 *   {
 *     "success": false,
 *     "message": "English", "message_he": "עברית",
 *     "errors": [ { "field": "...", "message": "English", "message_he": "עברית" } ]
 *   }
 * Field errors are listed one per line; otherwise the top-level message is used.
 * If the server sent no Hebrew, only the English part is shown.
 */
object ServerError {

    private val gson = Gson()

    fun describe(response: Response<*>): String {
        val raw = try {
            response.errorBody()?.string()
        } catch (e: Exception) {
            null
        }
        val json: JsonObject? = raw?.let { runCatching { gson.fromJson(it, JsonObject::class.java) }.getOrNull() }

        val fieldErrors = json?.get("errors")
            ?.takeIf { it.isJsonArray }
            ?.asJsonArray
            ?.mapNotNull { it as? JsonObject }
            .orEmpty()

        val hebrew: List<String>
        val english: List<String>
        if (fieldErrors.isNotEmpty()) {
            hebrew = fieldErrors.mapNotNull { it.text("message_he") }.distinct()
            english = fieldErrors.mapNotNull { it.text("message") }.distinct()
        } else {
            hebrew = listOfNotNull(json?.text("message_he"))
            english = listOfNotNull(json?.text("message") ?: json?.text("error") ?: plainText(raw))
        }

        if (hebrew.isEmpty() && english.isEmpty()) {
            val code = response.code()
            return "שגיאת שרת (HTTP $code)\n\nServer error (HTTP $code)"
        }
        return listOf(hebrew, english)
            .filter { it.isNotEmpty() }
            .joinToString("\n\n") { lines -> format(lines) }
    }

    /** One message stays as is; several become a bulleted list. */
    private fun format(lines: List<String>): String =
        if (lines.size == 1) lines.first() else lines.joinToString("\n") { "• $it" }

    /** Short plain-text replies are shown as is; HTML error pages are skipped. */
    private fun plainText(raw: String?): String? =
        raw?.trim()?.takeIf { it.isNotEmpty() && it.length <= 300 && !it.startsWith("<") }

    private fun JsonObject.text(key: String): String? =
        get(key)
            ?.takeIf(JsonElement::isJsonPrimitive)
            ?.asString
            ?.takeIf { it.isNotBlank() }
}
