# CLM Project Structure

## Runtime folders
- `src/`: Frontend (React + Vite)
- `backend/`: Backend API (FastAPI)
- `docker-compose.yml`: Local orchestration for frontend, backend, MongoDB, and mongo-express

## Utility and non-runtime folders
- `scripts/frontend/`: One-off frontend helper scripts
- `scripts/backend/`: One-off backend debug/test/admin scripts
- `docs/flowcharts/`: Process/workflow documents
- `artifacts/logs/`: Generated logs and command outputs
- `artifacts/exports/`: Archive/export files

## Run the app
```bash
docker compose up -d
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:8000`  
Mongo Express: `http://localhost:${MONGO_EXPRESS_PORT:-8082}`
