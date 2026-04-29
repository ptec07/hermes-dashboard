import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('Vercel deployment config', () => {
  it('copies the built app shell to 404.html for SPA fallback', () => {
    const packageJson = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf-8')) as {
      scripts?: Record<string, string>
    }

    expect(packageJson.scripts?.build).toContain('cp dist/index.html dist/404.html')
  })

  it('declares Vercel dist output and SPA rewrite', () => {
    const config = JSON.parse(readFileSync(resolve(__dirname, '../../vercel.json'), 'utf-8')) as {
      outputDirectory?: string
      rewrites?: Array<{ source: string; destination: string }>
    }

    expect(config.outputDirectory).toBe('dist')
    expect(config.rewrites).toContainEqual({ source: '/(.*)', destination: '/index.html' })
  })

  it('ships a cloud preview API for Vercel while live local Hermes data stays backend-only', () => {
    const apiSource = readFileSync(resolve(__dirname, '../../api/dashboard.js'), 'utf-8')

    expect(apiSource).toContain('local Hermes backend required for live data')
    expect(apiSource).toContain('The Dashboard I Made')
  })
})
