# rag_physicthink

RAG pipeline cho bai vat ly:

1. Dung lesson trong `data/**/prob*/prob*.json` de build embedding index bang Gemini Embeddings.
2. Khi nhan lesson moi, retrieve top-k bai gan nhat.
3. Dung top-k `(lesson -> graph)` lam few-shot cho K2Think de sinh graph text.
4. Dung cung top-k `(graph -> svg)` lam few-shot cho K2Think de sinh SVG.

## Cau truc

- `data_loader.py`: quet dataset (`lesson`, `graph`, `svg`).
- `embedding.py`: Gemini embedding client + cosine similarity.
- `index_store.py`: build/load/save index.
- `prompt_builder.py`: few-shot prompt builder (tan dung `test_k2think.py`, `k2think_layout_planner.py`).
- `k2think_client.py`: goi API K2Think + hau xu ly output.
- `pipeline.py`: orchestration end-to-end.
- `cli.py`: entrypoint dong lenh.

## Usage

Build index:

```bash
python -m rag_physicthink.cli build-index --data-root data --index-path rag_physicthink/artifacts/lesson_rag_index.json
```

Retrieve top 5:

```bash
python -m rag_physicthink.cli retrieve --lesson "your lesson text" --top-k 5
```

Run full pipeline:

```bash
python -m rag_physicthink.cli run --lesson "your lesson text" --top-k 5 --graph-out extracted.txt --svg-out layout.svg --html-out layout.html --graph-prompt-out rag_physicthink/artifacts/graph_prompt.txt --svg-prompt-out rag_physicthink/artifacts/svg_prompt.txt
```

## Environment

- `K2THINK_API_KEY` trong `.env` hoac truyen qua `--api-key`.
- `GEMINI_API_KEY` (hoac `GOOGLE_API_KEY`) trong `.env` hoac truyen qua `--gemini-api-key`.
- `EMBEDDING_MODEL` (vi du `gemini-embedding-001`) trong `.env` hoac truyen qua `--embedding-model`.
- `GEMINI_BASE_URL` tuy chon, mac dinh: `https://generativelanguage.googleapis.com/v1beta`.
- `requests`, `python-dotenv`.
