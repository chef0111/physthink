from __future__ import annotations

import math
from typing import Any

import requests


def vector_norm(vector: list[float]) -> float:
    return math.sqrt(sum(value * value for value in vector))


def cosine_similarity(
    lhs: list[float],
    lhs_norm: float,
    rhs: list[float],
    rhs_norm: float,
) -> float:
    if lhs_norm == 0 or rhs_norm == 0:
        return 0.0
    if len(lhs) != len(rhs):
        raise ValueError(f"Embedding length mismatch: {len(lhs)} != {len(rhs)}")

    dot = 0.0
    for left, right in zip(lhs, rhs):
        dot += left * right
    if dot == 0:
        return 0.0
    return dot / (lhs_norm * rhs_norm)


class GeminiEmbeddingClient:
    def __init__(
        self,
        api_key: str,
        model: str,
        base_url: str = "https://generativelanguage.googleapis.com/v1beta",
        timeout_seconds: int = 120,
    ) -> None:
        if not api_key:
            raise ValueError("Missing GEMINI_API_KEY for embedding requests.")
        if not model:
            raise ValueError("Missing embedding model.")

        self.api_key = api_key
        self.model = model.replace("models/", "", 1)
        self.base_url = base_url.rstrip("/")
        self.timeout_seconds = timeout_seconds

    def _request_embedding(self, text: str) -> list[float]:
        url = f"{self.base_url}/models/{self.model}:embedContent"
        payload: dict[str, Any] = {
            "content": {"parts": [{"text": text}]},
        }

        response = requests.post(
            url,
            params={"key": self.api_key},
            json=payload,
            timeout=self.timeout_seconds,
        )
        if not (200 <= response.status_code < 300):
            raise RuntimeError(f"Embedding HTTP {response.status_code} at {url}\n{response.text}")

        embedding = response.json().get("embedding", {}).get("values")
        if not isinstance(embedding, list):
            raise RuntimeError("Malformed embedding response: missing embedding.values list.")
        return [float(value) for value in embedding]

    def embed_texts(self, texts: list[str], batch_size: int = 32) -> list[list[float]]:
        if batch_size <= 0:
            raise ValueError("batch_size must be > 0")
        # Gemini embedContent is requested per text for compatibility across API versions.
        total = len(texts)
        if total == 0:
            return []
        print(f"[rag_physicthink] Embedding progress: 0/{total}", flush=True)
        results: list[list[float]] = []
        for index, text in enumerate(texts, start=1):
            results.append(self._request_embedding(text))
            if index == total or index % 5 == 0:
                print(f"[rag_physicthink] Embedding progress: {index}/{total}", flush=True)
        return results

    def embed_text(self, text: str) -> list[float]:
        return self._request_embedding(text)
