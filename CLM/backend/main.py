from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mongodb_client import init_db


from routes.admin import router as admin_router
from routes.auth import router as auth_router
from routes.users import router as users_router
from routes.dashboard import router as dashboard_router
from routes.opportunities import router as opportunities_router
from routes.contracts import router as contracts_router
from routes.notifications import router as notifications_router
from routes.roles import router as roles_router
from routes.stages import router as stages_router



app = FastAPI(title="CLM Admin API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await init_db()

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

# Include routes
app.include_router(admin_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(opportunities_router, prefix="/api")
app.include_router(contracts_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(roles_router, prefix="/api")
app.include_router(stages_router, prefix="/api")

