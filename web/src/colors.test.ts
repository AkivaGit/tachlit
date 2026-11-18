import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { C } from './colors'

describe('colors', () => {
  it('match the Android app\'s colors.xml (as CSS #RRGGBB / rgba)', () => {
    const xml = readFileSync(resolve(process.cwd(), '../app/src/main/res/values/colors.xml'), 'utf-8')
    const android = Object.fromEntries([...xml.matchAll(/<color name="([^"]+)">#([0-9A-Fa-f]{6,8})<\/color>/g)].map((m) => [m[1], m[2]]))
    expect(Object.keys(android).length).toBeGreaterThan(30)
    for (const [name, hex] of Object.entries(android)) {
      const [a, rgb] = hex.length === 8 ? [parseInt(hex.slice(0, 2), 16), hex.slice(2)] : [255, hex]
      const expected = a === 255 ? `#${rgb.toUpperCase()}` : `rgba(${parseInt(rgb.slice(0, 2), 16)}, ${parseInt(rgb.slice(2, 4), 16)}, ${parseInt(rgb.slice(4, 6), 16)}, ${+(a / 255).toFixed(3)})`
      expect(C[name as keyof typeof C], name).toBe(expected)
    }
  })
})
