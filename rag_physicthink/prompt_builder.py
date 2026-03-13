from __future__ import annotations

from typing import Iterable

from k2think_layout_planner import build_svg_prompt as base_svg_prompt
from test_k2think import build_prompt as base_graph_prompt

from .models import RetrievedSample

_GRAPH_SENTINEL = "__TARGET_LESSON__"
_SVG_SENTINEL = "__TARGET_EXTRACTED_GRAPH__"

GRAPH_STRICT_REQUIREMENTS_BLOCK = """Read the physics lesson below and extract the important information.

Do not solve the problem.
Do not return JSON.
Do not return markdown.
Do not include <think> tags.
Do not include reasoning.
Print plain text only.
Print one fact per line.

Use exactly these line prefixes when relevant:
TOPIC: ...
PERSON: ...
OBJECT: ...
EVENT: ...
QUANTITY: ...
RELATION: ...
ASSUMPTION: ...
QUESTION_TARGET: ...

Output format (graph-friendly, strict):
- After PREFIX:, print key=value pairs separated by " | " (space-pipe-space).
- Use only ASCII for keys (id, label, kind, verb, source, rel, target, unit, value, symbol, ...).
- IDs must be snake_case and stable (normalize from the lesson text).
- Do not invent missing info; omit fields that are not explicitly present.
- Keep values short. Prefer commas for lists: participants=a,b,c.

Normalization rules (important):
- EVENT.verb MUST be a base-form lemma in snake_case (NOT past tense/participle).
  Examples: apply_force, throw, collide, move_together, slip, rest, slide, roll, fall.
  Bad: applied, thrown, colliding.
- For "maximum value of X such that CONDITION ...", create an EVENT node for the CONDITION and link the maximum quantity to that EVENT
  (do NOT link Fmax -> F directly).

Required fields by line type:
- TOPIC: label=...
- PERSON: id=... | label=...
- OBJECT: id=... | label=... | kind=...
- EVENT: id=... | verb=... | label=...
- QUANTITY: id=... | symbol=... | unit=...
- RELATION: source=... | rel=... | target=...
- ASSUMPTION: text=...
- QUESTION_TARGET: label=... | target_symbol=...

Redundancy rules:
- Do not output implied duplicates.
- Use consistent IDs across lines."""

SVG_STRICT_REQUIREMENTS_BLOCK = """You are a physics diagram renderer.

Input is line-based extracted physics knowledge (TOPIC/OBJECT/EVENT/QUANTITY/RELATION...).
Draw ONE clear 2D illustration as SVG only.

Hard requirements:
1) Output must be valid XML SVG only, no markdown, no code fence, no explanation.
2) Root must be: <svg ... width="600" height="600" viewBox="0 0 600 600" ...>.
3) White/light background.
4) Draw objects/surfaces/blocks as simple shapes (rect/circle/line/polygon) with labels.
5) Draw arrows for actions/forces/relations when relevant; add short text labels near arrows.
6) If relation is an action/interation, the label should use base-form verb style in snake_case when possible.
7) Include quantity labels (m, F, mu, g, etc.) near relevant objects if available.
8) Keep the figure readable and uncluttered; prefer left-to-right force/motion direction when unclear.
9) Use only standard SVG elements and inline styles; no external CSS/JS.
10) Ensure the SVG is self-contained and closes with </svg>.
11) Do not include any <think>...</think> content from the input; only draw based on the extracted facts.
12) Do not attempt to solve for unknowns; just illustrate the given information.
13) Output only the SVG content, no explanations or extra text."""

SVG_ANTI_DUPLICATION_BLOCK = """Anti-duplication rules (very important):
1) Do NOT draw duplicate labels for the same quantity/force.
2) For each quantity symbol (F, N, T, f, m, g, mu, ...), render one primary label per target object/arrow only.
3) If numeric value exists, merge into one label (example: "F = 21 N"), do NOT also print a separate standalone "F".
4) Avoid repeated identical <text> labels unless they refer to clearly different objects; if needed, disambiguate (example: F_on_upper, F_on_lower).
5) Keep only one visual annotation for each arrow: either the symbol or the full value expression, not both repeated."""

SVG_SEMANTIC_GROUNDING_BLOCK = """Semantic grounding from examples (critical):
1) Learn the scene pattern from the most similar examples first (Example 1, then Example 2).
2) Infer semantics from target Extracted text, then map each item to visuals:
   - Each OBJECT -> one visible shape + one clear label.
   - Each key EVENT/RELATION -> one relevant arrow/connection + short label.
   - Each important QUANTITY -> one nearby annotation on the correct target.
3) Reuse layout style from examples, but do NOT copy unrelated objects, arrows, or labels.
4) Preserve target meaning over style: if target semantics differ from examples, follow the target.
5) Prioritize physically meaningful arrangement and readability over decorative detail."""


def _extract_graph_instruction_block() -> str:
    template = base_graph_prompt(_GRAPH_SENTINEL)
    marker = f"Lesson:\n{_GRAPH_SENTINEL}"
    if marker in template:
        return template.split(marker, 1)[0].rstrip()
    if "Lesson:\n" in template:
        return template.rsplit("Lesson:\n", 1)[0].rstrip()
    return template.rstrip()


def _extract_svg_instruction_block() -> str:
    template = base_svg_prompt(_SVG_SENTINEL)
    if "Example 1:" in template:
        return template.split("Example 1:", 1)[0].rstrip()
    marker = f"Extracted text:\n{_SVG_SENTINEL}"
    if marker in template:
        return template.split(marker, 1)[0].rstrip()
    if "Extracted text:\n" in template:
        return template.rsplit("Extracted text:\n", 1)[0].rstrip()
    return template.rstrip()


GRAPH_INSTRUCTION_BLOCK = _extract_graph_instruction_block()
SVG_INSTRUCTION_BLOCK = _extract_svg_instruction_block()


def _iter_examples(examples: Iterable[RetrievedSample]) -> list[RetrievedSample]:
    return list(examples)


def build_graph_prompt_with_fewshot(target_lesson: str, examples: Iterable[RetrievedSample]) -> str:
    shots = _iter_examples(examples)
    sections = [
        GRAPH_STRICT_REQUIREMENTS_BLOCK,
        GRAPH_INSTRUCTION_BLOCK,
        "Few-shot examples (lesson -> extracted graph text). Follow the same style and prefixes.",
    ]
    for idx, example in enumerate(shots, start=1):
        sections.append(
            "\n".join(
                [
                    f"Example {idx}:",
                    "Lesson:",
                    example.sample.lesson.strip(),
                    "Output:",
                    example.sample.graph.strip(),
                ]
            )
        )
    sections.append(
        "\n".join(
            [
                "Now process the new lesson.",
                "Lesson:",
                target_lesson.strip(),
                "Output:",
            ]
        )
    )
    return "\n\n".join(sections).strip() + "\n"


def build_svg_prompt_with_fewshot(target_graph: str, examples: Iterable[RetrievedSample]) -> str:
    shots = _iter_examples(examples)
    sections = [
        SVG_STRICT_REQUIREMENTS_BLOCK,
        SVG_ANTI_DUPLICATION_BLOCK,
        SVG_SEMANTIC_GROUNDING_BLOCK,
        SVG_INSTRUCTION_BLOCK,
        "Few-shot examples (extracted graph text -> SVG). Match relation labels and object mappings.",
        "Examples:",
    ]
    for idx, example in enumerate(shots, start=1):
        sections.append(
            "\n".join(
                [
                    f"Example {idx}:",
                    f"Similarity: {example.score:.4f}",
                    f"Source key: {example.sample.key}",
                    "Extracted text:",
                    example.sample.graph.strip(),
                    "Output:",
                    example.sample.svg.strip(),
                ]
            )
        )
    sections.append(
        "\n".join(
            [
                "Now draw the new diagram.",
                "Remember: avoid duplicate force labels (especially repeated F).",
                "Extracted text:",
                target_graph.strip(),
                "Output:",
            ]
        )
    )
    return "\n\n".join(sections).strip() + "\n"
