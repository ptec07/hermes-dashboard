# Hermes Dashboard

Hermes Agent의 로컬 운영 상태를 한 화면에서 확인하는 웹 대시보드입니다.

## 구성

- `backend/`: FastAPI API 서버. Hermes CLI와 세션/크론 로그를 읽어 요약합니다.
- `frontend/`: Vite + React + TypeScript 대시보드 UI.

## 실행

```bash
# backend
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
uvicorn app.main:app --reload --host 127.0.0.1 --port 8765

# frontend
cd ../frontend
npm install
npm run dev -- --host 127.0.0.1
```

프론트엔드는 `/api` 요청을 `http://127.0.0.1:8765`로 프록시합니다.

## 검증

```bash
cd backend && source .venv/bin/activate && pytest -q
cd frontend && npm test -- --run && npm run build && npm run lint
```
