import uvicorn
from fastapi import FastAPI

from app.api.routers.query_router import query_router
from app.core.lifespan import lifespan

app = FastAPI(title="Data Agent", lifespan=lifespan)

app.include_router(query_router)

if __name__ == '__main__':
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

