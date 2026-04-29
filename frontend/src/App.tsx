import { Activity, Bot, CalendarClock, CheckCircle2, ExternalLink, Terminal, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'
import { fetchDashboardSnapshot, type DashboardSnapshot } from './lib/dashboard'

function StatCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </article>
  )
}

function StatusPill({ ok, children }: { ok: boolean; children: string }) {
  return <span className={ok ? 'pill pill-ok' : 'pill pill-warn'}>{children}</span>
}

function Dashboard({ snapshot }: { snapshot: DashboardSnapshot }) {
  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Local Operations Console</p>
          <h1>Hermes Dashboard</h1>
          <p className="hero-copy">Hermes Agent의 모델, 게이트웨이, 세션, 스킬, 예약 작업, 웹앱 링크를 한 화면에서 봅니다.</p>
          <div className="pill-row">
            <StatusPill ok={snapshot.status.gateway_running}>
              {snapshot.status.gateway_running ? 'Gateway 실행 중' : 'Gateway 중지됨'}
            </StatusPill>
            <StatusPill ok={snapshot.status.discord_configured}>
              {snapshot.status.discord_configured ? 'Discord 연결됨' : 'Discord 미설정'}
            </StatusPill>
          </div>
        </div>
        <div className="hero-panel">
          <Bot aria-hidden="true" />
          <span>Provider</span>
          <strong>{snapshot.status.provider}</strong>
          <small>{snapshot.status.model}</small>
        </div>
      </section>

      <section className="stats" aria-label="Hermes 운영 지표">
        <StatCard label="총 세션" value={snapshot.session_store.total_sessions} detail={snapshot.session_store.database_size} />
        <StatCard label="총 메시지" value={snapshot.session_store.total_messages} />
        <StatCard label="활성 세션" value={snapshot.status.active_sessions} />
        <StatCard label="활성 Cron" value={snapshot.status.active_jobs} detail={`다음 실행: ${snapshot.cron.next_run}`} />
      </section>

      <section className="grid-two">
        <article className="panel">
          <h2><Terminal aria-hidden="true" /> 런타임 상태</h2>
          <dl className="details">
            <div><dt>Project</dt><dd>{snapshot.status.project}</dd></div>
            <div><dt>Python</dt><dd>{snapshot.status.python}</dd></div>
            <div><dt>Model</dt><dd>{snapshot.status.model}</dd></div>
            <div><dt>Provider</dt><dd>{snapshot.status.provider}</dd></div>
          </dl>
        </article>

        <section className="panel" aria-label="최근 사용 스킬">
          <h2><Wrench aria-hidden="true" /> 최근 사용 스킬</h2>
          <div className="skill-list">
            {snapshot.skills.length ? snapshot.skills.map((skill) => (
              <div className="skill-row" key={skill.name}>
                <span>{skill.name}</span>
                <strong>{skill.count}</strong>
              </div>
            )) : <p className="muted">최근 세션에서 스킬 기록을 찾지 못했습니다.</p>}
          </div>
        </section>
      </section>

      <section className="panel" aria-label="최근 세션">
        <h2><Activity aria-hidden="true" /> 최근 세션</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>세션</th><th>플랫폼</th><th>메시지</th><th>최근 갱신</th></tr>
            </thead>
            <tbody>
              {snapshot.recent_sessions.map((session) => (
                <tr key={session.session_id}>
                  <td>{session.title ?? session.session_id}</td>
                  <td>{session.platform}</td>
                  <td>{session.message_count}</td>
                  <td>{session.last_updated || session.session_start}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel" aria-label="웹앱 인벤토리">
        <h2><ExternalLink aria-hidden="true" /> 웹앱 인벤토리</h2>
        <div className="app-grid">
          {snapshot.web_apps.map((app) => (
            <a className="app-card" href={app.url} key={app.url} target="_blank" rel="noreferrer">
              <span>{app.name}</span>
              <small>{app.status}</small>
            </a>
          ))}
        </div>
      </section>

      <footer>
        <CheckCircle2 aria-hidden="true" /> 마지막 수집: {snapshot.generated_at} <CalendarClock aria-hidden="true" /> 로컬 Hermes CLI 기반
      </footer>
    </main>
  )
}

export default function App() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardSnapshot()
      .then(setSnapshot)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : '대시보드를 불러오지 못했습니다.'))
  }, [])

  if (error) {
    return <main className="shell"><h1>Hermes Dashboard</h1><p className="error">{error}</p></main>
  }

  if (!snapshot) {
    return <main className="shell"><h1>Hermes Dashboard</h1><p className="muted">Hermes 상태를 불러오는 중입니다…</p></main>
  }

  return <Dashboard snapshot={snapshot} />
}
