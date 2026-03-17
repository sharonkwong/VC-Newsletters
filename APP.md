# News Intelligence — Application Documentation

## Overview

News Intelligence is a VC-focused research platform built for Emerson Collective. It automates the workflow of aggregating news, generating AI-powered market analysis, and surfacing investment insights — a process that previously required hours of manual web research.

The application has two layers:

1. **Data Pipeline** (Python) — Offline scripts that scrape the web, collect articles from news APIs, RSS feeds, Google Scholar, arXiv, and PubMed, send them to Claude for structured analysis with relevancy ranking, optionally validate/fact-check the output, and produce display-ready JSON files.
2. **Frontend** (React) — A static single-page application that reads the pre-generated JSON files and renders an interactive intelligence dashboard with search, export, sharing, saved notes, and an AI chatbot with web search capability.

There is no backend server. The pipeline runs offline (or via CI), and the frontend is fully static.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  DATA PIPELINE (Python, runs offline or via CI)                   │
│                                                                    │
│  NewsAPI ────────┐                                                 │
│  Google RSS ─────┤                                                 │
│  VC RSS ─────────┤── Collect ── Deduplicate ── Enrich ──┐         │
│  Google Scholar ─┤   (parallel)  (URL+title)  (newspaper3k)       │
│  arXiv RSS ──────┤                                      │         │
│  Research RSS ───┘                                      │         │
│                                        Claude API ◄─────┘         │
│                                        (Sonnet 4)                  │
│                                            │                       │
│                                   ┌────────┴────────┐              │
│                                   ▼                 ▼              │
│                          generate_newsletter    validate_newsletter │
│                           (analysis + rank)    (fact-check + enrich)│
│                                   └────────┬────────┘              │
│                                            ▼                       │
│                                   data/newsletters/                │
│                                   ├── climate-tech.json            │
│                                   ├── ai-in-education.json         │
│                                   └── ...                          │
│                                                                    │
│  run_pipeline.py  ─── orchestrates generate → validate             │
└──────────────────────────────────────────────────────────────────┘
                             │
                      Static JSON files
                             │
┌──────────────────────────────────────────────────────────────────┐
│  FRONTEND (React + Vite + TypeScript)                             │
│                                                                    │
│  ┌──────────┐  ┌─────────────────────────────┐  ┌──────────────┐  │
│  │ TableOf  │  │  Fixed Header (brand+settings)│  │ SearchHistory│  │
│  │ Contents │  │  SearchBar                    │  │ ChatBot      │  │
│  │ (sticky) │  │  SummaryView                  │  │ (Claude API  │  │
│  │          │  │  ├── Header (freq/export/share)│  │  + web search│  │
│  │          │  │  ├── ExecutiveSummary          │  │  + markdown) │  │
│  │          │  │  ├── ThemesList                │  │              │  │
│  │          │  │  ├── VCAnalysis (2x2 grid)     │  └──────────────┘  │
│  │          │  │  ├── CompetitorLandscape       │                    │
│  │          │  │  ├── EmergingCompanies         │                    │
│  │          │  │  ├── ConsensusContrarian       │                    │
│  │          │  │  ├── TopInsights               │                    │
│  │          │  │  ├── SourcesList               │                    │
│  │          │  │  └── SavedNotes                │                    │
│  └──────────┘  └─────────────────────────────┘                    │
│                                                                    │
│  ShareModal (overlay)     Settings menu (timezone, profile)        │
└──────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + TypeScript | UI framework |
| Build tool | Vite 8 + Bun | Fast dev server and bundler |
| Styling | CSS Modules | Scoped per-component styles, no shared CSS |
| Icons | lucide-react | Consistent icon library |
| PDF export | jsPDF | Programmatic one-page leadership summary |
| Screenshot export | html2canvas + jsPDF | Section-by-section full report PDF capture |
| PPT export | pptxgenjs | Slide deck generation with 2x2 VC Analysis quadrant |
| AI chatbot | @anthropic-ai/sdk | Browser-side Claude API calls with web search tool |
| Markdown rendering | react-markdown | Renders Claude responses as formatted markdown |
| Font | Source Sans 3 | Google Fonts, used for all headings and body |
| Data pipeline | Python 3 | Offline article collection, analysis, and validation |
| Article scraping | newspaper3k | Full-text extraction from article URLs |
| RSS parsing | feedparser | Google News, VC blogs, arXiv research RSS feeds |
| News API | NewsAPI.org | Keyword-based article search (free tier) |
| Academic scraping | BeautifulSoup (bs4) | Google Scholar result parsing |
| AI analysis | Anthropic Claude API | Structured market analysis and fact-checking |
| Environment | python-dotenv | API key management |

---

## Data Pipeline

The pipeline consists of three scripts that can be run independently or together:

| Script | Purpose | Usage |
|--------|---------|-------|
| `generate_newsletter.py` | Full collection + analysis pipeline | `python3 generate_newsletter.py "Climate Tech"` |
| `validate_newsletter.py` | Fact-checking + research enrichment | `python3 validate_newsletter.py "Climate Tech"` |
| `run_pipeline.py` | Orchestrator: generate then validate | `python3 run_pipeline.py "Climate Tech"` |

### generate_newsletter.py

Runs end-to-end in ~2 minutes per topic. Five stages:

#### Stage 1: Collect

Five data sources are queried in parallel using `ThreadPoolExecutor` (5 workers):

1. **NewsAPI** (`/v2/everything`) — Up to 20 articles sorted by relevancy. Requires a free API key. Returns titles, descriptions, URLs, source names, and publish dates.

2. **Google News RSS** — Parses `https://news.google.com/rss/search?q={topic}`. No API key needed. Returns ~100 headline results with links and publish dates.

3. **VC-Specific RSS Feeds** — Parses 5 curated feeds (TechCrunch, Crunchbase News, PitchBook, Sifted, Hacker News) and filters entries by keyword match against the search topic.

4. **Google Scholar** — Scrapes `scholar.google.com` for recent papers (2025+) using BeautifulSoup. Extracts titles, URLs, and snippets from up to 10 results. Falls back gracefully if `bs4` is not installed.

5. **Research RSS Feeds** — Parses 2 arXiv RSS feeds (`cs.AI` and `q-fin`) filtered by topic keywords. Captures academic preprints relevant to the search topic.

Typical output: 100-200+ raw articles.

#### Stage 2: Deduplicate

Articles are deduplicated by:
- **URL normalization** — strips protocol, query params, trailing slashes
- **Fuzzy title matching** — checks if one title is a substring of another

Result is capped at 20 unique articles.

#### Stage 3: Enrich

Each article URL is passed to `newspaper3k` for full-text extraction (8 parallel workers). If extraction succeeds and returns >100 characters, the full text is used. Otherwise the API snippet is used as fallback.

Typical success rate: 14-19 out of 20 articles get full text.

#### Stage 4: Analyze with Claude

All article texts are concatenated and sent to Claude (`claude-sonnet-4-20250514`) with a structured prompt requesting JSON output.

The prompt instructs Claude to act as a VC analyst and produce:
- 5 executive summary bullets (VC-focused)
- 3-5 recurring themes
- Market landscape paragraph
- Current state paragraph
- AI-generated predictions (explicitly labeled)
- Investment insights paragraph
- 5-8 competitors with momentum indicators
- 3-5 emerging companies with signals
- 3-4 consensus views and 2-3 contrarian views
- Top people, products, and companies (3-5 each)
- **`sourceRanking`** — an ordered array of article numbers (1-indexed) from most to least relevant. This determines display order in the Sources section.

Per-article text is capped at 3,000 characters. The prompt requests raw JSON with no markdown fences. If JSON parsing fails, it retries once.

#### Stage 5: Output

The analysis is merged with metadata (topic, date, frequency) and the full list of 20 source articles, **reordered by Claude's relevancy ranking**. The top 5 sources are marked as `trending: true`. The result is written to `data/newsletters/{topic-slug}.json`.

### validate_newsletter.py

Runs after generation to fact-check and enrich the newsletter. Four stages:

1. **Load** — Reads the existing newsletter JSON from `data/newsletters/`.

2. **Fetch Additional Research** — Searches three academic sources for supplementary articles:
   - **Google Scholar** — Scrapes up to 8 recent papers with `bs4`
   - **PubMed** — Queries NCBI eutils API for up to 5 recent publications (useful for health/science topics)
   - **arXiv** — Queries the arXiv API for up to 5 recent preprints sorted by submission date

3. **Validate with Claude** — Sends the newsletter plus research articles to Claude with instructions to:
   - **Relevance check** — Remove content not literally about the topic (e.g., Bitcoin "whales" for a whale migration report)
   - **Fact check** — Correct inaccurate claims, funding amounts, company data
   - **Supplement** — Enrich the report with academic findings
   - **Quality check** — Replace generic filler with topic-specific insights

4. **Merge & Write** — Merges corrected fields back into the original (preserving metadata and sources), writes the updated JSON.

### run_pipeline.py

Simple orchestrator that calls `generate_newsletter.py` then `validate_newsletter.py` sequentially. Provides formatted console output for each step.

### API Keys Required

| Service | Environment Variable | Cost | Where Used |
|---------|---------------------|------|------------|
| NewsAPI | `NEWSAPI_KEY` | Free (100 req/day) | Pipeline only |
| Anthropic | `ANTHROPIC_API_KEY` | ~$0.05-0.15/newsletter | Pipeline (generate + validate) |
| Anthropic | `VITE_ANTHROPIC_API_KEY` | Same key, browser-side | Frontend chatbot |

Keys are stored in:
- `scripts/.env` — used by the Python pipeline
- `.env` (project root) — used by Vite for the frontend chatbot (prefixed with `VITE_`)

Both files are in `.gitignore`.

---

## Frontend

### Layout

The app uses a responsive 3-column grid layout with a fixed header:

| Element | Position | Details |
|---------|----------|---------|
| Header | Fixed top | Brand logo, app name, date, settings menu (gear icon) |
| Left column | 180px, desktop only | TableOfContents — sticky nav with smooth scroll links |
| Center column | Flexible | SearchBar + SummaryView (or welcome screen) |
| Right column | 320px | SearchHistory (500px fixed height, scrollable) + ChatBot |

The TOC only appears when a newsletter is displayed. On the welcome screen, the layout is 2-column (center + right).

### Settings Menu

The header contains a gear icon that opens a dropdown menu with:
- **Profile** — Placeholder button (not yet functional)
- **Change Timezone** — Opens an inline timezone picker with 10 options (Pacific through Sydney). Selection persists to `localStorage` and affects all date displays including PDF/PPT exports.

### Components

Each component lives in its own directory with a `.tsx` and `.module.css` file. There are no shared CSS files — all styling is scoped per component.

**19 component directories total:**

| Component | Purpose | Status |
|-----------|---------|--------|
| `SearchBar` | Topic input with frequency button selector and suggested topic chips | Original |
| `SummaryView` | Master view that orchestrates all section components. Header contains title, frequency dropdown, Export dropdown (PDF, PPT, Full Report), and Share button | Updated — Export dropdown replaced separate PDF/PPT buttons; Share button replaced Email/SMS buttons; frequency dropdown added |
| `ExecutiveSummary` | 5 numbered bullet points with red circle badges | Original |
| `ThemesList` | Colored pills showing recurring themes | Original |
| `VCAnalysis` | **NEW** — Unified 2x2 grid showing Market Landscape, Current State, AI-Predicted Trends, and Investment Insights. Replaces the separate `MarketLandscape` and `InvestmentInsights` components. Each quadrant splits its paragraph into sentence-level bullets with auto-bold for dollar amounts, percentages, and timeframes. | New |
| `CompetitorLandscape` | 2x2 visual matrix (320px height, persistent dot labels, hover tooltips) + detailed card grid | Updated — shorter matrix, persistent name labels on dots |
| `EmergingCompanies` | Cards with trend indicators (accelerating/growing/new) and signal tags | Original |
| `ConsensusContrarian` | Two-column layout — blue consensus vs. amber contrarian + VC insight callout | Original |
| `TopInsights` | 3-column grid showing top People, Products, and Companies simultaneously | Updated — changed from tabbed interface to 3-column layout displaying all sections at once |
| `SourcesList` | Compact list of all source articles with count in the title, e.g., "Sources (20)" | Updated — more compact row styling |
| `SavedNotes` | **NEW** — Displays bookmarked AI chat Q&A pairs. Expandable accordion cards (multiple panels can be open simultaneously via `Set<string>`) with markdown-rendered answers (via `react-markdown` + `cleanMarkdown`). Delete button to remove individual notes. Empty state prompts user to bookmark chat responses. | New |
| `ShareModal` | **NEW** — Overlay modal with copy link button and two sections: (1) "Share This Newsletter" — email input + format dropdown (PDF/PPT/Newsletter) + send button + collapsible send history with format badges; (2) "Schedule Newsletter Updates" — add recipient emails with format dropdown for automatic distribution on the selected frequency, recipient list shows format badges. Both sections persist to `localStorage` per topic. | New |
| `TableOfContents` | **NEW** — Sticky left nav with clickable section links. Dynamically shows/hides links based on data availability (e.g., hides "Competitor Landscape" if no competitors). Smooth scrolls with 80px header offset. Links: Executive Summary, Key Themes, VC Analysis, Competitor Landscape, Emerging Companies, Consensus vs. Contrarian, Top Insights, Sources & References, Saved Notes. | New |
| `SearchHistory` | Sidebar list of past searches with delete/refresh actions, persisted to localStorage | Original |
| `ChatBot` | AI-powered chat interface using Claude API with web search tool and markdown rendering (details below) | Updated |
| `SectionCard` | Reusable wrapper with icon + title header used by most section components | Original |
| `ExportBar` | Export buttons (legacy, functionality moved into SummaryView header) | Legacy |
| `MarketLandscape` | Two paragraphs: Market Structure and Current Dynamics (replaced by VCAnalysis) | Legacy |
| `InvestmentInsights` | Investment opportunities paragraph + AI predictions (replaced by VCAnalysis) | Legacy |

### Branding Constants

All colors, fonts, and repeated strings are centralized in `src/constants/constants.ts`:

- **Primary color**: `#e41d26` (Emerson Collective red)
- **Background**: `#fdfaf2` (warm off-white)
- **Font**: Source Sans 3 (heading and body)
- **App name**: "News Intelligence"
- **Organization**: "Emerson Collective"
- **Frequency options**: One-time, Daily, Weekly, Monthly, Yearly
- **Suggested topics**: AI in Education, Climate Tech, Healthcare Innovation, Human Robotics, Whale Migration

### Data Loading

Newsletter JSON files are imported statically in `src/data/mockData.ts`:

```typescript
import climateTech from '../../data/newsletters/climate-tech.json';
// ...
export const mockSummaries: Record<string, Newsletter> = {
  "climate tech": climateTech as Newsletter,
  // ...
};
```

When a user searches a topic, `App.tsx` does a case-insensitive lookup against this map. If the topic matches a pre-generated newsletter, it displays the real data. If not, a generic template is generated as a placeholder. The `generatedDate` is stamped with the current ISO timestamp at search time so timezone conversion is accurate.

---

## AI Chatbot

### How It Works Without a Backend

The chatbot calls the Anthropic API directly from the browser using the `@anthropic-ai/sdk` package with `dangerouslyAllowBrowser: true`. The API key is loaded from `VITE_ANTHROPIC_API_KEY` in the project root `.env` file (Vite injects it at build time).

### Web Search Tool

The chatbot is configured with the `web_search_20250305` tool (max 3 uses per request). When the user asks something not covered by the report data, Claude can search the web for additional context. The system prompt instructs Claude to prefer report data when available and fall back to web search for broader or more recent questions.

### Markdown Rendering

Assistant responses are rendered as formatted markdown using `react-markdown`. A `cleanMarkdown` utility function preprocesses Claude's output to fix common formatting issues:

- Joins continuation lines into their parent paragraph/bullet/heading
- Merges bare bullet markers (`-`, `*`, `1.`) with their content on the next line
- Normalizes multiple spaces, fixes punctuation spacing, trims parentheses whitespace

This same `cleanMarkdown` function is also used in the `SavedNotes` component for rendering bookmarked answers.

### Context Building

When a user asks a question, the chatbot builds a context string from the current newsletter data containing:
- Executive summary bullets
- Key themes
- Market landscape and current state
- Predictions and investment insights
- All competitors with momentum, funding, and stage
- Emerging companies with signals
- Consensus and contrarian views
- Top people, products, and companies

This context is sent as the `system` prompt to Claude (`claude-sonnet-4-20250514`), along with the full conversation history and the user's new question.

### Bookmark / Unbookmark

- Assistant responses have a bookmark icon button
- **Bookmarking** triggers `onSaveQA` — saves the Q&A pair (most recent user message + assistant response) to the `SavedNotes` section and to `localStorage`
- **Unbookmarking** triggers `onUnsaveQA` — removes the corresponding note from `SavedNotes` and `localStorage`
- Bookmark state is tracked per message via the `saved` field on `ChatMessage`
- Scroll behavior only triggers on new messages or typing changes, not on bookmark toggles

### Expandable Modal

The chatbot includes an expand button (Maximize2 icon) that opens the chat in a full-screen modal overlay, providing more space for long conversations. The modal shares the same message state and input bar.

### Behavior

- **Disabled** until a newsletter is loaded (shows "Search a topic first")
- **Contextual** — answers reference actual data from the report
- **Web-augmented** — can search the web for information not in the report
- **Conversational** — maintains chat history across messages within the same topic
- **Resets** when the user switches to a different topic
- **Scroll isolation** — chat messages scroll within their own container without moving the page

---

## Export Features

The SummaryView header contains an **Export dropdown** (replaces separate buttons) with three options: Export as PDF, Export as PPT, and Export Newsletter (Full Report).

### PDF Export

Generates a **one-page leadership summary** formatted like a professional document (not a screenshot). Uses timezone-aware dates via `formatDateInTimezone`.

**Sections included:**
1. Header with Emerson Collective branding and timezone-formatted date (top-right)
2. Topic title
3. Executive Summary (numbered 1-5)
4. Key Themes (bulleted)
5. Investment Insights (sentence-level bullets, up to 4)
6. AI-Predicted Trends (sentence-level bullets, up to 4)
7. Consensus vs. Contrarian Views (two-column layout)
8. Top Insights: People, Products, Companies (three-column layout)
9. Footer with confidentiality notice

**Technology:** jsPDF — programmatic text layout with precise positioning on A4 paper (portrait).

**Filename:** `{topic-slug}-leadership-summary-{date}.pdf`

### PPT Export

Generates a **multi-slide presentation** styled with the Emerson Collective brand. Slide count varies based on data and source count.

| Slide | Content |
|-------|---------|
| 1 | Title slide — topic, timezone-formatted date, frequency, branding |
| 2 | Executive Summary — numbered bullets with red circle badges |
| 3 | Key Themes — styled cards with red accent bars on warm background |
| 4 | **Venture Capital Analysis** — 2x2 quadrant layout: Market Landscape, Current State, AI-Predicted Trends, Investment Insights. Each quadrant rendered as a card with bulleted sentences (max 4 per quadrant). |
| 5 | Competitor Landscape — table with color-coded momentum (green=rising, red=declining, gray=stable) |
| 6 | Emerging Companies — cards with trend indicators and metadata |
| 7 | Consensus vs. Contrarian — two-column layout with blue/amber card backgrounds |
| 8 | Top Insights — three-column (People, Products, Companies) |
| 9+ | **Sources (paginated)** — 10 sources per slide. Numbered table with hyperlinked titles (blue, underlined) linking to original article URLs. Continues across multiple slides as needed. |

Slides 5, 6, 7, and 8 are conditionally included only if the newsletter has data for those sections.

**Technology:** pptxgenjs — widescreen (16:9) layout with shapes, tables, and text. Every slide has a red accent bar on the left edge and a title bar with a bottom divider line.

**Filename:** `{topic-slug}-intelligence-{date}.pptx`

### Full Report Export (Screenshot PDF)

Generates a **multi-page screenshot PDF** that captures the entire newsletter as rendered on screen. Uses `html2canvas` to screenshot each section individually and `jsPDF` to assemble them into a continuous document.

**How it works:**
1. Captures the header (with action buttons temporarily hidden)
2. Auto-expands all collapsed Saved Notes accordion panels before capture
3. Screenshots each section by DOM id (`executive-summary`, `key-themes`, `market-landscape`, `competitor-landscape`, `emerging-companies`, `consensus-contrarian`, `top-insights`, `sources`, `saved-notes`)
4. Stacks sections continuously on A4 pages with 8mm margins — sections that don't fit on the current page start a new page; sections taller than a full page are split across pages with clipping
5. Collapses Saved Notes back to their original state after capture

**Technology:** html2canvas (screen capture at 2x scale) + jsPDF (A4 portrait assembly)

**Filename:** `{topic-slug}-full-report-{date}.pdf`

---

## Share & Distribution

The **Share** button in the SummaryView header opens the `ShareModal` overlay, which has a copy link button and two sections:

**Copy Link** — Button at the top copies the current page URL to clipboard with a "Link copied!" confirmation state.

### 1. Share This Newsletter
- Email input field + **format dropdown** (PDF / PPT / Newsletter) + Send button
- On send: generates the export in the selected format, then shows an alert confirming the share (placeholder — no actual email delivery)
- **Send history** — collapsible list showing all past shares for this topic (email + format badge + timestamp), persisted to `localStorage` under key `newsIntel-share-{topic}`

### 2. Schedule Newsletter Updates
- Email input field + **format dropdown** (PDF / PPT / Newsletter) + Add button
- Adds recipients who will automatically receive updates on the selected frequency cadence in the chosen format
- Recipient list with format badges and remove buttons
- Persisted to `localStorage` under key `newsIntel-schedule-{topic}`
- Deduplicates by email address

---

## Data Persistence

All client-side state is persisted to `localStorage`. There is no server-side storage.

| Key Pattern | Data | Scope |
|-------------|------|-------|
| `newsIntelHistory` | Search history array (max 20 items) | Global |
| `newsIntelFreqOverrides` | Frequency overrides per topic | Global |
| `newsIntel-timezone` | Selected timezone (default: `America/Los_Angeles`) | Global |
| `newsIntel-notes-{topic}` | Saved Q&A notes array | Per topic |
| `newsIntel-share-{topic}` | Share send history | Per topic |
| `newsIntel-schedule-{topic}` | Scheduled email recipients | Per topic |

### Frequency Persistence

When a user changes the frequency dropdown in SummaryView:
1. The current summary is updated in state
2. The override is saved to `localStorage` under `newsIntelFreqOverrides`
3. The matching search history item is updated
4. On future loads, `applyFreqOverride` restores the saved frequency for that topic

### Saved Notes Lifecycle

1. User bookmarks a chatbot response — `onSaveQA` creates a note with id, question, answer, and timestamp
2. Notes are stored per topic in `localStorage`
3. Notes load automatically when switching topics
4. User can delete notes from `SavedNotes` section (`onDeleteNote`) or unbookmark in chat (`onUnsaveQA`, which matches by answer text)

---

## Timezone Utility

`src/utils/timezone.ts` provides:

- **`TIMEZONES`** — Array of 10 timezone options: Pacific, Mountain, Central, Eastern, UTC, London, Central Europe, Japan, China, Sydney
- **`getTimezone()`** — Reads from `localStorage` (default: `America/Los_Angeles`)
- **`setTimezone(tz)`** — Writes to `localStorage`
- **`formatDateInTimezone(dateStr)`** — Parses ISO or human-readable date strings and formats them in the user's selected timezone (e.g., "Mar 16, 2026, 10:30 AM PDT")

This function is used by:
- SummaryView header (generated/updated dates)
- PDF export (header date)
- PPT export (title slide date)

---

## Pre-Generated Newsletters

Five newsletters ship with the app, generated from real data:

| Topic | File | Sources |
|-------|------|---------|
| Climate Tech | `data/newsletters/climate-tech.json` | 20 |
| AI in Education | `data/newsletters/ai-in-education.json` | 20 |
| Healthcare Innovation | `data/newsletters/healthcare-innovation.json` | 20 |
| Human Robotics | `data/newsletters/human-robotics.json` | 20 |
| Whale Migration | `data/newsletters/whale-migration.json` | 20 |

To generate a new newsletter for any topic:

```bash
cd scripts
python3 run_pipeline.py "Your Topic Here"   # generate + validate
# or just generate without validation:
python3 generate_newsletter.py "Your Topic Here"
```

Then add the import to `src/data/mockData.ts` and rebuild.

---

## Running the App

### Prerequisites
- Bun (runtime)
- Python 3.11+ (for pipeline)
- API keys for NewsAPI and Anthropic

### Development
```bash
bun install
bun run dev
```
Opens at `http://localhost:5173` (or next available port).

### Build
```bash
bun run build
```
Outputs static files to `dist/`.

### Generate New Newsletter Data
```bash
cd scripts
pip install -r requirements.txt
cp .env.example .env  # fill in your API keys
python3 run_pipeline.py "Topic Name"        # full pipeline (generate + validate)
python3 generate_newsletter.py "Topic Name" # generation only
python3 validate_newsletter.py "Topic Name" # validation only (requires existing JSON)
```

### Deployment

See `DEPLOYMENT.md` for full GitHub Pages deployment guide including GitHub Actions CI/CD, custom domain setup, and secret management.

---

## Limitations & Constraints

### Data Freshness
- Newsletter data is static JSON generated at script run time. It does not update automatically.
- To refresh data, the pipeline must be re-run and the app redeployed.
- Future improvement: GitHub Actions cron job to regenerate newsletters on a schedule.

### NewsAPI Free Tier
- Limited to 100 requests per day and articles from the last 30 days.
- Cannot access articles older than 1 month on the free plan.
- Rate-limited to 1 request per second.

### Academic Source Scraping
- Google Scholar scraping requires `beautifulsoup4`. If not installed, this source is skipped gracefully.
- Google Scholar may rate-limit or block requests from automated scrapers.
- PubMed API is most useful for health/science topics; returns less relevant results for purely tech/business topics.
- arXiv coverage is limited to the RSS feed categories configured (`cs.AI`, `q-fin`).

### Article Extraction
- `newspaper3k` cannot extract text from paywalled sites (NYT, Bloomberg, WSJ, etc.). Falls back to the API snippet in those cases.
- Some sites block automated requests; ~70-95% extraction success rate depending on topic.

### AI Chatbot — Browser-Side API Key
- The Anthropic API key is embedded in the frontend build via `VITE_ANTHROPIC_API_KEY`. This is acceptable for internal demos but **not suitable for production**. Anyone who inspects the page source can see the key.
- For production, the chatbot should route through a backend proxy that holds the key server-side.

### AI Chatbot — Web Search Limits
- Web search is limited to 3 uses per request via `max_uses: 3` on the `web_search_20250305` tool.
- Web search results depend on Anthropic's tool implementation and may not always return relevant results.

### No Backend / No Database
- All persistence lives in `localStorage` — it's per-browser and not shared across devices.
- There is no user authentication, no server-side storage, and no multi-user support.
- Share and schedule features record intent locally but do not actually send emails (placeholder functionality).

### Export Limitations
- **PDF**: Designed as a one-page summary. Very long newsletters may have content cut off at the bottom of the page.
- **Full Report**: Screenshot-based PDF depends on the current DOM state. Sections must be visible on screen to capture. Large sections are split across pages with white-rectangle clipping (not true PDF clipping).
- **PPT**: Slide layouts are fixed. Topics with more than 8 competitors or 5 emerging companies will have some entries truncated. Sources paginate correctly across multiple slides.

### Generic Fallback
- If a user searches a topic that doesn't have a pre-generated JSON file, a generic template is shown with placeholder content. The data is not real for unrecognized topics.

### CORS
- The Anthropic SDK uses `dangerouslyAllowBrowser: true` to bypass CORS restrictions. This works but logs a console warning. A proper production setup would use a backend proxy.

---

## File Structure

```
VC-Newsletters/
├── APP.md                          # This file
├── DEPLOYMENT.md                   # GitHub Pages deployment guide
├── .env                            # VITE_ANTHROPIC_API_KEY (gitignored)
├── .gitignore
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
│
├── data/
│   └── newsletters/
│       ├── climate-tech.json
│       ├── ai-in-education.json
│       ├── healthcare-innovation.json
│       ├── human-robotics.json
│       └── whale-migration.json
│
├── scripts/
│   ├── generate_newsletter.py      # Full data pipeline (collect → dedupe → enrich → analyze → output)
│   ├── validate_newsletter.py      # Fact-check + research enrichment pipeline
│   ├── run_pipeline.py             # Orchestrator: generate → validate
│   ├── requirements.txt            # Python dependencies
│   ├── .env                        # NEWSAPI_KEY + ANTHROPIC_API_KEY (gitignored)
│   └── .env.example
│
├── src/
│   ├── App.tsx                     # Main app: layout, settings menu, state management, saved notes
│   ├── App.module.css
│   ├── main.tsx                    # Entry point
│   ├── index.css                   # Global styles + font import
│   │
│   ├── constants/
│   │   └── constants.ts            # Colors, fonts, branding, frequency options, suggested topics
│   │
│   ├── types/
│   │   └── types.ts                # TypeScript interfaces (Newsletter, HistoryItem, ChatMessage, etc.)
│   │
│   ├── data/
│   │   └── mockData.ts             # Newsletter JSON imports + lookup map
│   │
│   ├── utils/
│   │   ├── pdfExport.ts            # One-page PDF generation (jsPDF) with timezone-aware dates
│   │   ├── pptExport.ts            # Multi-slide PPT generation (pptxgenjs) with 2x2 VC Analysis quadrant
│   │   ├── screenshotExport.ts     # Full Report screenshot PDF (html2canvas + jsPDF, section-by-section capture)
│   │   └── timezone.ts             # Timezone picker data, get/set/format helpers (localStorage-backed)
│   │
│   └── components/
│       ├── SearchBar/              # Topic input + frequency selector
│       ├── SummaryView/            # Master newsletter view + header (freq dropdown, Export dropdown, Share)
│       ├── ExecutiveSummary/       # 5-bullet numbered summary
│       ├── ThemesList/             # Colored theme pills
│       ├── VCAnalysis/             # NEW — 2x2 grid: Market Landscape, Current State, Predictions, Insights
│       ├── CompetitorLandscape/    # 2x2 matrix (320px, persistent dot labels) + card grid
│       ├── EmergingCompanies/      # Emerging company cards with signals
│       ├── ConsensusContrarian/    # Two-column views + VC insight
│       ├── TopInsights/            # 3-column grid: people/products/companies
│       ├── SourcesList/            # Article list with count
│       ├── SavedNotes/             # NEW — Bookmarked chat Q&A pairs with markdown rendering
│       ├── ShareModal/             # NEW — Share & distribute overlay (copy link, format dropdowns, send + schedule)
│       ├── TableOfContents/        # NEW — Sticky section nav with dynamic visibility
│       ├── SearchHistory/          # Sidebar history with actions
│       ├── ChatBot/                # AI chat with Claude API, web search tool, markdown rendering
│       ├── SectionCard/            # Reusable card wrapper
│       ├── ExportBar/              # Legacy — export buttons (functionality now in SummaryView)
│       ├── MarketLandscape/        # Legacy — replaced by VCAnalysis
│       └── InvestmentInsights/     # Legacy — replaced by VCAnalysis
```
