export type HermesStatus = {
  project: string
  python: string
  model: string
  provider: string
  gateway_running: boolean
  discord_configured: boolean
  active_jobs: number
  active_sessions: number
}

export type SessionStoreSummary = {
  total_sessions: number
  total_messages: number
  database_size: string
}

export type CronSummary = {
  next_run: string
}

export type RecentSession = {
  session_id: string
  platform: string
  session_start: string
  last_updated: string
  message_count: number
  title?: string | null
}

export type SkillUsage = {
  name: string
  count: number
}

export type WebAppLink = {
  name: string
  url: string
  status: string
}

export type DashboardSnapshot = {
  generated_at: string
  status: HermesStatus
  session_store: SessionStoreSummary
  cron: CronSummary
  recent_sessions: RecentSession[]
  skills: SkillUsage[]
  web_apps: WebAppLink[]
}

export async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
  const response = await fetch('/api/dashboard')
  if (!response.ok) {
    throw new Error(`Dashboard API failed with status ${response.status}`)
  }
  return response.json() as Promise<DashboardSnapshot>
}
