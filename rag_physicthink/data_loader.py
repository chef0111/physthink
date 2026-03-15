from __future__ import annotations

import json
from pathlib import Path

from .models import PhysicsSample, SamplePaths


def _read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace").strip()


def _find_graph_file(json_path: Path) -> Path | None:
    direct = json_path.with_name(f"{json_path.stem}_graph.txt")
    if direct.exists():
        return direct

    candidates = sorted(json_path.parent.glob("*_graph.txt"))
    if not candidates:
        return None
    if len(candidates) == 1:
        return candidates[0]

    for candidate in candidates:
        if json_path.stem in candidate.stem:
            return candidate
    return candidates[0]


def _find_svg_file(json_path: Path) -> Path | None:
    direct = json_path.with_suffix(".svg")
    if direct.exists():
        return direct

    candidates = sorted(json_path.parent.glob("*.svg"))
    if not candidates:
        return None
    if len(candidates) == 1:
        return candidates[0]

    for candidate in candidates:
        if candidate.stem == json_path.stem:
            return candidate
    for candidate in candidates:
        if json_path.stem in candidate.stem:
            return candidate
    return candidates[0]


def _safe_relative(path: Path, base: Path) -> str:
    try:
        return str(path.relative_to(base))
    except ValueError:
        return str(path)


def discover_samples(data_root: Path) -> list[PhysicsSample]:
    if not data_root.exists():
        raise FileNotFoundError(f"Data root does not exist: {data_root}")

    samples: list[PhysicsSample] = []
    json_files = sorted(data_root.rglob("*.json"))
    repo_root = data_root.parent

    for json_path in json_files:
        try:
            payload = json.loads(_read_text(json_path))
        except json.JSONDecodeError:
            continue

        lesson = str(payload.get("lesson", "")).strip()
        if not lesson:
            continue

        graph_file = _find_graph_file(json_path)
        svg_file = _find_svg_file(json_path)
        if graph_file is None or svg_file is None:
            continue

        graph_text = _read_text(graph_file)
        svg_text = _read_text(svg_file)
        if not graph_text or not svg_text:
            continue

        rel = json_path.relative_to(data_root)
        parts = rel.parts
        category = parts[0] if len(parts) >= 2 else "unknown"
        problem_folder = json_path.parent.name
        sample_id = str(payload.get("id", json_path.stem)).strip() or json_path.stem
        key = f"{category}/{sample_id}"

        sample = PhysicsSample(
            key=key,
            category=category,
            problem_folder=problem_folder,
            sample_id=sample_id,
            lesson=lesson,
            graph=graph_text,
            svg=svg_text,
            paths=SamplePaths(
                lesson_json=_safe_relative(json_path, repo_root),
                graph_txt=_safe_relative(graph_file, repo_root),
                svg_file=_safe_relative(svg_file, repo_root),
            ),
        )
        samples.append(sample)

    return samples
