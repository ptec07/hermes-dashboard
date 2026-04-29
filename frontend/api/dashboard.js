module.exports = function handler(_request, response) {
  response.status(200).json({
    generated_at: new Date().toISOString(),
    status: {
      project: 'Vercel cloud preview — local Hermes runtime is not mounted',
      python: 'Vercel Serverless',
      model: 'local-only',
      provider: 'local Hermes backend required for live data',
      gateway_running: false,
      discord_configured: false,
      active_jobs: 0,
      active_sessions: 0,
    },
    session_store: {
      total_sessions: 0,
      total_messages: 0,
      database_size: 'local-only',
    },
    cron: {
      next_run: 'local-only',
    },
    recent_sessions: [],
    skills: [],
    web_apps: [
      { name: 'The Dashboard I Made', url: 'https://the-dashboard-i-made.vercel.app', status: '운영' },
      { name: 'Python Quest', url: 'https://python-quest-taupe.vercel.app', status: '운영' },
      { name: 'TypeScript Quest', url: 'https://typescript-quest.vercel.app', status: '운영' },
      { name: 'HTML Vercel Blog', url: 'https://html-vercel-blog.vercel.app', status: '운영' },
    ],
  })
}
