# Deployment Guide

## Normal Deploy (no API key — default)

```sh
bun run deploy
```

Builds with a blank `VITE_ANTHROPIC_API_KEY`. The chatbot will show a "needs API key" message on the live site.

---

## Demo Deploy (with live API key)

> **The key gets bundled client-side — anyone can see it in DevTools.** Use a temporary key with a spend limit.

### 1. Create a temporary key

Go to https://console.anthropic.com → API Keys → Create Key. Set a spend limit (e.g. $5).

### 2. Deploy with the key

```sh
VITE_ANTHROPIC_API_KEY='sk-ant-your-temp-key' bun run build && npx gh-pages -d dist
```

### 3. Do your demo

### 4. Immediately after: redeploy without the key and clean up

```sh
bun run deploy
```

Then delete/disable the temp key at https://console.anthropic.com.

The old key is still in `gh-pages` git history. To fully scrub it:

```sh
git push origin --delete gh-pages
rm -rf node_modules/.cache/gh-pages
bun run deploy
```

---

## Custom Domain

DNS records (set at Namecheap):

| Type | Name | Value |
|------|------|-------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | sharonkwong.github.io |

GitHub Pages is configured to serve from the `gh-pages` branch with custom domain `vcnewsletters.shop`.
