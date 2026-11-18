# Technology Stack & Trade-Off Analysis — Purrfect Garden

> **Document Status:** Phase 0 Architecture Specification  
> **Primary Product Reference:** [PURRFECT_GARDEN_PRD.md](../PURRFECT_GARDEN_PRD.md)

---

## 1. Host Environment Audit

Verified tooling currently installed on the development workstation (Windows):

| Tool / Runtime | Installed Version | Notes |
| :--- | :--- | :--- |
| **Node.js** | `v22.19.0` | LTS modern runtime, ready for Electron & TypeScript tooling. |
| **npm** | `10.9.3` | Built-in package manager ready for immediate use. |
| **Python** | `3.11.9` | Available for build scripts / native addon compilation (`node-gyp`) if needed. |
| **.NET SDK** | `9.0.305` | Available on host. |
| **Rust / Cargo** | *Not installed* | Would require installing Rustup, Cargo, and MSVC C++ build tools. |

---

## 2. Recommended Technology Stack

**Proposed Core Stack:** **Electron + electron-vite + React 19 + TypeScript + Tailwind CSS + SQLite (`better-sqlite3`)**

| Layer | Selected Technology | Justification |
| :--- | :--- | :--- |
| **Desktop Shell & Build** | **Electron + `electron-vite`** | Native Windows desktop wrapper with fast Vite HMR, clean separation of Main/Preload/Renderer bundles, system notifications, and native OS lifecycle hooks (`powerMonitor`, `before-quit`). |
| **UI Framework** | **React 19 + TypeScript (Strict)** | Industry-standard component model with strict type safety across IPC boundaries, forms, modals, and statistics views. |
| **Styling & Icons** | **Tailwind CSS + `lucide-react`** | Rapid layout styling for cozy, soft-palette desktop panels, paired with custom pixel-art utility classes (`image-rendering: pixelated; crisp-edges`). |
| **Renderer State** | **Zustand** | Minimal boilerplate, fine-grained subscriptions (prevents timer re-renders from causing unnecessary full-tree re-renders), and clean synchronization with Main process events. |
| **2D Isometric Garden** | **HTML5 Canvas 2D (with optional Pixi.js upgrade path)** | Deterministic 2:1 isometric projection, pixel-perfect integer scaling (`ctx.imageSmoothingEnabled = false`), painter's algorithm depth sorting, and crisp sprite animation without heavyweight 3D engine overhead. |
| **Audio & Ambience** | **Howler.js / Web Audio API** | Effortless simultaneous playback of primary music playlists (Lo-fi, Piano) and multi-layer ambient channels (Rain, Fireplace, Forest, Ocean Waves) with independent channel volumes and session-end fade-out. |
| **Local Persistence** | **SQLite 3 via `better-sqlite3`** | Fast, synchronous, embedded ACID-compliant relational database running inside the Main process with WAL mode enabled—ideal for local-first desktop software and zero-corruption persistence. |
| **Testing Suite** | **Vitest + React Testing Library** | Fast TypeScript-native test runner capable of testing timer state machines, XP ledgers, streak date boundaries, and real `:memory:` SQLite queries in milliseconds. |

---

## 3. Desktop Stack Trade-Off Evaluation

Three primary desktop options were evaluated against Purrfect Garden's requirements:

| Criterion | **Electron + React + SQLite** *(Recommended)* | **Tauri 2 (Rust) + React** | **.NET 9 (WPF / MAUI)** |
| :--- | :--- | :--- | :--- |
| **Environment Readiness** | **Immediate.** Node `v22.19` and `npm 10.9` are already installed. | **Requires Setup.** Rust/Cargo is absent; requires MSVC toolchain and `better-sqlite3`/Rust SQLite bindings. | **Ready.** `.NET 9.0.305` is installed. |
| **2D Isometric Pixel Art** | **Excellent.** Direct HTML5 Canvas / WebGL control with native crisp pixel scaling and abundant 2D ecosystem tools. | **Excellent** (uses WebView2 on Windows, identical web rendering). | **Moderate/Hard.** Custom isometric hit-testing, crisp pixel sprite animation, and cozy CSS-style animations require far more boilerplate in XAML/SkiaSharp. |
| **Multi-Channel Audio Mixer** | **Excellent.** Web Audio API & Howler.js natively support layered loops, crossfades, and per-track gain nodes. | **Good** (via WebView2 Web Audio, though Chromium codec support varies slightly). | **Moderate.** Requires third-party audio bindings (NAudio) and manual stream mixing. |
| **Timer & Lifecycle Reliability** | **High.** Electron Main process provides `powerMonitor` (`suspend`/`resume`), `before-quit`, and `close` hooks to flush SQLite state synchronously. | **High** (via Rust tray/window events, requires extra win32 sleep hooks). | **High** (native Win32 `SystemEvents.PowerModeChanged`). |
| **Memory Footprint** | **Moderate (~120–180 MB RAM).** Bundled Chromium adds baseline RAM usage. | **Low (~40–70 MB RAM).** Uses OS WebView2. | **Low–Moderate (~60–100 MB RAM).** |
| **Development Velocity** | **Highest.** Unified TypeScript language across Main, Shared Domain, UI, and Tests (`Vitest`). | **Medium.** Context-switching between Rust backend and TypeScript frontend slows down rapid Phase 1–3 iteration. | **Medium.** C# backend/UI split with less natural pixel-art styling ergonomics. |

### Why Electron Wins for Purrfect Garden
1. **Single-Language Velocity & Testability:** Sharing exact TypeScript domain models, validation rules, and `balanceConfig` types between Main (SQLite), Preload (IPC), and Renderer (React + Canvas) eliminates serialization mismatches and accelerates feature delivery.
2. **Audio & Visual Fidelity:** Purrfect Garden combines a cozy pixel-art diorama with multi-layered ambient soundscapes. Web Canvas + Web Audio API provide the cleanest, most reliable foundation for both without fighting native GUI toolkit limitations.
3. **Synchronous SQLite Safety:** `better-sqlite3` runs directly in the Node Main process, enabling instant synchronous transactional checkpoints on `before-quit` or `suspend` without async race conditions that could drop the final seconds of a focus session.
4. **Acceptable Trade-off:** On modern Windows desktops, ~150 MB RAM is negligible compared to the reliability and maintainability gains of a unified TypeScript + SQLite stack.

---

## 4. Key Libraries & Tooling Summary

| Package | Role | Process Scope |
| :--- | :--- | :--- |
| `electron` | Desktop windowing, native notifications, `powerMonitor`, lifecycle hooks | Main |
| `electron-vite` | Unified Vite build & HMR for Main, Preload, Renderer | Build |
| `better-sqlite3` | Embedded ACID SQLite database with WAL support | Main |
| `react`, `react-dom` | Desktop UI rendering | Renderer |
| `zustand` | Reactive client state stores | Renderer |
| `tailwindcss` | Cozy UI layout and design tokens | Renderer |
| `lucide-react` | Crisp UI icons | Renderer |
| `howler` | Multi-channel ambient sound mixer & music player | Renderer |
| `vitest` | Unit & integration test suite | Dev / Test |

