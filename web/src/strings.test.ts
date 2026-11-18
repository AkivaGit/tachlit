import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { S, fmt } from './strings'

/** Reads the Android app's strings.xml so the web texts can never drift from it. */
function androidStrings(): Record<string, string> {
  // Tests run from web/, so the Android app is one folder up.
  const path = resolve(process.cwd(), '../app/src/main/res/values/strings.xml')
  const xml = readFileSync(path, 'utf-8')
  const result: Record<string, string> = {}
  for (const m of xml.matchAll(/<string name="([^"]+)">([\s\S]*?)<\/string>/g)) {
    result[m[1]] = m[2]
      .replace(/\\n/g, '\n')
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
  }
  return result
}

describe('strings', () => {
  const android = androidStrings()

  it('has every text the Android app shows, word for word', () => {
    const missing = Object.keys(android).filter((k) => !(k in S))
    expect(missing).toEqual([])
    for (const [key, value] of Object.entries(android)) {
      expect(S[key as keyof typeof S], key).toBe(value)
    }
  })

  it('formats Android placeholders', () => {
    expect(fmt(S.role_home_greeting, 'דוד')).toBe('שלום דוד')
    expect(fmt(S.role_home_role_label, 'לומד')).toBe('התפקיד שלך: לומד')
    expect(fmt(S.compatibility_score, 80)).toBe('התאמה: 80%')
  })
})
