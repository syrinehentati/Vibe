from google import genai
from app.config import settings


class EmbeddingService:
    """Embeds emails and ranks candidates by similarity to a query email."""

    def __init__(self):
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.model = "gemini-embedding-001"

    def embed(self, texts: list[str]) -> list[list[float]]:
        # One batched call — cheaper and faster than per-text calls
        result = self.client.models.embed_content(
            model=self.model,
            contents=texts,
        )
        return [e.values for e in result.embeddings]

    @staticmethod
    def cosine(a: list[float], b: list[float]) -> float:
        dot = sum(x * y for x, y in zip(a, b))
        norm_a = sum(x * x for x in a) ** 0.5
        norm_b = sum(y * y for y in b) ** 0.5
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (norm_a * norm_b)

    def rank(self, query: str, candidates: list[str], top_k: int = 5) -> list[tuple[int, float]]:
        """Returns [(candidate_index, score)] sorted by similarity, best first."""
        vectors = self.embed([query] + candidates)
        query_vec, cand_vecs = vectors[0], vectors[1:]
        scored = [(i, self.cosine(query_vec, v)) for i, v in enumerate(cand_vecs)]
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_k]
