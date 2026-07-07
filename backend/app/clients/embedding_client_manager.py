import asyncio
import json
import urllib.request
from typing import Optional

from app.conf.app_config import EmbeddingConfig, app_config


class LocalTEIEmbeddings:
    def __init__(self, base_url: str, model: str, timeout: int = 30):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = timeout

    def _post(self, payload: dict) -> list[list[float]]:
        request = urllib.request.Request(
            f"{self.base_url}/embed",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=self.timeout) as response:
            body = response.read().decode("utf-8")
        data = json.loads(body)
        if isinstance(data, dict):
            for key in ("embeddings", "data", "result"):
                if key in data:
                    data = data[key]
                    break
        if isinstance(data, list) and data and isinstance(data[0], list):
            return data
        if isinstance(data, list) and data and isinstance(data[0], (int, float)):
            return [data]
        raise ValueError(f"Unsupported embedding response from TEI: {body}")

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return self._post({"inputs": texts, "truncate": True})

    async def aembed_documents(self, texts: list[str]) -> list[list[float]]:
        return await asyncio.to_thread(self.embed_documents, texts)

    def embed_query(self, text: str) -> list[float]:
        return self.embed_documents([text])[0]

    async def aembed_query(self, text: str) -> list[float]:
        return (await self.aembed_documents([text]))[0]


class EmbeddingClientManager:
    def __init__(self, config: EmbeddingConfig):
        self.client: Optional[LocalTEIEmbeddings] = None
        self.config = config

    def _get_url(self):
        return f"http://{self.config.host}:{self.config.port}"

    def init(self):
        self.client = LocalTEIEmbeddings(base_url=self._get_url(), model=self.config.model)


embedding_client_manager = EmbeddingClientManager(app_config.embedding)

