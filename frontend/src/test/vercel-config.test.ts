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

  it('ships the latest local Hermes snapshot instead of zero-value placeholder data', () => {
    const apiSource = readFileSync(resolve(__dirname, '../../api/dashboard.js'), 'utf-8')
    const snapshot = JSON.parse(readFileSync(resolve(__dirname, '../../api/dashboard-snapshot.json'), 'utf-8')) as {
      status?: { project?: string; provider?: string; active_sessions?: number }
      session_store?: { total_sessions?: number; total_messages?: number }
      skills?: unknown[]
      recent_sessions?: unknown[]
    }

    expect(apiSource).toContain('HERMES_DASHBOARD_BACKEND_URL')
    expect(apiSource).toContain('`${backendUrl}/api/dashboard`')
    expect(apiSource).toContain('dashboard-snapshot.json')
    expect(apiSource).not.toContain('Vercel cloud preview — local Hermes runtime is not mounted')
    expect(snapshot.status?.project).toBe('/home/ptec07/.hermes/hermes-agent')
    expect(snapshot.status?.provider).toBe('OpenAI Codex')
    expect(snapshot.session_store?.total_sessions).toBeGreaterThan(0)
    expect(snapshot.session_store?.total_messages).toBeGreaterThan(0)
    expect(snapshot.skills?.length).toBeGreaterThan(0)
    expect(snapshot.recent_sessions?.length).toBeGreaterThan(0)
  })
})
