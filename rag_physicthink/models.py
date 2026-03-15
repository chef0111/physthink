from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class SamplePaths:
    lesson_json: str
    graph_txt: str
    svg_file: str

    def to_dict(self) -> dict[str, str]:
        return {
            "lesson_json": self.lesson_json,
            "graph_txt": self.graph_txt,
            "svg_file": self.svg_file,
        }

    @classmethod
    def from_dict(cls, payload: dict[str, str]) -> "SamplePaths":
        return cls(
            lesson_json=payload["lesson_json"],
            graph_txt=payload["graph_txt"],
            svg_file=payload["svg_file"],
        )


@dataclass(frozen=True)
class PhysicsSample:
    key: str
    category: str
    problem_folder: str
    sample_id: str
    lesson: str
    graph: str
    svg: str
    paths: SamplePaths

    def to_dict(self) -> dict[str, object]:
        return {
            "key": self.key,
            "category": self.category,
            "problem_folder": self.problem_folder,
            "sample_id": self.sample_id,
            "lesson": self.lesson,
            "graph": self.graph,
            "svg": self.svg,
            "paths": self.paths.to_dict(),
        }

    @classmethod
    def from_dict(cls, payload: dict[str, object]) -> "PhysicsSample":
        return cls(
            key=str(payload["key"]),
            category=str(payload["category"]),
            problem_folder=str(payload["problem_folder"]),
            sample_id=str(payload["sample_id"]),
            lesson=str(payload["lesson"]),
            graph=str(payload["graph"]),
            svg=str(payload["svg"]),
            paths=SamplePaths.from_dict(dict(payload["paths"])),
        )


@dataclass(frozen=True)
class RetrievedSample:
    sample: PhysicsSample
    score: float
