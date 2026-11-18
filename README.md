# Purrfect Garden

> *"The garden grows when you grow."*

**Purrfect Garden** is a cozy, local-first desktop focus timer and 100% pixel-art garden companion built with **Electron**, **React 19**, **TypeScript**, and **SQLite (`better-sqlite3`)**.

---

## Implemented Features

### 1. Focus Timer & Cozy Ambient Mode
- **Modes:** Pomodoro (configurable work / short break / long break / cycles), Stopwatch, and Custom Countdown.
- **Authoritative Monotonic Timing:** Elapsed time is tracked in the Electron Main Process rather than UI frame counting.
- **Session Persistence & Recovery:** Automatically pauses active sessions on app close or system suspend and restores them without adding offline elapsed time.
- **Balanced Rules (`src/shared/config/balanceConfig.ts`):**
  - Default XP rate: `1 XP / valid focus minute` + `+5 XP` target completion bonus.
  - Early-stop threshold (`60s` default): short focus sessions are still saved to history, but earn `0 XP`.
  - Break phases never grant focus XP or inflate focus statistics.
- **Cozy Ambient Mode:** Distraction-free pixel focus screen with companion pet status, active task badge, large countdown clock, and quick Lo-fi toggle.

### 2. 3/4 Top-Down Pixel-Art Garden
- **Pixel Farming Village (`640×400` Canvas):** Cozy timber farmhouse, red gambrel barn, stone silo, windmill, roofed well, fruit trees, raised vegetable beds, water canal & wooden bridge, and farm animals.
- **Interactive Courtyard (`12×12` grid):** Place, move, remove, zoom, and clear items (`plants`, `seeds`, `tools`, `technologies`, `decor`) with fertile tilled soil tiles automatically rendered under placed crops.
- **Stardew-Style Wooden Hotbar & Compact Timer:** Docked bottom item slots alongside a right-docked Compact Timer panel for controlling focus sessions directly inside Garden view.
- **Dynamic Pixel Weather:** Switch between `Sunny`, `Rain`, `Petals`, and `Starlight` atmospheres.

### 3. Tasks, Goals, Streaks & Analytics
- **Tasks:** Create, edit, filter (`Today`, `Incomplete`, `Completed`, `Overdue`, `All`), prioritize, and link tasks to focus sessions.
- **Daily & Weekly Goals + Streaks:** Configurable `20-minute` daily focus threshold for streaks, automatic period rollovers, and idempotent XP reward claims.
- **Statistics:** Daily/weekly/monthly totals, 7-day trend chart, task time breakdown, 12-week activity heatmap, and session history.

### 4. XP Economy, Collection & Achievement Book
- **Atomic XP Ledger:** `xp_transactions` table with `balance_after >= 0` enforcement and duplicate one-time reward guards.
- **Collection & XP Exchange:** Spend earned XP on seeds, plants, tools, technologies, decor, and Pet Companion Tickets.
- **Achievement Book:** 16 achievements across 8 categories (`focus_master`, `consistency`, `green_thumb`, `explorer`, `collector`, `pet_lover`, `early_bird`, `night_owl`) with XP and ticket rewards.

### 5. Pet System & Cozy Gacha
- **Curated Companion Roster:** 9 pixel-art companions strictly scoped to **Cats, Dogs, and Capybaras** across `Common`, `Rare`, `Epic`, and `Legendary` tiers.
- **Fair In-App Gacha (No Real Money):** Roll using earned Pet Companion Tickets (`1 Ticket`) or Focus XP (`100 XP`).
- **Transparent Rates & Pity Guarantee:** `65% Common / 25% Rare / 8% Epic / 2% Legendary`, guaranteed `Rare+` within every `10` pulls, and automatic `+25 XP` duplicate rebates.
- **Garden Deployment & Nicknames:** Give custom nicknames to owned companions and deploy/recall them into the garden courtyard.

### 6. Cozy Music & Ambient Soundscape Mixer
- Built-in Web Audio synthesizer playlists paired with a 4-layer ambient mixer (`Rain`, `Fireplace`, `Forest`, `Ocean Waves`), master volume control, and optional session-end fade-out.

---

## Tech Stack

- **Desktop Shell & IPC:** Electron + typed `contextBridge` preload API
- **Frontend:** React 19, TypeScript, Zustand, Tailwind CSS (100% custom `16×16` / `24×24` / `32×32` pixel-art sprites & canvas)
- **Local Persistence:** SQLite via `better-sqlite3` (WAL mode + versioned migrations)
- **Build & Test:** `electron-vite`, Vite, Vitest

---

## Project Structure

```text
├── PURRFECT_GARDEN_PRD.md
├── docs/
│   └── architecture/
│       ├── AGENT_WORKFLOW.md
│       ├── DATABASE_DESIGN.md
│       ├── DEVELOPMENT_ROADMAP.md
│       ├── SYSTEM_ARCHITECTURE.md
│       └── TECH_STACK.md
├── src/
│   ├── main/           # Electron main process, SQLite migrator, services & IPC handlers
│   ├── preload/        # Typed contextBridge API
│   ├── renderer/       # React UI, Zustand stores, pixel-art canvas & sprites
│   └── shared/         # Shared domain types, balance config, IPC channels, math utils
└── tests/
    ├── integration/    # SQLite migration & foundation integration tests
    └── unit/           # Timer, tasks, goals/streaks, garden, progression, music & gacha tests
```

---

## Getting Started

### Prerequisites
- **Node.js** `22.x` (or compatible LTS)
- **npm**

### Install & Run

```bash
npm install
npm run dev
```

> **Windows Note:** If your IDE terminal exports `ELECTRON_RUN_AS_NODE=1`, clear it before launching Electron in dev mode:
> ```powershell
> Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
> npm run dev
> ```

### Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start Electron + Vite dev server with hot reload (`http://localhost:5173`) |
| `npm run build` | Build production `main`, `preload`, and `renderer` bundles via `electron-vite` |
| `npm run preview` | Preview the built Electron application |
| `npm run typecheck` | Run TypeScript type checking (`tsc --noEmit`) |
| `npm test` | Run the Vitest unit & integration test suite (`vitest run`) |

---

## Documentation

- Product Requirements: [PURRFECT_GARDEN_PRD.md](PURRFECT_GARDEN_PRD.md)
- System Architecture: [docs/architecture/SYSTEM_ARCHITECTURE.md](docs/architecture/SYSTEM_ARCHITECTURE.md)
- Database Design: [docs/architecture/DATABASE_DESIGN.md](docs/architecture/DATABASE_DESIGN.md)
- Development Roadmap: [docs/architecture/DEVELOPMENT_ROADMAP.md](docs/architecture/DEVELOPMENT_ROADMAP.md)
- Tech Stack: [docs/architecture/TECH_STACK.md](docs/architecture/TECH_STACK.md)
- Agent Workflow: [docs/architecture/AGENT_WORKFLOW.md](docs/architecture/AGENT_WORKFLOW.md)
