from pathlib import Path

from app.collector import collect_dashboard_snapshot, parse_status_text


def test_parse_status_text_extracts_operational_summary():
    status_text = """
◆ Environment
  Project:      /home/ptec07/.hermes/hermes-agent
  Python:       3.11.15
  Model:        gpt-5.5
  Provider:     OpenAI Codex

◆ Auth Providers
  OpenAI Codex  ✓ logged in

◆ Messaging Platforms
  Discord       ✓ configured (home: 1485093867471503552)

◆ Gateway Service
  Status:       ✓ running

◆ Scheduled Jobs
  Jobs:         3 active, 3 total

◆ Sessions
  Active:       21 session(s)
"""

    summary = parse_status_text(status_text)

    assert summary.project == "/home/ptec07/.hermes/hermes-agent"
    assert summary.model == "gpt-5.5"
    assert summary.provider == "OpenAI Codex"
    assert summary.gateway_running is True
    assert summary.discord_configured is True
    assert summary.active_jobs == 3
    assert summary.active_sessions == 21


def test_collect_dashboard_snapshot_counts_sessions_and_skills(tmp_path: Path):
    sessions_dir = tmp_path / "sessions"
    sessions_dir.mkdir()
    (sessions_dir / "session_20260429_120000_demo.json").write_text(
        """
        {
          "session_id": "20260429_120000_demo",
          "platform": "discord",
          "session_start": "2026-04-29T12:00:00",
          "last_updated": "2026-04-29T12:10:00",
          "message_count": 5,
          "messages": [
            {"role":"assistant","tool_calls":[{"function":{"name":"skill_view","arguments":"{\\\"name\\\":\\\"test-driven-development\\\"}"}}]},
            {"role":"tool","content":"{\\\"name\\\":\\\"github-auth\\\",\\\"skill_dir\\\":\\\"/skills/github-auth\\\"}"}
          ]
        }
        """,
        encoding="utf-8",
    )

    snapshot = collect_dashboard_snapshot(
        sessions_dir=sessions_dir,
        command_runner=lambda command: "Status:       ✓ running\nJobs:         2 active, 2 total\nActive:       9 session(s)\nModel:        gpt-5.5\nProvider:     OpenAI Codex\nDiscord       ✓ configured",
    )

    assert snapshot.status.gateway_running is True
    assert snapshot.status.active_jobs == 2
    assert snapshot.status.active_sessions == 9
    assert snapshot.session_store.total_sessions == 1
    assert snapshot.session_store.total_messages == 5
    assert snapshot.recent_sessions[0].session_id == "20260429_120000_demo"
    assert {skill.name for skill in snapshot.skills} == {"test-driven-development", "github-auth"}
