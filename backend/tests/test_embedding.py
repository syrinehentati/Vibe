import pytest
from unittest.mock import MagicMock
from app.services.embedding_service import EmbeddingService


cosine = EmbeddingService.cosine


# ── cosine: pure maths, no mocks ────────────────────────────

def test_identical_vectors_score_one():
    assert cosine([1, 0, 0], [1, 0, 0]) == pytest.approx(1.0)


def test_orthogonal_vectors_score_zero():
    assert cosine([1, 0], [0, 1]) == pytest.approx(0.0)


def test_opposite_vectors_score_minus_one():
    assert cosine([1, 0], [-1, 0]) == pytest.approx(-1.0)


def test_magnitude_does_not_matter():
    # cosine measures direction only
    assert cosine([1, 1], [5, 5]) == pytest.approx(1.0)


def test_zero_vector_returns_zero_not_crash():
    assert cosine([0, 0], [1, 1]) == 0.0
    assert cosine([1, 1], [0, 0]) == 0.0


# ── rank: mock the embedding call ───────────────────────────

@pytest.fixture
def service(monkeypatch):
    monkeypatch.setattr("google.genai.Client", MagicMock())
    return EmbeddingService()


def _fake_embeddings(service, vectors):
    """Make embed() return these vectors: first is the query."""
    service.client.models.embed_content.return_value = MagicMock(
        embeddings=[MagicMock(values=v) for v in vectors]
    )


def test_rank_orders_best_first(service):
    _fake_embeddings(service, [
        [1.0, 0.0],   # query
        [0.0, 1.0],   # candidate 0 — far
        [0.9, 0.1],   # candidate 1 — near
        [0.6, 0.6],   # candidate 2 — middle
    ])
    ranked = service.rank("q", ["a", "b", "c"])
    assert [i for i, _ in ranked] == [1, 2, 0]


def test_rank_respects_top_k(service):
    _fake_embeddings(service, [[1.0, 0.0]] + [[1.0, 0.0]] * 5)
    assert len(service.rank("q", ["a"] * 5, top_k=2)) == 2


def test_rank_batches_query_and_candidates_in_one_call(service):
    _fake_embeddings(service, [[1.0], [1.0], [1.0]])
    service.rank("query", ["a", "b"])
    service.client.models.embed_content.assert_called_once()
    sent = service.client.models.embed_content.call_args.kwargs["contents"]
    assert sent == ["query", "a", "b"]


def test_rank_empty_candidates(service):
    _fake_embeddings(service, [[1.0, 0.0]])
    assert service.rank("q", []) == []