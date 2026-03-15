from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent

if __package__ is None or __package__ == "":
    if str(REPO_ROOT) not in sys.path:
        sys.path.insert(0, str(REPO_ROOT))
    from k2think_layout_planner import render_html_with_svg
    from rag_physicthink.index_store import DEFAULT_EMBEDDING_MODEL, LessonRagIndex
    from rag_physicthink.k2think_client import K2ThinkClient
    from rag_physicthink.pipeline import RagPhysicsThinkPipeline
else:
    from k2think_layout_planner import render_html_with_svg
    from .index_store import DEFAULT_EMBEDDING_MODEL, LessonRagIndex
    from .k2think_client import K2ThinkClient
    from .pipeline import RagPhysicsThinkPipeline

load_dotenv()

DEFAULT_DATA_ROOT = REPO_ROOT / "data"
DEFAULT_INDEX_PATH = REPO_ROOT / "rag_physicthink" / "artifacts" / "lesson_rag_index.json"
DEFAULT_EMBEDDING_MODEL_NAME = (
    os.getenv("EMBEDDING_MODEL")
    or os.getenv("GEMINI_EMBEDDING_MODEL")
    or DEFAULT_EMBEDDING_MODEL
)


def die(message: str, code: int = 1) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(code)


def log_step(message: str) -> None:
    print(f"[rag_physicthink] {message}", flush=True)


def read_input_text(direct_text: str | None, input_file: str | None, label: str) -> str:
    if direct_text:
        return direct_text.strip()
    if input_file:
        return Path(input_file).read_text(encoding="utf-8").strip()
    if not sys.stdin.isatty():
        return sys.stdin.read().strip()
    die(f"Provide {label} with --{label}, --input-file, or stdin.")
    return ""


def load_or_build_index(
    index_path: Path,
    data_root: Path,
    rebuild: bool,
    *,
    gemini_api_key: str,
    embedding_model: str,
    embedding_base_url: str,
    batch_size: int,
) -> LessonRagIndex:
    if rebuild or not index_path.exists():
        reason = "rebuild requested" if rebuild else "index not found"
        log_step(f"Building index ({reason}) ...")
        index = LessonRagIndex.build(
            data_root=data_root,
            gemini_api_key=gemini_api_key,
            embedding_model=embedding_model,
            embedding_base_url=embedding_base_url,
            batch_size=batch_size,
        )
        index.save(index_path)
        log_step(f"Index saved: {index_path}")
        return index
    try:
        log_step(f"Loading index: {index_path}")
        return LessonRagIndex.load(
            index_path,
            gemini_api_key=gemini_api_key,
            embedding_model=embedding_model,
            embedding_base_url=embedding_base_url,
        )
    except ValueError:
        log_step("Index version mismatch. Rebuilding index ...")
        index = LessonRagIndex.build(
            data_root=data_root,
            gemini_api_key=gemini_api_key,
            embedding_model=embedding_model,
            embedding_base_url=embedding_base_url,
            batch_size=batch_size,
        )
        index.save(index_path)
        log_step(f"Index rebuilt and saved: {index_path}")
        return index


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="RAG pipeline for PhysicsThink (lesson -> graph -> SVG)")
    subparsers = parser.add_subparsers(dest="command", required=True)

    build_index = subparsers.add_parser("build-index", help="Build and save lesson embedding index")
    build_index.add_argument("--data-root", default=str(DEFAULT_DATA_ROOT))
    build_index.add_argument("--index-path", default=str(DEFAULT_INDEX_PATH))
    build_index.add_argument("--gemini-api-key", default=os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"))
    build_index.add_argument("--embedding-model", default=DEFAULT_EMBEDDING_MODEL_NAME)
    build_index.add_argument(
        "--embedding-base-url",
        default=os.getenv("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta"),
    )
    build_index.add_argument("--embedding-batch-size", type=int, default=32)

    retrieve = subparsers.add_parser("retrieve", help="Retrieve top-k similar lessons")
    retrieve.add_argument("--lesson", help="Input lesson text")
    retrieve.add_argument("--input-file", help="File containing lesson text")
    retrieve.add_argument("--top-k", type=int, default=5)
    retrieve.add_argument("--data-root", default=str(DEFAULT_DATA_ROOT))
    retrieve.add_argument("--index-path", default=str(DEFAULT_INDEX_PATH))
    retrieve.add_argument("--rebuild-index", action="store_true")
    retrieve.add_argument("--gemini-api-key", default=os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"))
    retrieve.add_argument("--embedding-model", default=DEFAULT_EMBEDDING_MODEL_NAME)
    retrieve.add_argument(
        "--embedding-base-url",
        default=os.getenv("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta"),
    )
    retrieve.add_argument("--embedding-batch-size", type=int, default=32)

    run = subparsers.add_parser("run", help="Run full pipeline: lesson -> graph -> SVG")
    run.add_argument("--lesson", help="Input lesson text")
    run.add_argument("--input-file", help="File containing lesson text")
    run.add_argument("--graph-out", default="extracted.txt", help="Output graph text file")
    run.add_argument("--svg-out", default="layout.svg", help="Output SVG file")
    run.add_argument("--html-out", help="Optional HTML file that wraps the SVG")
    run.add_argument("--graph-prompt-out", help="Optional debug output for graph prompt")
    run.add_argument("--svg-prompt-out", help="Optional debug output for SVG prompt")
    run.add_argument("--top-k", type=int, default=5)
    run.add_argument("--data-root", default=str(DEFAULT_DATA_ROOT))
    run.add_argument("--index-path", default=str(DEFAULT_INDEX_PATH))
    run.add_argument("--rebuild-index", action="store_true")
    run.add_argument("--graph-model", default=os.getenv("K2THINK_MODEL", "MBZUAI-IFM/K2-Think-v2"))
    run.add_argument("--svg-model", default=os.getenv("K2THINK_MODEL", "MBZUAI-IFM/K2-Think-v2"))
    run.add_argument("--api-key", default=os.getenv("K2THINK_API_KEY"))
    run.add_argument("--gemini-api-key", default=os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"))
    run.add_argument("--embedding-model", default=DEFAULT_EMBEDDING_MODEL_NAME)
    run.add_argument(
        "--embedding-base-url",
        default=os.getenv("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta"),
    )
    run.add_argument("--embedding-batch-size", type=int, default=32)
    run.add_argument("--graph-temperature", type=float, default=0.7)
    run.add_argument("--svg-temperature", type=float, default=0.7)
    run.add_argument("--retries", type=int, default=3)

    return parser


def command_build_index(args: argparse.Namespace) -> None:
    if not args.gemini_api_key:
        die("Missing GEMINI_API_KEY")

    data_root = Path(args.data_root)
    index_path = Path(args.index_path)
    log_step("Starting build-index command")
    log_step(f"Data root: {data_root}")
    log_step(f"Embedding model: {args.embedding_model}")
    index = LessonRagIndex.build(
        data_root=data_root,
        gemini_api_key=args.gemini_api_key,
        embedding_model=args.embedding_model,
        embedding_base_url=args.embedding_base_url,
        batch_size=args.embedding_batch_size,
    )
    log_step("Embedding completed. Saving index file ...")
    index.save(index_path=index_path)
    log_step("build-index completed")
    print(f"Index saved -> {index_path}")
    print(f"Samples: {len(index.samples)}")
    print(f"Embedding model: {index.embedding_model}")
    category_counts: dict[str, int] = {}
    for item in index.samples:
        category = item.sample.category
        category_counts[category] = category_counts.get(category, 0) + 1
    for category in sorted(category_counts):
        print(f"- {category}: {category_counts[category]}")


def command_retrieve(args: argparse.Namespace) -> None:
    if not args.gemini_api_key:
        die("Missing GEMINI_API_KEY")

    lesson_text = read_input_text(args.lesson, args.input_file, label="lesson")
    log_step("Starting retrieve command")
    log_step(f"Query length: {len(lesson_text)} characters")
    data_root = Path(args.data_root)
    index_path = Path(args.index_path)
    index = load_or_build_index(
        index_path=index_path,
        data_root=data_root,
        rebuild=args.rebuild_index,
        gemini_api_key=args.gemini_api_key,
        embedding_model=args.embedding_model,
        embedding_base_url=args.embedding_base_url,
        batch_size=args.embedding_batch_size,
    )

    log_step(f"Running retrieval top_k={args.top_k} ...")
    results = index.retrieve(lesson_text, top_k=args.top_k)
    log_step("retrieve completed")
    for idx, item in enumerate(results, start=1):
        sample = item.sample
        print(
            f"{idx}. score={item.score:.4f} key={sample.key} "
            f"json={sample.paths.lesson_json} graph={sample.paths.graph_txt} svg={sample.paths.svg_file}"
        )


def command_run(args: argparse.Namespace) -> None:
    if not args.api_key:
        die("Missing K2THINK_API_KEY")
    if not args.gemini_api_key:
        die("Missing GEMINI_API_KEY")

    log_step("Step 1/6: Loading lesson input ...")
    lesson_text = read_input_text(args.lesson, args.input_file, label="lesson")
    log_step(f"Lesson loaded ({len(lesson_text)} characters)")

    log_step("Step 2/6: Loading or building retrieval index ...")
    data_root = Path(args.data_root)
    index_path = Path(args.index_path)
    index = load_or_build_index(
        index_path=index_path,
        data_root=data_root,
        rebuild=args.rebuild_index,
        gemini_api_key=args.gemini_api_key,
        embedding_model=args.embedding_model,
        embedding_base_url=args.embedding_base_url,
        batch_size=args.embedding_batch_size,
    )
    log_step(f"Index ready with {len(index.samples)} samples")

    log_step("Step 3/6: Initializing generation clients ...")
    client = K2ThinkClient(
        api_key=args.api_key,
        default_model=args.graph_model,
    )
    pipeline = RagPhysicsThinkPipeline(index, client)

    log_step("Step 4/6: Generating graph text from lesson ...")
    graph_stage = pipeline.generate_graph(
        lesson_text=lesson_text,
        top_k=args.top_k,
        model=args.graph_model,
        temperature=args.graph_temperature,
        retries=args.retries,
    )
    log_step("Graph generation completed")

    log_step("Step 5/6: Generating SVG from graph text ...")
    svg_text, svg_prompt = pipeline.generate_svg(
        graph_text=graph_stage.graph_text,
        retrieved_examples=graph_stage.retrieved_examples,
        model=args.svg_model,
        temperature=args.svg_temperature,
        retries=args.retries,
    )
    log_step("SVG generation completed")

    log_step("Step 6/6: Writing output files ...")

    graph_out = Path(args.graph_out)
    graph_out.parent.mkdir(parents=True, exist_ok=True)
    graph_out.write_text(graph_stage.graph_text.rstrip() + "\n", encoding="utf-8")
    print(f"Saved graph text -> {graph_out}")

    svg_out = Path(args.svg_out)
    svg_out.parent.mkdir(parents=True, exist_ok=True)
    svg_out.write_text(svg_text.rstrip() + "\n", encoding="utf-8")
    print(f"Saved SVG -> {svg_out}")

    if args.html_out:
        html_out = Path(args.html_out)
        html_out.parent.mkdir(parents=True, exist_ok=True)
        html_out.write_text(render_html_with_svg(svg_text), encoding="utf-8")
        print(f"Saved HTML -> {html_out}")

    if args.graph_prompt_out:
        graph_prompt_out = Path(args.graph_prompt_out)
        graph_prompt_out.parent.mkdir(parents=True, exist_ok=True)
        graph_prompt_out.write_text(graph_stage.prompt, encoding="utf-8")
        print(f"Saved graph prompt -> {graph_prompt_out}")

    if args.svg_prompt_out:
        svg_prompt_out = Path(args.svg_prompt_out)
        svg_prompt_out.parent.mkdir(parents=True, exist_ok=True)
        svg_prompt_out.write_text(svg_prompt, encoding="utf-8")
        print(f"Saved SVG prompt -> {svg_prompt_out}")

    log_step("Run completed")
    print("Top retrieved examples:")
    for idx, item in enumerate(graph_stage.retrieved_examples, start=1):
        sample = item.sample
        print(
            f"{idx}. score={item.score:.4f} key={sample.key} "
            f"json={sample.paths.lesson_json} graph={sample.paths.graph_txt} svg={sample.paths.svg_file}"
        )


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "build-index":
        command_build_index(args)
        return
    if args.command == "retrieve":
        command_retrieve(args)
        return
    if args.command == "run":
        command_run(args)
        return

    die(f"Unsupported command: {args.command}")


if __name__ == "__main__":
    main()
