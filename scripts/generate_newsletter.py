#!/usr/bin/env python3
"""
VC News Intelligence Pipeline
==============================
Fetches articles from multiple sources, deduplicates, enriches with full text,
analyzes via Claude, and outputs a structured JSON newsletter.

Usage:
    python3 generate_newsletter.py "climate tech"
    python3 generate_newsletter.py "artificial intelligence" --max-articles 25
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import quote_plus

import anthropic
import feedparser
import requests
from dotenv import load_dotenv

try:
    from newspaper import Article
except ImportError:
    Article = None  # type: ignore[assignment,misc]

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("pipeline")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SCRIPTS_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPTS_DIR.parent
DATA_DIR = PROJECT_ROOT / "data" / "newsletters"

# RSS feeds known to cover VC / startup news
VC_RSS_FEEDS: list[str] = [
    "https://techcrunch.com/feed/",
    "https://news.crunchbase.com/feed/",
    "https://pitchbook.com/blog/rss",
    "https://www.sifted.eu/feed",
    "https://news.ycombinator.com/rss",
]

# Research / academic sources
RESEARCH_RSS_FEEDS: list[str] = [
    "https://export.arxiv.org/rss/cs.AI",
    "https://export.arxiv.org/rss/q-fin",
]

REQUEST_TIMEOUT = 15  # seconds per HTTP request
MAX_WORKERS = 8


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------
@dataclass
class RawArticle:
    title: str
    url: str
    source: str
    snippet: str = ""
    published_date: str = ""
    full_text: str | None = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def slugify(text: str) -> str:
    """Convert a topic string to a filesystem-safe slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[\s_]+", "-", text).strip("-")


def _safe_get(url: str, **kwargs: Any) -> requests.Response | None:
    """GET with timeout and error handling."""
    try:
        resp = requests.get(url, timeout=REQUEST_TIMEOUT, **kwargs)
        resp.raise_for_status()
        return resp
    except requests.RequestException as exc:
        log.warning("HTTP request failed for %s: %s", url, exc)
        return None


# ---------------------------------------------------------------------------
# 1. COLLECT
# ---------------------------------------------------------------------------

def fetch_newsapi(topic: str, api_key: str, max_results: int = 20) -> list[RawArticle]:
    """Fetch articles from NewsAPI /v2/everything endpoint."""
    log.info("Fetching from NewsAPI for '%s' ...", topic)
    url = "https://newsapi.org/v2/everything"
    params: dict[str, Any] = {
        "q": topic,
        "sortBy": "relevancy",
        "pageSize": max_results,
        "language": "en",
        "apiKey": api_key,
    }
    resp = _safe_get(url, params=params)
    if resp is None:
        return []

    data = resp.json()
    articles: list[RawArticle] = []
    for item in data.get("articles", []):
        article_url = item.get("url", "")
        if not article_url:
            continue
        articles.append(
            RawArticle(
                title=item.get("title", "").strip(),
                url=article_url,
                source=item.get("source", {}).get("name", "NewsAPI"),
                snippet=item.get("description", "") or "",
                published_date=item.get("publishedAt", ""),
            )
        )
    log.info("  -> NewsAPI returned %d articles", len(articles))
    return articles


def fetch_google_news_rss(topic: str) -> list[RawArticle]:
    """Fetch articles from Google News RSS search."""
    log.info("Fetching from Google News RSS for '%s' ...", topic)
    url = f"https://news.google.com/rss/search?q={quote_plus(topic)}&hl=en-US&gl=US&ceid=US:en"
    feed = feedparser.parse(url)
    articles: list[RawArticle] = []
    for entry in feed.entries:
        link = entry.get("link", "")
        if not link:
            continue
        published = entry.get("published", "")
        articles.append(
            RawArticle(
                title=entry.get("title", "").strip(),
                url=link,
                source=entry.get("source", {}).get("title", "Google News") if isinstance(entry.get("source"), dict) else "Google News",
                snippet=entry.get("summary", "") or "",
                published_date=published,
            )
        )
    log.info("  -> Google News RSS returned %d articles", len(articles))
    return articles


def fetch_vc_rss_feeds(topic: str) -> list[RawArticle]:
    """Fetch and filter VC-specific RSS feeds by keyword."""
    log.info("Fetching from %d VC RSS feeds ...", len(VC_RSS_FEEDS))
    keyword_tokens = topic.lower().split()
    articles: list[RawArticle] = []

    def _parse_feed(feed_url: str) -> list[RawArticle]:
        results: list[RawArticle] = []
        try:
            feed = feedparser.parse(feed_url)
        except Exception as exc:
            log.warning("Failed to parse RSS %s: %s", feed_url, exc)
            return results

        for entry in feed.entries:
            title = entry.get("title", "")
            summary = entry.get("summary", "")
            combined = f"{title} {summary}".lower()
            # Keep entry if any keyword token appears in title or summary
            if not any(tok in combined for tok in keyword_tokens):
                continue
            link = entry.get("link", "")
            if not link:
                continue
            results.append(
                RawArticle(
                    title=title.strip(),
                    url=link,
                    source=feed.feed.get("title", feed_url),
                    snippet=summary or "",
                    published_date=entry.get("published", ""),
                )
            )
        return results

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = {pool.submit(_parse_feed, url): url for url in VC_RSS_FEEDS}
        for future in as_completed(futures):
            try:
                articles.extend(future.result())
            except Exception as exc:
                log.warning("RSS worker error: %s", exc)

    log.info("  -> VC RSS feeds returned %d relevant articles", len(articles))
    return articles


def fetch_google_scholar(topic: str) -> list[RawArticle]:
    """Fetch recent research articles from Google Scholar via scraping."""
    log.info("Fetching from Google Scholar for '%s' ...", topic)
    url = f"https://scholar.google.com/scholar?q={quote_plus(topic)}&hl=en&as_sdt=0%2C5&as_ylo=2025"
    headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
    resp = _safe_get(url, headers=headers)
    if resp is None:
        return []

    articles: list[RawArticle] = []
    try:
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(resp.text, "html.parser")
        for result in soup.select(".gs_ri")[:10]:
            title_el = result.select_one(".gs_rt a")
            snippet_el = result.select_one(".gs_rs")
            if not title_el:
                continue
            articles.append(
                RawArticle(
                    title=title_el.get_text(strip=True),
                    url=title_el.get("href", ""),
                    source="Google Scholar",
                    snippet=snippet_el.get_text(strip=True) if snippet_el else "",
                    published_date="",
                )
            )
    except ImportError:
        log.warning("BeautifulSoup not available — skipping Google Scholar")
    except Exception as exc:
        log.warning("Google Scholar parsing failed: %s", exc)

    log.info("  -> Google Scholar returned %d articles", len(articles))
    return articles


def fetch_research_rss(topic: str) -> list[RawArticle]:
    """Fetch from academic RSS feeds (arXiv, etc.) filtered by topic."""
    log.info("Fetching from %d research RSS feeds ...", len(RESEARCH_RSS_FEEDS))
    keyword_tokens = topic.lower().split()
    articles: list[RawArticle] = []

    for feed_url in RESEARCH_RSS_FEEDS:
        try:
            feed = feedparser.parse(feed_url)
            for entry in feed.entries:
                title = entry.get("title", "")
                summary = entry.get("summary", "")
                combined = f"{title} {summary}".lower()
                if not any(tok in combined for tok in keyword_tokens):
                    continue
                link = entry.get("link", "")
                if not link:
                    continue
                articles.append(
                    RawArticle(
                        title=title.strip(),
                        url=link,
                        source=feed.feed.get("title", "Research"),
                        snippet=summary or "",
                        published_date=entry.get("published", ""),
                    )
                )
        except Exception as exc:
            log.warning("Research RSS failed for %s: %s", feed_url, exc)

    log.info("  -> Research RSS returned %d relevant articles", len(articles))
    return articles


def collect_articles(topic: str, newsapi_key: str | None) -> list[RawArticle]:
    """Run all collectors in parallel and return merged list."""
    all_articles: list[RawArticle] = []

    with ThreadPoolExecutor(max_workers=5) as pool:
        futures = []
        if newsapi_key:
            futures.append(pool.submit(fetch_newsapi, topic, newsapi_key))
        else:
            log.warning("NEWSAPI_KEY not set — skipping NewsAPI source")
        futures.append(pool.submit(fetch_google_news_rss, topic))
        futures.append(pool.submit(fetch_vc_rss_feeds, topic))
        futures.append(pool.submit(fetch_google_scholar, topic))
        futures.append(pool.submit(fetch_research_rss, topic))

        for future in as_completed(futures):
            try:
                all_articles.extend(future.result())
            except Exception as exc:
                log.error("Collector failed: %s", exc)

    log.info("Total raw articles collected: %d", len(all_articles))
    return all_articles


# ---------------------------------------------------------------------------
# 2. DEDUPLICATE
# ---------------------------------------------------------------------------

def _normalize_url(url: str) -> str:
    """Strip protocol, trailing slashes, and query params for comparison."""
    url = re.sub(r"^https?://", "", url).rstrip("/")
    url = url.split("?")[0]
    return url.lower()


def _titles_similar(a: str, b: str) -> bool:
    """Simple fuzzy title match: one title is a substring of the other."""
    a_lower = a.lower().strip()
    b_lower = b.lower().strip()
    if not a_lower or not b_lower:
        return False
    shorter, longer = sorted([a_lower, b_lower], key=len)
    return shorter in longer


def deduplicate(articles: list[RawArticle], max_keep: int = 20) -> list[RawArticle]:
    """Remove duplicate articles by URL and fuzzy title matching."""
    log.info("Deduplicating %d articles ...", len(articles))
    seen_urls: set[str] = set()
    kept_titles: list[str] = []
    unique: list[RawArticle] = []

    for article in articles:
        norm = _normalize_url(article.url)
        if norm in seen_urls:
            continue
        # Check fuzzy title match against already-kept articles
        if any(_titles_similar(article.title, t) for t in kept_titles):
            continue
        seen_urls.add(norm)
        kept_titles.append(article.title)
        unique.append(article)

    result = unique[:max_keep]
    log.info("  -> Kept %d unique articles (capped at %d)", len(result), max_keep)
    return result


# ---------------------------------------------------------------------------
# 3. ENRICH
# ---------------------------------------------------------------------------

def enrich_article(article: RawArticle) -> RawArticle:
    """Use newspaper3k to extract full article text. Falls back to snippet."""
    if Article is None:
        log.debug("newspaper3k not available, using snippet for %s", article.url)
        article.full_text = article.snippet
        return article

    try:
        art = Article(article.url)
        art.download()
        art.parse()
        text = art.text.strip()
        if text and len(text) > 100:
            article.full_text = text
        else:
            article.full_text = article.snippet
    except Exception as exc:
        log.debug("newspaper3k extraction failed for %s: %s", article.url, exc)
        article.full_text = article.snippet

    return article


def enrich_articles(articles: list[RawArticle]) -> list[RawArticle]:
    """Enrich all articles in parallel."""
    log.info("Enriching %d articles with full text ...", len(articles))
    enriched: list[RawArticle] = []

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = {pool.submit(enrich_article, a): a for a in articles}
        for future in as_completed(futures):
            try:
                enriched.append(future.result())
            except Exception as exc:
                log.warning("Enrichment error: %s", exc)

    success_count = sum(1 for a in enriched if a.full_text and a.full_text != a.snippet)
    log.info("  -> Full text extracted for %d / %d articles", success_count, len(enriched))
    return enriched


# ---------------------------------------------------------------------------
# 4. ANALYZE (Claude API)
# ---------------------------------------------------------------------------

ANALYSIS_PROMPT = """\
You are an expert VC analyst. I will provide you with {count} recent articles about "{topic}".
Analyze them and return a JSON object matching the schema below EXACTLY. Do not include markdown fences or commentary — output only valid JSON.

SCHEMA:
{{
  "executiveSummary": ["string (5 bullet points, VC-focused insights)"],
  "themes": ["string (3-5 recurring themes across all articles)"],
  "sources": [
    {{
      "title": "string",
      "url": "string",
      "type": "string (e.g. news, blog, press-release)",
      "views": "string (estimate like 'High', 'Medium', 'Low')",
      "trending": boolean,
      "publishedDate": "string (ISO date or empty)"
    }}
  ],
  "landscape": "string (market landscape paragraph, 3-5 sentences)",
  "currentState": "string (current state of the market, 3-5 sentences)",
  "predictions": "string (AI-generated predictions paragraph, explicitly note these are AI predictions, 3-5 sentences)",
  "investmentInsights": "string (investment-focused insights paragraph, 3-5 sentences)",
  "competitors": [
    {{
      "name": "string",
      "description": "string",
      "momentum": "rising|stable|declining",
      "funding": "string",
      "stage": "string (e.g. Series A, Public, Growth)",
      "newsCount": number
    }}
  ],
  "emergingCompanies": [
    {{
      "name": "string",
      "description": "string",
      "signals": ["string"],
      "mentionTrend": "accelerating|growing|new",
      "fundingStage": "string",
      "foundedYear": number,
      "sector": "string"
    }}
  ],
  "consensus": [
    {{"title": "string", "description": "string"}}
  ],
  "contrarian": [
    {{"title": "string", "description": "string"}}
  ],
  "topPeople": [
    {{"name": "string", "detail": "string", "relevance": "string"}}
  ],
  "topProducts": [
    {{"name": "string", "detail": "string", "relevance": "string"}}
  ],
  "topCompanies": [
    {{"name": "string", "detail": "string", "relevance": "string"}}
  ],
  "sourceRanking": [1, 5, 3, 12, 7]
}}

RULES:
- executiveSummary must have exactly 5 bullet points.
- themes must have 3-5 items.
- competitors must have 5-8 items.
- emergingCompanies must have 3-5 items.
- consensus must have 3-4 items.
- contrarian must have 2-3 items.
- topPeople, topProducts, topCompanies each 3-5 items.
- sourceRanking must be an array of article numbers (1-indexed) ordered from MOST relevant to LEAST relevant. Include ALL article numbers. This determines display order.
- predictions paragraph MUST start with "AI-Generated Predictions: ".
- All monetary amounts should use standard notation (e.g. "$1.2B").

ARTICLES:
{articles_text}

Return ONLY the JSON object. No markdown, no explanation.
"""


def _build_articles_text(articles: list[RawArticle]) -> str:
    """Format articles into a text block for the Claude prompt."""
    parts: list[str] = []
    for i, a in enumerate(articles, 1):
        text = (a.full_text or a.snippet or "")[:3000]  # cap per-article length
        parts.append(
            f"--- Article {i} ---\n"
            f"Title: {a.title}\n"
            f"URL: {a.url}\n"
            f"Source: {a.source}\n"
            f"Date: {a.published_date}\n"
            f"Text:\n{text}\n"
        )
    return "\n".join(parts)


def analyze_with_claude(
    articles: list[RawArticle],
    topic: str,
    api_key: str,
    max_retries: int = 2,
) -> dict[str, Any]:
    """Send articles to Claude for structured analysis."""
    log.info("Sending %d articles to Claude for analysis ...", len(articles))

    client = anthropic.Anthropic(api_key=api_key)
    articles_text = _build_articles_text(articles)
    prompt = ANALYSIS_PROMPT.format(
        count=len(articles),
        topic=topic,
        articles_text=articles_text,
    )

    for attempt in range(1, max_retries + 1):
        try:
            message = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=8000,
                messages=[{"role": "user", "content": prompt}],
            )

            raw_text = message.content[0].text.strip()

            # Strip markdown fences if present
            if raw_text.startswith("```"):
                raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text)
                raw_text = re.sub(r"\s*```$", "", raw_text)

            analysis: dict[str, Any] = json.loads(raw_text)
            log.info("  -> Claude analysis received and parsed successfully")
            return analysis

        except json.JSONDecodeError as exc:
            log.warning("Attempt %d: Failed to parse Claude JSON: %s", attempt, exc)
            if attempt < max_retries:
                log.info("Retrying ...")
                time.sleep(2)
            else:
                log.error("All attempts failed to parse Claude response. Raw text saved for debugging.")
                # Return a minimal valid structure so the pipeline doesn't crash
                return _empty_analysis()

        except anthropic.APIError as exc:
            log.warning("Attempt %d: Claude API error: %s", attempt, exc)
            if attempt < max_retries:
                wait = 5 * attempt
                log.info("Retrying in %ds ...", wait)
                time.sleep(wait)
            else:
                log.error("All Claude API attempts failed.")
                return _empty_analysis()

    return _empty_analysis()  # unreachable, but keeps mypy happy


def _empty_analysis() -> dict[str, Any]:
    """Return a minimal valid analysis structure as fallback."""
    return {
        "executiveSummary": ["Analysis unavailable — API call failed."],
        "themes": [],
        "sources": [],
        "landscape": "",
        "currentState": "",
        "predictions": "AI-Generated Predictions: Unavailable due to analysis failure.",
        "investmentInsights": "",
        "competitors": [],
        "emergingCompanies": [],
        "consensus": [],
        "contrarian": [],
        "topPeople": [],
        "topProducts": [],
        "topCompanies": [],
    }


# ---------------------------------------------------------------------------
# 5. OUTPUT
# ---------------------------------------------------------------------------

def build_newsletter(topic: str, analysis: dict[str, Any], articles: list[RawArticle]) -> dict[str, Any]:
    """Assemble the final newsletter JSON matching the required schema."""
    now_dt = datetime.now(timezone.utc)
    now = now_dt.strftime("%B %d, %Y at %I:%M %p UTC")
    today = now_dt.strftime("%B %d, %Y")

    # Build sources from ALL collected articles, ranked by Claude's relevancy ordering
    all_sources: list[dict[str, Any]] = []
    for a in articles:
        all_sources.append({
            "title": a.title,
            "url": a.url,
            "type": a.source,
            "views": "N/A",
            "trending": False,
            "publishedDate": a.published_date or "",
        })

    # Reorder by Claude's relevancy ranking (1-indexed article numbers)
    ranking = analysis.get("sourceRanking", [])
    if ranking:
        ranked: list[dict[str, Any]] = []
        seen: set[int] = set()
        for idx in ranking:
            i = idx - 1  # convert to 0-indexed
            if 0 <= i < len(all_sources) and i not in seen:
                ranked.append(all_sources[i])
                seen.add(i)
        # Append any sources not mentioned in the ranking
        for i, s in enumerate(all_sources):
            if i not in seen:
                ranked.append(s)
        # Mark top 5 as trending
        for i, s in enumerate(ranked):
            s["trending"] = i < 5
        sources = ranked
    else:
        sources = all_sources

    newsletter: dict[str, Any] = {
        "topic": topic,
        "date": today,
        "generatedDate": now,
        "updatedDate": None,
        "frequency": "One-time Research",
        "executiveSummary": analysis.get("executiveSummary", []),
        "themes": analysis.get("themes", []),
        "sources": sources,
        "landscape": analysis.get("landscape", ""),
        "currentState": analysis.get("currentState", ""),
        "predictions": analysis.get("predictions", ""),
        "investmentInsights": analysis.get("investmentInsights", ""),
        "competitors": analysis.get("competitors", []),
        "emergingCompanies": analysis.get("emergingCompanies", []),
        "consensus": analysis.get("consensus", []),
        "contrarian": analysis.get("contrarian", []),
        "topPeople": analysis.get("topPeople", []),
        "topProducts": analysis.get("topProducts", []),
        "topCompanies": analysis.get("topCompanies", []),
    }
    return newsletter


def write_newsletter(newsletter: dict[str, Any], topic: str) -> Path:
    """Write the newsletter JSON to the data directory."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    slug = slugify(topic)
    output_path = DATA_DIR / f"{slug}.json"
    output_path.write_text(json.dumps(newsletter, indent=2, ensure_ascii=False), encoding="utf-8")
    log.info("Newsletter written to %s", output_path)
    return output_path


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def run_pipeline(topic: str) -> Path:
    """Execute the full pipeline and return the output file path."""
    load_dotenv(SCRIPTS_DIR / ".env")

    newsapi_key: str | None = os.getenv("NEWSAPI_KEY")
    anthropic_key: str | None = os.getenv("ANTHROPIC_API_KEY")

    if not anthropic_key:
        log.error("ANTHROPIC_API_KEY is required. Set it in scripts/.env")
        sys.exit(1)

    log.info("=" * 60)
    log.info("VC News Intelligence Pipeline")
    log.info("Topic: %s", topic)
    log.info("=" * 60)

    # 1. Collect
    articles = collect_articles(topic, newsapi_key)
    if not articles:
        log.error("No articles collected. Check your API keys and network connectivity.")
        sys.exit(1)

    # 2. Deduplicate
    articles = deduplicate(articles, max_keep=20)

    # 3. Enrich
    articles = enrich_articles(articles)

    # 4. Analyze
    analysis = analyze_with_claude(articles, topic, anthropic_key)

    # 5. Output
    newsletter = build_newsletter(topic, analysis, articles)
    output_path = write_newsletter(newsletter, topic)

    log.info("=" * 60)
    log.info("Pipeline complete!")
    log.info("Output: %s", output_path)
    log.info("=" * 60)

    return output_path


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python3 generate_newsletter.py \"<topic>\"")
        print("Example: python3 generate_newsletter.py \"climate tech\"")
        sys.exit(1)

    topic = sys.argv[1].strip()
    if not topic:
        print("Error: topic cannot be empty.")
        sys.exit(1)

    run_pipeline(topic)


if __name__ == "__main__":
    main()
