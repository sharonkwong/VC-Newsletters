#!/usr/bin/env python3
"""
Newsletter Validation & Fact-Check Pipeline
=============================================
Reads an existing newsletter JSON, sends it to Claude for fact-checking,
relevance filtering, and correction. Also searches for additional research
sources to supplement the data.

This script should be run AFTER generate_newsletter.py.

Usage:
    python3 validate_newsletter.py "climate tech"
    python3 validate_newsletter.py "whale migration"
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
import logging
from pathlib import Path
from typing import Any
from urllib.parse import quote_plus

import anthropic
import feedparser
import requests
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("validator")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SCRIPTS_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPTS_DIR.parent
DATA_DIR = PROJECT_ROOT / "data" / "newsletters"

REQUEST_TIMEOUT = 15


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[\s_]+", "-", text).strip("-")


def _safe_get(url: str, **kwargs: Any) -> requests.Response | None:
    try:
        resp = requests.get(url, timeout=REQUEST_TIMEOUT, **kwargs)
        resp.raise_for_status()
        return resp
    except requests.RequestException as exc:
        log.warning("HTTP request failed for %s: %s", url, exc)
        return None


# ---------------------------------------------------------------------------
# 1. Load existing newsletter
# ---------------------------------------------------------------------------

def load_newsletter(topic: str) -> dict[str, Any]:
    slug = slugify(topic)
    path = DATA_DIR / f"{slug}.json"
    if not path.exists():
        log.error("Newsletter not found: %s", path)
        log.error("Run generate_newsletter.py first.")
        sys.exit(1)

    data = json.loads(path.read_text(encoding="utf-8"))
    log.info("Loaded newsletter: %s (%d sources)", path.name, len(data.get("sources", [])))
    return data


# ---------------------------------------------------------------------------
# 2. Search for additional research articles
# ---------------------------------------------------------------------------

def fetch_additional_research(topic: str) -> list[dict[str, str]]:
    """Fetch supplementary research articles from Google Scholar and PubMed."""
    log.info("Searching for additional research articles ...")
    articles: list[dict[str, str]] = []

    # Google Scholar
    url = f"https://scholar.google.com/scholar?q={quote_plus(topic)}&hl=en&as_sdt=0%2C5&as_ylo=2024"
    headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
    resp = _safe_get(url, headers=headers)
    if resp:
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(resp.text, "html.parser")
            for result in soup.select(".gs_ri")[:8]:
                title_el = result.select_one(".gs_rt a")
                snippet_el = result.select_one(".gs_rs")
                if title_el:
                    articles.append({
                        "title": title_el.get_text(strip=True),
                        "url": title_el.get("href", ""),
                        "source": "Google Scholar",
                        "snippet": snippet_el.get_text(strip=True) if snippet_el else "",
                    })
        except ImportError:
            log.warning("BeautifulSoup not available — skipping Google Scholar")
        except Exception as exc:
            log.warning("Google Scholar parsing failed: %s", exc)

    # PubMed (for health/science topics)
    pubmed_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term={quote_plus(topic)}&retmax=5&sort=date&retmode=json"
    resp = _safe_get(pubmed_url)
    if resp:
        try:
            ids = resp.json().get("esearchresult", {}).get("idlist", [])
            if ids:
                summary_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id={','.join(ids)}&retmode=json"
                summary_resp = _safe_get(summary_url)
                if summary_resp:
                    results = summary_resp.json().get("result", {})
                    for pid in ids:
                        paper = results.get(pid, {})
                        if paper:
                            articles.append({
                                "title": paper.get("title", ""),
                                "url": f"https://pubmed.ncbi.nlm.nih.gov/{pid}/",
                                "source": "PubMed",
                                "snippet": paper.get("sorttitle", ""),
                            })
        except Exception as exc:
            log.warning("PubMed fetch failed: %s", exc)

    # arXiv
    arxiv_url = f"https://export.arxiv.org/api/query?search_query=all:{quote_plus(topic)}&start=0&max_results=5&sortBy=submittedDate&sortOrder=descending"
    resp = _safe_get(arxiv_url)
    if resp:
        try:
            feed = feedparser.parse(resp.text)
            for entry in feed.entries[:5]:
                articles.append({
                    "title": entry.get("title", "").replace("\n", " ").strip(),
                    "url": entry.get("link", ""),
                    "source": "arXiv",
                    "snippet": (entry.get("summary", "") or "")[:300],
                })
        except Exception as exc:
            log.warning("arXiv fetch failed: %s", exc)

    log.info("  -> Found %d additional research articles", len(articles))
    return articles


# ---------------------------------------------------------------------------
# 3. Validate with Claude
# ---------------------------------------------------------------------------

VALIDATION_PROMPT = """\
You are a fact-checking analyst. I have an AI-generated intelligence report about "{topic}".
Your job is to:

1. **RELEVANCE CHECK**: Identify any content that is NOT actually about "{topic}".
   For example, if the topic is "whale migration" and the report discusses Bitcoin "whales" or cryptocurrency, that is IRRELEVANT and must be removed.
   If the topic is "climate tech" and an article is about political climate, that is IRRELEVANT.
   Be strict — every piece of information must be directly about the literal meaning of the topic.

2. **FACT CHECK**: Flag and correct any claims that appear inaccurate, outdated, or misleading.
   Cross-reference company names, funding amounts, and market data against your knowledge.
   If a company is listed in the wrong sector or with wrong funding data, correct it.

3. **SUPPLEMENT WITH RESEARCH**: I'm also providing {research_count} additional research articles.
   Use these to enrich the report with academic/research perspectives where relevant.
   Add any important findings to the appropriate sections.

4. **IMPROVE QUALITY**: Ensure all sections are substantive and specific to the topic.
   Replace any generic filler content with topic-specific insights.

Return the COMPLETE corrected newsletter as a JSON object with the EXACT same schema as the input.
Do not omit any fields. If a section is fine, return it unchanged.

IMPORTANT RULES:
- Remove ALL irrelevant sources, competitors, emerging companies, people, products, and companies that are not about the literal topic "{topic}"
- Remove sources that are clearly about a different subject that happens to share keywords
- Keep executiveSummary at exactly 5 bullets
- Keep themes at 3-5 items
- Keep competitors at 5-8 items (fill with relevant ones if you removed irrelevant ones)
- Keep emergingCompanies at 3-5 items
- Keep consensus at 3-4 items, contrarian at 2-3 items
- Keep topPeople, topProducts, topCompanies at 3-5 each
- All monetary amounts in standard notation (e.g. "$1.2B")
- predictions must start with "AI-Generated Predictions: "

CURRENT NEWSLETTER:
{newsletter_json}

ADDITIONAL RESEARCH ARTICLES:
{research_text}

Return ONLY the corrected JSON object. No markdown, no explanation.
"""


def validate_with_claude(
    newsletter: dict[str, Any],
    topic: str,
    research_articles: list[dict[str, str]],
    api_key: str,
    max_retries: int = 2,
) -> dict[str, Any]:
    """Send the newsletter to Claude for fact-checking and correction."""
    log.info("Sending newsletter to Claude for validation ...")

    client = anthropic.Anthropic(api_key=api_key)

    # Build research text
    research_parts: list[str] = []
    for i, article in enumerate(research_articles, 1):
        research_parts.append(
            f"--- Research {i} ---\n"
            f"Title: {article['title']}\n"
            f"URL: {article['url']}\n"
            f"Source: {article['source']}\n"
            f"Snippet: {article.get('snippet', '')}\n"
        )
    research_text = "\n".join(research_parts) if research_parts else "No additional research articles found."

    # Serialize newsletter (exclude sources array to save tokens — we handle sources separately)
    newsletter_for_review = {k: v for k, v in newsletter.items() if k != "sources"}
    newsletter_for_review["source_titles"] = [s.get("title", "") for s in newsletter.get("sources", [])]

    prompt = VALIDATION_PROMPT.format(
        topic=topic,
        newsletter_json=json.dumps(newsletter_for_review, indent=2, ensure_ascii=False),
        research_text=research_text,
        research_count=len(research_articles),
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

            corrected: dict[str, Any] = json.loads(raw_text)
            log.info("  -> Validation complete — newsletter corrected successfully")
            return corrected

        except json.JSONDecodeError as exc:
            log.warning("Attempt %d: Failed to parse Claude validation JSON: %s", attempt, exc)
            if attempt < max_retries:
                log.info("Retrying ...")
                time.sleep(2)
            else:
                log.error("All validation attempts failed. Returning original newsletter.")
                return newsletter

        except anthropic.APIError as exc:
            log.warning("Attempt %d: Claude API error: %s", attempt, exc)
            if attempt < max_retries:
                wait = 5 * attempt
                log.info("Retrying in %ds ...", wait)
                time.sleep(wait)
            else:
                log.error("All Claude API attempts failed. Returning original newsletter.")
                return newsletter

    return newsletter


# ---------------------------------------------------------------------------
# 4. Merge corrections back
# ---------------------------------------------------------------------------

def merge_corrections(original: dict[str, Any], corrected: dict[str, Any]) -> dict[str, Any]:
    """Merge the corrected analysis back into the original newsletter, preserving metadata and sources."""
    result = dict(original)

    # Fields that the validator can correct
    correctable_fields = [
        "executiveSummary", "themes", "landscape", "currentState",
        "predictions", "investmentInsights", "competitors",
        "emergingCompanies", "consensus", "contrarian",
        "topPeople", "topProducts", "topCompanies",
    ]

    changes = 0
    for field in correctable_fields:
        if field in corrected and corrected[field] != original.get(field):
            result[field] = corrected[field]
            changes += 1

    log.info("  -> %d fields updated during validation", changes)
    return result


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def run_validation(topic: str) -> Path:
    """Execute the validation pipeline and return the output file path."""
    load_dotenv(SCRIPTS_DIR / ".env")

    anthropic_key: str | None = os.getenv("ANTHROPIC_API_KEY")
    if not anthropic_key:
        log.error("ANTHROPIC_API_KEY is required. Set it in scripts/.env")
        sys.exit(1)

    log.info("=" * 60)
    log.info("Newsletter Validation Pipeline")
    log.info("Topic: %s", topic)
    log.info("=" * 60)

    # 1. Load existing newsletter
    newsletter = load_newsletter(topic)

    # 2. Fetch additional research
    research = fetch_additional_research(topic)

    # 3. Validate with Claude
    corrected = validate_with_claude(newsletter, topic, research, anthropic_key)

    # 4. Merge corrections
    final = merge_corrections(newsletter, corrected)

    # 5. Write back
    slug = slugify(topic)
    output_path = DATA_DIR / f"{slug}.json"
    output_path.write_text(json.dumps(final, indent=2, ensure_ascii=False), encoding="utf-8")
    log.info("Validated newsletter written to %s", output_path)

    log.info("=" * 60)
    log.info("Validation complete!")
    log.info("=" * 60)

    return output_path


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python3 validate_newsletter.py \"<topic>\"")
        print("Example: python3 validate_newsletter.py \"whale migration\"")
        sys.exit(1)

    topic = sys.argv[1].strip()
    if not topic:
        print("Error: topic cannot be empty.")
        sys.exit(1)

    run_validation(topic)


if __name__ == "__main__":
    main()
