import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('visual theme', () => {
  it('uses a clean sky-blue palette with dark blue text and matching accents', () => {
    const css = readFileSync(resolve(__dirname, '../styles.css'), 'utf-8')

    expect(css).toContain('color-scheme: light')
    expect(css).toContain('#e0f7ff')
    expect(css).toContain('#f8fdff')
    expect(css).toContain('#0f3a5a')
    expect(css).toContain('#0284c7')
    expect(css).not.toContain('#08111f')
    expect(css).not.toContain('color-scheme: dark')
  })
})
