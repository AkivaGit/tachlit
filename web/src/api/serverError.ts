/**
 * Turns a failed server reply into a readable cause to show the user, in
 * Hebrew first and then English. Port of the Android app's ServerError.kt.
 *
 * The server replies with:
 *   { "success": false, "message": "English", "message_he": "עברית",
 *     "errors": [ { "field": "...", "message": "English", "message_he": "עברית" } ] }
 * Field errors are listed one per line; otherwise the top-level message is used.
 * If the server sent no Hebrew, only the English part is shown.
 */
export function describeServerError(status: number, rawBody: string | null): string {
  const json = parseObject(rawBody)

  const fieldErrors = Array.isArray(json?.errors)
    ? (json.errors as unknown[]).filter(isObject)
    : []

  let hebrew: string[]
  let english: string[]
  if (fieldErrors.length > 0) {
    hebrew = unique(fieldErrors.map((e) => text(e, 'message_he')))
    english = unique(fieldErrors.map((e) => text(e, 'message')))
  } else {
    hebrew = present([text(json, 'message_he')])
    english = present([text(json, 'message') ?? text(json, 'error') ?? plainText(rawBody)])
  }

  if (hebrew.length === 0 && english.length === 0) {
    return `שגיאת שרת (HTTP ${status})\n\nServer error (HTTP ${status})`
  }
  return [hebrew, english]
    .filter((lines) => lines.length > 0)
    .map(format)
    .join('\n\n')
}

type JsonObject = Record<string, unknown>

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseObject(raw: string | null): JsonObject | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return isObject(parsed) ? parsed : null
  } catch {
    return null
  }
}

/** A non-blank string value of `key`, or undefined. */
function text(obj: JsonObject | null, key: string): string | undefined {
  const value = obj?.[key]
  if (typeof value === 'string' && value.trim() !== '') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return undefined
}

function present(values: (string | undefined)[]): string[] {
  return values.filter((v): v is string => v !== undefined)
}

function unique(values: (string | undefined)[]): string[] {
  return [...new Set(present(values))]
}

/** One message stays as is; several become a bulleted list. */
function format(lines: string[]): string {
  return lines.length === 1 ? lines[0] : lines.map((l) => `• ${l}`).join('\n')
}

/** Short plain-text replies are shown as is; HTML error pages are skipped. */
function plainText(raw: string | null): string | undefined {
  const trimmed = raw?.trim()
  if (!trimmed || trimmed.length > 300 || trimmed.startsWith('<')) return undefined
  return trimmed
}
