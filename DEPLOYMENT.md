# Deployment Guide

This app deploys as a static site via **GitHub Pages** with automated builds through **GitHub Actions**. Every push to `main` triggers a build and deploy.

---

## Prerequisites

- GitHub account
- Repository pushed to GitHub
- A custom domain (optional)

---

## Step 1: Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/vc-newsletters.git
git add -A
git commit -m "Initial commit"
git push -u origin main
```

---

## Step 2: Add Secrets

Go to your repo on GitHub:

**Settings > Secrets and variables > Actions > New repository secret**

Add the following secret:

| Name | Value |
|------|-------|
| `VITE_ANTHROPIC_API_KEY` | Your Anthropic API key |

This keeps the key out of source code but makes it available during the CI build so the chatbot works in production.

---

## Step 3: Enable GitHub Pages

Go to your repo on GitHub:

**Settings > Pages**

Under **"Build and deployment" > Source**, select **GitHub Actions**.

That's it — the workflow file at `.github/workflows/deploy.yml` handles the rest.

---

## Step 4: First Deploy

Push any commit to `main` (or go to **Actions > Deploy to GitHub Pages > Run workflow** to trigger manually).

The workflow will:
1. Check out the code
2. Install Bun
3. Run `bun install`
4. Run `bun run build` (injects the API key from secrets)
5. Upload the `dist/` folder to GitHub Pages

Your site will be live at:
```
https://YOUR_USERNAME.github.io/vc-newsletters/
```

> **Note:** If your repo name is not `vc-newsletters`, update the `base` field in `vite.config.ts` to match:
> ```ts
> base: '/your-repo-name/'
> ```
> If using a custom domain, keep `base: '/'`.

---

## Custom Domain Setup

### 1. Update the CNAME file

Edit `public/CNAME` and replace the contents with your actual domain:

```
yourdomain.com
```

This file gets included in every build so GitHub Pages knows which domain to serve.

### 2. Configure DNS at your domain registrar

Add these DNS records (Namecheap, Cloudflare, Google Domains, etc.):

**For apex domain (yourdomain.com):**

| Type | Name | Value |
|------|------|-------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

**For www subdomain:**

| Type | Name | Value |
|------|------|-------|
| CNAME | www | YOUR_USERNAME.github.io |

### 3. Configure in GitHub

Go to **Settings > Pages > Custom domain**:
- Enter your domain (e.g., `yourdomain.com`)
- Check **"Enforce HTTPS"**

DNS propagation takes 5-30 minutes. After that, your site is live at your custom domain with free HTTPS.

---

## How Updates Work

```
You push code to main
       ↓
GitHub Actions triggers automatically
       ↓
bun install → bun run build
       ↓
dist/ uploaded to GitHub Pages
       ↓
Site is live (< 2 minutes)
```

### Updating newsletter data

1. Run the pipeline locally for the topic you want to update:
   ```bash
   cd scripts
   python3 generate_newsletter.py "Climate Tech"
   ```
2. Commit the updated JSON file:
   ```bash
   git add data/newsletters/climate-tech.json
   git commit -m "Update Climate Tech newsletter data"
   git push
   ```
3. GitHub Actions builds and deploys automatically.

### Adding a new topic

1. Generate the newsletter:
   ```bash
   python3 generate_newsletter.py "New Topic"
   ```
2. Add the import to `src/data/mockData.ts`:
   ```typescript
   import newTopic from '../../data/newsletters/new-topic.json';
   // add to the map:
   "new topic": newTopic as Newsletter,
   ```
3. Add the topic to `SUGGESTED_TOPICS` in `src/constants/constants.ts`.
4. Commit and push.

---

## GitHub Actions Workflow Reference

The workflow lives at `.github/workflows/deploy.yml` and does the following:

```yaml
Trigger: push to main, or manual dispatch
Permissions: read contents, write pages, write id-token
Jobs:
  build:
    - Checkout code
    - Setup Bun
    - bun install
    - bun run build (with VITE_ANTHROPIC_API_KEY from secrets)
    - Upload dist/ as pages artifact
  deploy:
    - Deploy pages artifact to GitHub Pages
```

---

## Troubleshooting

### Build fails in GitHub Actions
- Check that `VITE_ANTHROPIC_API_KEY` is set in repo secrets
- Check the Actions tab for error logs

### Site shows 404 after deploy
- Ensure GitHub Pages source is set to "GitHub Actions" (not "Deploy from a branch")
- If not using a custom domain, make sure `base` in `vite.config.ts` matches your repo name

### Custom domain not working
- Verify DNS records are correct with `dig yourdomain.com`
- DNS propagation can take up to 48 hours (usually 5-30 minutes)
- Make sure `public/CNAME` contains your exact domain
- Check "Enforce HTTPS" is enabled in GitHub Pages settings

### Chatbot not working in production
- The `VITE_ANTHROPIC_API_KEY` secret must be set in GitHub repo settings
- The key is baked into the build at compile time — if you add/change the secret, re-run the workflow
