from __future__ import annotations

import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from .data_loader import discover_samples
from .embedding import GeminiEmbeddingClient, cosine_similarity, vector_norm
from .models import PhysicsSample, RetrievedSample

INDEX_VERSION = 3
DEFAULT_EMBEDDING_MODEL = "gemini-embedding-001"
DEFAULT_EMBEDDING_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"


@dataclass(frozen=True)
class IndexedSample:
    sample: PhysicsSample
    embedding: list[float]
    norm: float

    def to_dict(self) -> dict[str, object]:
        return {
            "sample": self.sample.to_dict(),
            "embedding": self.embedding,
            "norm": self.norm,
        }

    @classmethod
    def from_dict(cls, payload: dict[str, object]) -> "IndexedSample":
        return cls(
            sample=PhysicsSample.from_dict(dict(payload["sample"])),
            embedding=[float(value) for value in list(payload["embedding"])],
            norm=float(payload["norm"]),
        )


class LessonRagIndex:
    def __init__(
        self,
        embedding_model: str,
        embedding_base_url: str,
        samples: list[IndexedSample],
        data_root: str,
        gemini_api_key: str | None = None,
        created_at: str | None = None,
    ) -> None:
        self.embedding_model = embedding_model
        self.embedding_base_url = embedding_base_url
        self.samples = samples
        self.data_root = data_root
        self._gemini_api_key = gemini_api_key
        self.created_at = created_at or datetime.now(timezone.utc).isoformat()
        self._embed_client = self._build_embed_client()

    def _build_embed_client(self) -> GeminiEmbeddingClient | None:
        api_key = self._gemini_api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            return None
        return GeminiEmbeddingClient(
            api_key=api_key,
            model=self.embedding_model,
            base_url=self.embedding_base_url,
        )

    @classmethod
    def build(
        cls,
        data_root: Path,
        *,
        gemini_api_key: str | None = None,
        embedding_model: str | None = None,
        embedding_base_url: str | None = None,
        batch_size: int = 32,
    ) -> "LessonRagIndex":
        print(f"[rag_physicthink] Scanning dataset: {data_root}", flush=True)
        samples = discover_samples(data_root=data_root)
        if not samples:
            raise RuntimeError(f"No valid lesson/graph/svg samples found under: {data_root}")
        print(f"[rag_physicthink] Found {len(samples)} samples for indexing", flush=True)

        model = (
            embedding_model
            or os.getenv("EMBEDDING_MODEL")
            or os.getenv("GEMINI_EMBEDDING_MODEL")
            or DEFAULT_EMBEDDING_MODEL
        )
        base_url = embedding_base_url or os.getenv("GEMINI_BASE_URL", DEFAULT_EMBEDDING_BASE_URL)
        api_key = gemini_api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise RuntimeError("Missing GEMINI_API_KEY to build embedding index.")
        print(f"[rag_physicthink] Using embedding model: {model}", flush=True)

        embed_client = GeminiEmbeddingClient(
            api_key=api_key,
            model=model,
            base_url=base_url,
        )

        lesson_texts = [sample.lesson for sample in samples]
        print("[rag_physicthink] Requesting embeddings for lessons ...", flush=True)
        lesson_embeddings = embed_client.embed_texts(lesson_texts, batch_size=batch_size)
        if len(lesson_embeddings) != len(samples):
            raise RuntimeError(
                f"Embedding count mismatch: expected {len(samples)} got {len(lesson_embeddings)}"
            )
        print("[rag_physicthink] Embeddings received. Building in-memory index ...", flush=True)

        indexed_samples: list[IndexedSample] = []
        for sample, embedding in zip(samples, lesson_embeddings):
            indexed_samples.append(
                IndexedSample(sample=sample, embedding=embedding, norm=vector_norm(embedding))
            )

        return cls(
            embedding_model=model,
            embedding_base_url=base_url,
            samples=indexed_samples,
            data_root=str(data_root),
            gemini_api_key=api_key,
        )

    def retrieve(self, query: str, top_k: int = 5) -> list[RetrievedSample]:
        top_k = max(1, top_k)
        if self._embed_client is None:
            raise RuntimeError("Missing GEMINI_API_KEY for retrieval embedding query.")

        query_embedding = self._embed_client.embed_text(query)
        query_norm = vector_norm(query_embedding)

        scored: list[RetrievedSample] = []
        for item in self.samples:
            score = cosine_similarity(query_embedding, query_norm, item.embedding, item.norm)
            scored.append(RetrievedSample(sample=item.sample, score=score))

        scored.sort(key=lambda item: item.score, reverse=True)
        return scored[:top_k]

    def to_dict(self) -> dict[str, object]:
        return {
            "version": INDEX_VERSION,
            "created_at": self.created_at,
            "data_root": self.data_root,
            "embedding_provider": "gemini",
            "embedding_model": self.embedding_model,
            "embedding_base_url": self.embedding_base_url,
            "samples": [item.to_dict() for item in self.samples],
        }

    @classmethod
    def from_dict(
        cls,
        payload: dict[str, object],
        *,
        gemini_api_key: str | None = None,
        embedding_model: str | None = None,
        embedding_base_url: str | None = None,
    ) -> "LessonRagIndex":
        version = int(payload.get("version", 0))
        if version != INDEX_VERSION:
            raise ValueError(f"Unsupported index version: {version}")

        samples = [IndexedSample.from_dict(dict(item)) for item in list(payload["samples"])]
        return cls(
            embedding_model=embedding_model or str(payload["embedding_model"]),
            embedding_base_url=embedding_base_url or str(payload["embedding_base_url"]),
            samples=samples,
            data_root=str(payload["data_root"]),
            gemini_api_key=gemini_api_key,
            created_at=str(payload["created_at"]),
        )

    def save(self, index_path: Path) -> None:
        index_path.parent.mkdir(parents=True, exist_ok=True)
        index_path.write_text(
            json.dumps(self.to_dict(), ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    @classmethod
    def load(
        cls,
        index_path: Path,
        *,
        gemini_api_key: str | None = None,
        embedding_model: str | None = None,
        embedding_base_url: str | None = None,
    ) -> "LessonRagIndex":
        payload = json.loads(index_path.read_text(encoding="utf-8"))
        return cls.from_dict(
            payload,
            gemini_api_key=gemini_api_key,
            embedding_model=embedding_model,
            embedding_base_url=embedding_base_url,
        )
