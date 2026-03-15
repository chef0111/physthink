from __future__ import annotations

import re

import requests

from k2think_layout_planner import (
    extract_svg_block,
    strip_reasoning_content as strip_svg_reasoning_content,
    unwrap_nested_content,
)
from test_k2think import strip_reasoning_content as strip_graph_reasoning_content

K2THINK_URL = "https://api.k2think.ai/v1/chat/completions"
GRAPH_PREFIXES = {
    "TOPIC",
    "PERSON",
    "OBJECT",
    "EVENT",
    "QUANTITY",
    "RELATION",
    "ASSUMPTION",
    "QUESTION_TARGET",
}


def _has_svg_root_constraints(svg_text: str) -> tuple[bool, str]:
    root_match = re.search(r"<svg\b[^>]*>", svg_text, flags=re.IGNORECASE)
    if not root_match:
        return False, "Missing <svg ...> root tag"

    root_tag = root_match.group(0)
    checks = [
        (r'width\s*=\s*["\']600["\']', 'Missing root width="600"'),
        (r'height\s*=\s*["\']600["\']', 'Missing root height="600"'),
        (r'viewBox\s*=\s*["\']0\s+0\s+600\s+600["\']', 'Missing root viewBox="0 0 600 600"'),
    ]
    for pattern, message in checks:
        if re.search(pattern, root_tag, flags=re.IGNORECASE) is None:
            return False, message
    return True, ""


def _has_graph_line_constraints(graph_text: str) -> tuple[bool, str]:
    lower = graph_text.lower()
    if "<think>" in lower or "</think>" in lower:
        return False, "Output contains <think> tags"
    if "```" in graph_text:
        return False, "Output contains markdown code fence"

    lines = [line.strip() for line in graph_text.splitlines() if line.strip()]
    if not lines:
        return False, "Empty graph output"

    for line in lines:
        if ":" not in line:
            return False, f"Line does not contain PREFIX:: {line}"
        prefix = line.split(":", 1)[0].strip().upper()
        if prefix not in GRAPH_PREFIXES:
            return False, f"Invalid prefix '{prefix}'"
    return True, ""


class K2ThinkClient:
    def __init__(
        self,
        api_key: str,
        default_model: str = "MBZUAI-IFM/K2-Think-v2",
        timeout_seconds: int = 180,
    ) -> None:
        if not api_key:
            raise ValueError("Missing K2Think API key.")
        self.api_key = api_key
        self.default_model = default_model
        self.timeout_seconds = timeout_seconds

    def _post_chat_completion(
        self,
        prompt: str,
        model: str,
        temperature: float,
    ) -> str:
        headers = {
            "accept": "application/json",
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "stream": False,
            "temperature": temperature,
        }
        response = requests.post(
            K2THINK_URL,
            headers=headers,
            json=payload,
            timeout=self.timeout_seconds,
        )
        if not (200 <= response.status_code < 300):
            raise RuntimeError(f"HTTP {response.status_code} at {K2THINK_URL}\n{response.text}")

        data = response.json()
        return str(data.get("choices", [{}])[0].get("message", {}).get("content", ""))

    def generate_graph_text(
        self,
        prompt: str,
        model: str | None = None,
        temperature: float = 0.7,
        retries: int = 3,
    ) -> str:
        model_name = model or self.default_model
        last_error = "Unknown error"
        for _ in range(max(1, retries)):
            try:
                content = self._post_chat_completion(
                    prompt=prompt,
                    model=model_name,
                    temperature=temperature,
                )
            except requests.RequestException as exc:
                last_error = f"Network error: {exc}"
                continue
            except RuntimeError as exc:
                last_error = str(exc)
                continue

            cleaned = strip_graph_reasoning_content(content).strip()
            if cleaned:
                valid, reason = _has_graph_line_constraints(cleaned)
                if valid:
                    return cleaned
                last_error = f"Model returned graph text but violated constraints: {reason}"
                continue
            last_error = "Empty graph output from model"

        raise RuntimeError(f"Failed to generate graph text after retries: {last_error}")

    def generate_svg_text(
        self,
        prompt: str,
        model: str | None = None,
        temperature: float = 0.7,
        retries: int = 3,
    ) -> str:
        model_name = model or self.default_model
        last_error = "Unknown error"
        for _ in range(max(1, retries)):
            try:
                content = self._post_chat_completion(
                    prompt=prompt,
                    model=model_name,
                    temperature=temperature,
                )
            except requests.RequestException as exc:
                last_error = f"Network error: {exc}"
                continue
            except RuntimeError as exc:
                last_error = str(exc)
                continue

            content = unwrap_nested_content(content)
            cleaned = extract_svg_block(strip_svg_reasoning_content(content)).strip()
            if "<svg" in cleaned.lower() and "</svg>" in cleaned.lower():
                valid, reason = _has_svg_root_constraints(cleaned)
                if valid:
                    return cleaned
                last_error = f"Model returned SVG but violated root constraints: {reason}"
                continue
            last_error = "Model did not return a valid <svg>...</svg> block"

        raise RuntimeError(f"Failed to generate SVG after retries: {last_error}")
