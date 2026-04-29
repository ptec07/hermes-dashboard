from __future__ import annotations

import json
import re
import subprocess
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

from pydantic import BaseModel, Field


class HermesStatus(BaseModel):
    project: str = "알 수 없음"
    python: str = "알 수 없음"
    model: str = "알 수 없음"
    provider: str = "알 수 없음"
    gateway_running: bool = False
    discord_configured: bool = False
    active_jobs: int = 0
    active_sessions: int = 0


class SessionStoreSummary(BaseModel):
    total_sessions: int = 0
    total_messages: int = 0
    database_size: str = "알 수 없음"


class CronSummary(BaseModel):
    next_run: str = "알 수 없음"


class RecentSession(BaseModel):
    session_id: str
    platform: str = "unknown"
    session_start: str = ""
    last_updated: str = ""
    message_count: int = 0
    title: str | None = None


class SkillUsage(BaseModel):
    name: str
    count: int


class WebAppLink(BaseModel):
    name: str
    url: str
    status: str = "운영"


class DashboardSnapshot(BaseModel):
    generated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    status: HermesStatus
    session_store: SessionStoreSummary
    cron: CronSummary
    recent_sessions: list[RecentSession]
    skills: list[SkillUsage]
    web_apps: list[WebAppLink]


CommandRunner = Callable[[str], str]


def run_command(command: str) -> str:
    completed = subprocess.run(
        command,
        shell=True,
        check=False,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        timeout=30,
    )
    return completed.stdout


def _match_text(pattern: str, text: str, default: str = "알 수 없음") -> str:
    match = re.search(pattern, text, flags=re.MULTILINE)
    return match.group(1).strip() if match else default


def _match_int(pattern: str, text: str, default: int = 0) -> int:
    match = re.search(pattern, text, flags=re.MULTILINE)
    if not match:
        return default
    try:
        return int(match.group(1).replace(",", ""))
    except ValueError:
        return default


def parse_status_text(status_text: str) -> HermesStatus:
    return HermesStatus(
        project=_match_text(r"Project:\s+(.+)", status_text),
        python=_match_text(r"Python:\s+(.+)", status_text),
        model=_match_text(r"Model:\s+(.+)", status_text),
        provider=_match_text(r"Provider:\s+(.+)", status_text),
        gateway_running=bool(re.search(r"Gateway Service[\s\S]*?Status:\s+✓\s+running", status_text))
        or "Gateway is running" in status_text
        or bool(re.search(r"Status:\s+✓\s+running", status_text)),
        discord_configured=bool(re.search(r"Discord\s+✓\s+configured", status_text)),
        active_jobs=_match_int(r"Jobs:\s+(\d+)\s+active", status_text),
        active_sessions=_match_int(r"Active:\s+(\d+)\s+session", status_text),
    )


def parse_sessions_stats_text(stats_text: str) -> SessionStoreSummary:
    return SessionStoreSummary(
        total_sessions=_match_int(r"Total sessions:\s+(\d+)", stats_text),
        total_messages=_match_int(r"Total messages:\s+(\d+)", stats_text),
        database_size=_match_text(r"Database size:\s+(.+)", stats_text),
    )


def parse_cron_status_text(cron_text: str) -> CronSummary:
    return CronSummary(next_run=_match_text(r"Next run:\s+(.+)", cron_text))


def _extract_skill_names(session: dict) -> list[str]:
    names: list[str] = []
    for message in session.get("messages", []):
        for tool_call in message.get("tool_calls", []) or []:
            function = tool_call.get("function", {})
            if function.get("name") != "skill_view":
                continue
            try:
                arguments = json.loads(function.get("arguments") or "{}")
            except json.JSONDecodeError:
                arguments = {}
            name = arguments.get("name")
            if name:
                names.append(name)
        if message.get("role") == "tool":
            try:
                content = json.loads(message.get("content") or "{}")
            except json.JSONDecodeError:
                continue
            if isinstance(content, dict) and content.get("skill_dir") and content.get("name"):
                names.append(content["name"])
    return names


def load_recent_sessions(sessions_dir: Path, limit: int = 8) -> tuple[list[RecentSession], Counter[str], SessionStoreSummary]:
    session_files = sorted(
        sessions_dir.glob("session_*.json"),
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )
    recent: list[RecentSession] = []
    skill_counts: Counter[str] = Counter()
    total_messages = 0
    parsed_sessions = 0
    for path in session_files[: max(limit, 30)]:
        try:
            session = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        unique_names = set(_extract_skill_names(session))
        skill_counts.update(unique_names)
        message_count = int(session.get("message_count") or len(session.get("messages", [])))
        parsed_sessions += 1
        total_messages += message_count
        if len(recent) < limit:
            recent.append(
                RecentSession(
                    session_id=session.get("session_id", path.stem),
                    platform=session.get("platform", "unknown"),
                    session_start=session.get("session_start", ""),
                    last_updated=session.get("last_updated", ""),
                    message_count=message_count,
                    title=session.get("title"),
                )
            )
    fallback_summary = SessionStoreSummary(total_sessions=parsed_sessions, total_messages=total_messages)
    return recent, skill_counts, fallback_summary


def default_web_apps() -> list[WebAppLink]:
    return [
        WebAppLink(name="The Dashboard I Made", url="https://the-dashboard-i-made.vercel.app"),
        WebAppLink(name="Python Quest", url="https://python-quest-taupe.vercel.app"),
        WebAppLink(name="TypeScript Quest", url="https://typescript-quest.vercel.app"),
        WebAppLink(name="HTML Vercel Blog", url="https://html-vercel-blog.vercel.app"),
    ]


def collect_dashboard_snapshot(
    sessions_dir: Path = Path.home() / ".hermes" / "sessions",
    command_runner: CommandRunner = run_command,
) -> DashboardSnapshot:
    status_text = command_runner("hermes status --all 2>&1")
    stats_text = command_runner("hermes sessions stats 2>&1")
    cron_text = command_runner("hermes cron status 2>&1")
    recent_sessions, skill_counts, fallback_session_store = load_recent_sessions(sessions_dir)
    session_store = parse_sessions_stats_text(stats_text)
    if session_store.total_sessions == 0 and fallback_session_store.total_sessions:
        session_store = fallback_session_store

    return DashboardSnapshot(
        status=parse_status_text(status_text),
        session_store=session_store,
        cron=parse_cron_status_text(cron_text),
        recent_sessions=recent_sessions,
        skills=[SkillUsage(name=name, count=count) for name, count in skill_counts.most_common(12)],
        web_apps=default_web_apps(),
    )
