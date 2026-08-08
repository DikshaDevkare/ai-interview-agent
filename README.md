# AI Interview Agent

Hackathon project foundation for an AI-powered interview experience. It currently contains only development setup; interview logic, LLM integration, persistence, and authentication are intentionally out of scope.

## Project structure

```text
ai-interview-agent/
├── frontend/       # React application built with Vite
├── backend/        # Express API server
├── data/           # Hackathon-provided JSON data files
├── PROMPTS.md      # AI/Codex prompt record
└── package.json    # Workspace convenience scripts
```

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

## Run the backend

```bash
cd backend
npm install
npm run dev
```

The health check is `GET http://localhost:3001/api/health`. From the repository root, `npm run frontend` and `npm run backend` run the respective development servers after dependencies are installed.
