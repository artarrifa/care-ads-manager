import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from app.core.config import settings
from app.api.auth import router as auth_router
from app.api.campaigns import router as campaigns_router
from app.api.delivery import router as delivery_router
from app.api.admin import router as admin_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Sistema Integral de Control, Contratación, Publicidad, Pagos, Cumplimiento y Auditoría Care Ads Manager V1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS Middleware (permitir peticiones de los juegos PWA y portales)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["ETag"]
)

# Montar Enrutadores bajo /api/v1
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(campaigns_router, prefix=settings.API_V1_PREFIX)
app.include_router(delivery_router, prefix=settings.API_V1_PREFIX)
app.include_router(admin_router, prefix=settings.API_V1_PREFIX)

# Montar Frontends Estáticos (Admin Console & Advertiser Portal)
admin_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/admin"))
adv_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/advertiser"))

if os.path.isdir(admin_dir):
    app.mount("/admin", StaticFiles(directory=admin_dir, html=True), name="admin")

if os.path.isdir(adv_dir):
    app.mount("/advertiser", StaticFiles(directory=adv_dir, html=True), name="advertiser")


@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/admin/")


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "HEALTHY",
        "service": "Care Ads Manager V1.0",
        "engine": "FastAPI + PostgreSQL",
        "version": settings.VERSION
    }
