from __future__ import annotations

from dataclasses import dataclass

from .index_store import LessonRagIndex
from .k2think_client import K2ThinkClient
from .models import RetrievedSample
from .prompt_builder import build_graph_prompt_with_fewshot, build_svg_prompt_with_fewshot


@dataclass(frozen=True)
class GraphStageResult:
    graph_text: str
    retrieved_examples: list[RetrievedSample]
    prompt: str


@dataclass(frozen=True)
class FullPipelineResult:
    lesson_text: str
    graph_text: str
    svg_text: str
    retrieved_examples: list[RetrievedSample]
    graph_prompt: str
    svg_prompt: str


class RagPhysicsThinkPipeline:
    def __init__(self, rag_index: LessonRagIndex, k2_client: K2ThinkClient) -> None:
        self.rag_index = rag_index
        self.k2_client = k2_client

    def generate_graph(
        self,
        lesson_text: str,
        top_k: int = 5,
        model: str | None = None,
        temperature: float = 1.0,
        retries: int = 3,
    ) -> GraphStageResult:
        retrieved = self.rag_index.retrieve(lesson_text, top_k=top_k)
        prompt = build_graph_prompt_with_fewshot(lesson_text, retrieved)
        graph_text = self.k2_client.generate_graph_text(
            prompt=prompt,
            model=model,
            temperature=temperature,
            retries=retries,
        )
        return GraphStageResult(
            graph_text=graph_text,
            retrieved_examples=retrieved,
            prompt=prompt,
        )

    def generate_svg(
        self,
        graph_text: str,
        retrieved_examples: list[RetrievedSample],
        model: str | None = None,
        temperature: float = 0.7,
        retries: int = 3,
    ) -> tuple[str, str]:
        prompt = build_svg_prompt_with_fewshot(graph_text, retrieved_examples)
        svg_text = self.k2_client.generate_svg_text(
            prompt=prompt,
            model=model,
            temperature=temperature,
            retries=retries,
        )
        return svg_text, prompt

    def run(
        self,
        lesson_text: str,
        top_k: int = 5,
        graph_model: str | None = None,
        svg_model: str | None = None,
        graph_temperature: float = 1,
        svg_temperature: float = 1,
        retries: int = 3,
    ) -> FullPipelineResult:
        graph_stage = self.generate_graph(
            lesson_text=lesson_text,
            top_k=top_k,
            model=graph_model,
            temperature=graph_temperature,
            retries=retries,
        )

        svg_text, svg_prompt = self.generate_svg(
            graph_text=graph_stage.graph_text,
            retrieved_examples=graph_stage.retrieved_examples,
            model=svg_model,
            temperature=svg_temperature,
            retries=retries,
        )

        return FullPipelineResult(
            lesson_text=lesson_text,
            graph_text=graph_stage.graph_text,
            svg_text=svg_text,
            retrieved_examples=graph_stage.retrieved_examples,
            graph_prompt=graph_stage.prompt,
            svg_prompt=svg_prompt,
        )
