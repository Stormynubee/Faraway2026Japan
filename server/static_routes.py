"""Mount Vite production build for single-origin deployment."""

from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse

DEFAULT_DIST_DIR = Path(__file__).resolve().parent.parent / "dist"


def resolve_dist_dir() -> Path:
    override = os.environ.get("BOGIE_DIST_DIR", "").strip()
    if override:
        return Path(override)
    return DEFAULT_DIST_DIR


def mount_static_routes(app: FastAPI, dist_dir: Path | None = None) -> bool:
    """
    Register SPA static routes when dist/index.html exists.
    Returns False in dev when dist/ is absent — no 500s.
    """
    dist = (dist_dir or resolve_dist_dir()).resolve()
    index = dist / "index.html"
    if not index.is_file():
        return False

    @app.get("/", include_in_schema=False)
    async def serve_index():
        return FileResponse(index)

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path == "ws" or full_path == "health":
            raise HTTPException(status_code=404, detail="Not found")
        candidate = (dist / full_path).resolve()
        try:
            candidate.relative_to(dist)
        except ValueError:
            raise HTTPException(status_code=404, detail="Not found") from None
        if candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(index)

    return True
