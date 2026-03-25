# Project Template

A personal project starter for George Yiakoumi — combining a production-ready Next.js scaffold with a Claude Code assistant configured for UX/product design work.

Every new project created from this template gets:
- A running Next.js + shadcn/ui + Tailwind + Supabase + Netlify codebase
- A Claude Code assistant that runs a structured project setup routine on first open
- Automatic MCP connectivity checks (Linear, Notion, Netlify, GitHub, Excalidraw)
- A master plan synced to Notion and a Linear project with issues created before any code is written

---

## Prerequisites

Install these once. They're needed every time you create a new project.

| Tool | Install |
|---|---|
| GitHub CLI | `brew install gh` then `gh auth login` |
| Node.js 18+ | [nodejs.org](https://nodejs.org) or `brew install node` |
| VS Code | [code.visualstudio.com](https://code.visualstudio.com) |
| VS Code CLI | Open VS Code → Cmd+Shift+P → `Shell Command: Install 'code' command in PATH` |
| Claude Code | Install the Claude Code extension in VS Code |
| Supabase CLI (optional) | `brew install supabase/tap/supabase` — only needed for local DB dev |

MCP connections (Linear, Notion, Netlify, GitHub, Excalidraw) are configured at the VS Code level, not per-project. Set them up once in Claude Code's MCP settings.

---

## Creating a new project

Download `create-project.sh` from this repo and store it somewhere permanent (e.g. `~/Scripts/create-project.sh`). You only need to do this once.

**First-time setup:**

```bash
# 1. Download the script
curl -o ~/Scripts/create-project.sh https://raw.githubusercontent.com/georgeyiakoumi/project-template/main/create-project.sh

# 2. Make it executable
chmod +x ~/Scripts/create-project.sh

# 3. Optionally add an alias to your shell profile (~/.zshrc or ~/.bashrc)
echo 'alias new-project="~/Scripts/create-project.sh"' >> ~/.zshrc
source ~/.zshrc
```

**Creating a project:**

```bash
new-project
# or, without the alias:
~/Scripts/create-project.sh
```

The script will:
1. Ask for a project name (kebab-case) and visibility (private/public)
2. Create a new GitHub repo from this template
3. Clone it locally
4. Run `npm install`
5. Copy `.env.example` → `.env.local`
6. Open the project in VS Code

---

## What happens when VS Code opens

Claude Code reads `CLAUDE.md` from the project root automatically. On first open it will:

1. **Check MCP connections** — Linear, Notion, Netlify, GitHub, Excalidraw. It will stop and flag anything that isn't reachable before proceeding.
2. **Scope the project** — ask a small set of questions to establish what's being built, who it's for, and what success looks like.
3. **Create a Notion master plan** — a structured document covering goals, users, scope, constraints, milestones, and open questions.
4. **Create a Linear project + issues** — one issue per discrete task, linked back to the Notion plan.
5. **Begin work in the right order** — UX process first, design psychology throughout, UI last.

You don't need to do anything to trigger this. Just open the Claude Code panel and it starts.

---

## Environment variables

After the script runs, open `.env.local` and fill in your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Find these in your Supabase project under **Settings → API**.

Then start the dev server:

```bash
npm run dev
```

---

## Deployment

This template is configured for Netlify via `netlify.toml`. To connect a new project:

1. Push the repo to GitHub (the script does this automatically)
2. Go to [netlify.com](https://netlify.com) → Add new site → Import from GitHub
3. Select the repo — build settings are pre-configured
4. Add environment variables in **Site → Environment variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` (your Netlify URL or custom domain)
5. Deploy

The Netlify MCP can also check deployment status and environment config directly from Claude Code during the project setup routine.

---

## Repo structure

```
├── CLAUDE.md                   ← Claude Code reads this on every session open
├── .claude/
│   ├── project-setup.md        ← Startup routine: MCP checks → Notion → Linear
│   ├── design-psychology.md    ← Hick's Law, Gestalt, Fitts's, Jakob's, Cognitive Load
│   ├── ui-standards.md         ← shadcn · Tailwind · Lucide standards
│   └── ux-process.md           ← Research, personas, flows, IA, testing
├── app/
│   ├── globals.css             ← shadcn CSS variables (edit here to apply brand)
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ui/                     ← shadcn components land here (via npx shadcn add)
├── lib/
│   ├── utils.ts                ← cn() helper
│   └── supabase/
│       ├── client.ts           ← Browser Supabase client
│       └── server.ts           ← Server Supabase client (App Router)
├── supabase/
│   └── config.toml             ← Local Supabase dev config
├── public/
├── .env.example                ← Copy to .env.local and fill in keys
├── .gitignore
├── components.json             ← shadcn CLI config
├── netlify.toml                ← Netlify build + headers config
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## Applying your brand

All visual customisation flows through two files — nothing else needs to be touched:

**`app/globals.css`** — update the HSL values for `--primary`, `--accent`, `--radius`, and any other shadcn tokens. Use [ui.shadcn.com/themes](https://ui.shadcn.com/themes) to generate a full palette visually.

**`tailwind.config.ts`** — update `fontFamily.sans` to your chosen typeface. Add the font import to `layout.tsx` using `next/font`.

Both light (`:root`) and dark (`.dark`) variants are pre-wired. Update both when changing colours.

---

## Adding shadcn components

```bash
npx shadcn add button
npx shadcn add card dialog select table tabs
```

Components land in `components/ui/` and inherit your brand tokens automatically.

---

## Updating the template

If you improve the `.claude/` docs or the scaffold, update the template repo directly. Existing projects won't be affected — they took a snapshot at clone time. That's intentional: projects are independent once created.
