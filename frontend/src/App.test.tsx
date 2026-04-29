import { render, screen, waitFor, within } from '@testing-library/react'
import App from './App'

const snapshot = {
  generated_at: '2026-04-29T20:00:00+09:00',
  status: {
    project: '/home/ptec07/.hermes/hermes-agent',
    python: '3.11.15',
    model: 'gpt-5.5',
    provider: 'OpenAI Codex',
    gateway_running: true,
    discord_configured: true,
    active_jobs: 3,
    active_sessions: 21,
  },
  session_store: {
    total_sessions: 395,
    total_messages: 35847,
    database_size: '669.3 MB',
  },
  cron: {
    next_run: '2026-04-30T07:00:00+09:00',
  },
  recent_sessions: [
    {
      session_id: '20260429_100225_cd0e2b',
      platform: 'discord',
      session_start: '2026-04-29T18:43:44',
      last_updated: '2026-04-29T19:45:13',
      message_count: 85,
      title: 'Hermes Dashboard 작업',
    },
  ],
  skills: [
    { name: 'test-driven-development', count: 4 },
    { name: 'github-auth', count: 2 },
  ],
  web_apps: [
    { name: 'The Dashboard I Made', url: 'https://the-dashboard-i-made.vercel.app', status: '운영' },
    { name: 'Python Quest', url: 'https://python-quest-taupe.vercel.app', status: '운영' },
  ],
}

describe('Hermes Dashboard', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => snapshot,
      })),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders operational Hermes status, sessions, skills and app inventory', async () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /Hermes Dashboard/i })).toBeInTheDocument()
    expect((await screen.findAllByText(/OpenAI Codex/i)).length).toBeGreaterThan(0)
    expect(screen.getByText(/Gateway 실행 중/i)).toBeInTheDocument()
    expect(screen.getByText('395')).toBeInTheDocument()
    expect(screen.getByText('35847')).toBeInTheDocument()

    const skills = screen.getByRole('region', { name: /최근 사용 스킬/i })
    expect(within(skills).getByText(/test-driven-development/i)).toBeInTheDocument()
    expect(within(skills).getByText(/github-auth/i)).toBeInTheDocument()

    const apps = screen.getByRole('region', { name: /웹앱 인벤토리/i })
    expect(within(apps).getByRole('link', { name: /The Dashboard I Made/i })).toHaveAttribute(
      'href',
      'https://the-dashboard-i-made.vercel.app',
    )
    expect(within(apps).getByRole('link', { name: /Python Quest/i })).toHaveAttribute(
      'href',
      'https://python-quest-taupe.vercel.app',
    )

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/dashboard'))
  })
})
