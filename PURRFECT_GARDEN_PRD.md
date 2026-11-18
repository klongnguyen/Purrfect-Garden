# PURRFECT GARDEN

## Product Requirements Document (PRD)

-   **Tên dự án:** Purrfect Garden (working title)
-   **Phiên bản tài liệu:** 1.0
-   **Trạng thái:** Initial product specification
-   **Loại sản phẩm:** Desktop application
-   **Nền tảng ưu tiên:** Windows
-   **Lưu trữ:** Local-first; cloud synchronization is out of scope for
    the initial release
-   **Ngôn ngữ tài liệu:** English technical labels with Vietnamese
    product context

------------------------------------------------------------------------

## 1. Product Overview

### 1.1. Product vision

Purrfect Garden is a cozy focus and study desktop application combined
with a lightweight pixel-art garden collection and progression
experience.

The central idea is:

> **The garden grows when you grow.**

Users grow their virtual garden by spending real, intentionally tracked
time focusing on study or work. Focus sessions generate progression
rewards such as XP, seeds, plants, tools, technologies, and pet-related
rewards. The garden provides a calm, visible sense of progress without
becoming a complex farming or simulation game.

The application should feel peaceful, warm, cute, and inviting. Its
visual direction is inspired by cozy pixel-art life simulation games
such as Stardew Valley, but should use a somewhat brighter and softer
palette.

### 1.2. Product principles

1.  **Focus comes first.** The timer is the most important feature and
    must be reliable.
2.  **The garden rewards real effort.** Garden progression is connected
    to recorded focus activity and achievements.
3.  **Cozy, not demanding.** The application should encourage
    consistency without punishing users for resting.
4.  **Collection over economy.** Plants and garden objects are primarily
    for collecting and decorating, not selling or trading.
5.  **Lightweight game scope.** This is not a farming RPG. Do not
    introduce player movement, combat, quests requiring character
    control, complex crafting, or a trading economy.
6.  **User creativity.** Users arrange and customize their own gardens.
7.  **Local-first.** User data should remain on the user's device in the
    initial version, with a design that can accommodate cloud sync
    later.

### 1.3. Target experience

The user opens the app, sees a prominent focus timer, starts a study
session, and optionally listens to ambient music. When the session is
completed or stopped, the application records the valid time and updates
progress. The user earns XP and rewards, completes goals, maintains
streaks, unlocks achievements, and uses earned resources to build and
personalize one or more gardens.

------------------------------------------------------------------------

## 2. Platform and Scope

### 2.1. Platform

-   Build a desktop application, initially targeting Windows.
-   The app should be usable as a standalone desktop experience.
-   Design the data and service layers so that cloud storage and
    synchronization can be added later.
-   Do not require an account or internet connection for core
    functionality.

### 2.2. Local-first storage

Persist locally: - Focus sessions and focus statistics. - Timer
preferences. - Tasks and task completion states. - Daily and weekly goal
progress. - Streak history. - XP balance and reward transactions. -
Achievements and unlock states. - Inventory and collection records. -
Garden areas and user-created layouts. - Pets and pet collection. -
Music preferences and application settings.

Use a structured local database or another reliable persistence
mechanism. Avoid keeping important user progress only in transient UI
state.

### 2.3. Out of scope for the initial product

-   Cloud accounts, login, and synchronization.
-   Multiplayer, social feeds, and leaderboards.
-   Real-money purchases or monetization.
-   Selling, trading, or market pricing of harvested products.
-   Character movement or direct character control.
-   Complex farming simulation, combat, or RPG mechanics.
-   Mobile application.
-   User-generated online marketplace or mod marketplace.

------------------------------------------------------------------------

## 3. Core Navigation and Information Architecture

The application should use a desktop layout with a left sidebar and a
main content area.

Suggested navigation:

  Section        Purpose
  -------------- ------------------------------------------------------
  Home / Focus   Main timer, focus controls, daily overview
  Garden         Garden areas and garden customization
  Tasks          Today's tasks and task management
  Goals          Daily and weekly goals
  Achievements   Achievement catalog and progress
  Collection     Plants, seeds, tools, technologies, and collectibles
  Pets           Pet collection and gacha
  Music          Playlists and ambient sound controls
  Statistics     Focus history and study statistics
  Settings       Timer, audio, appearance, and application settings

The navigation can be adjusted during UI implementation, but the timer
must remain easy to access from the primary experience.

------------------------------------------------------------------------

## 4. Focus System --- Highest Priority

The Focus System is the core of the product. Timer correctness, reliable
session recording, and recovery behavior take priority over game
features.

### 4.1. Timer modes

The initial release must support all three modes:

1.  **Pomodoro**
    -   Work and break cycles.
    -   Default work/break durations can be proposed by the
        implementation, but must be configurable.
    -   Support configurable long breaks and cycle counts if practical.
    -   Automatically transition between work and break only when the
        user enables that behavior.
2.  **Stopwatch**
    -   Counts upward from zero.
    -   User starts and stops the session manually.
3.  **Custom Timer**
    -   User chooses a target duration.
    -   The timer counts down to zero.
    -   User can stop early.
    -   Completion triggers a clear notification or sound, subject to
        settings.

### 4.2. Session controls

-   Start.
-   Pause.
-   Resume.
-   Stop / Finish.
-   Reset, with confirmation where needed.
-   Skip break or move to the next Pomodoro phase, if supported.
-   Select timer mode.
-   Configure timer durations.
-   Configure notification sounds.
-   Optional fullscreen focus mode.

### 4.3. Time recording rules

These rules are confirmed product requirements:

-   A focus session is recorded only after the user explicitly presses
    **Start**.
-   The session ends when the user explicitly presses **Stop/Finish**,
    or when a configured timer reaches completion.
-   Time spent outside an active session must never be counted.
-   The app must not infer focus time from computer activity, keyboard
    input, or mouse activity.
-   If the user closes or exits the application while a session is
    running, the session must be paused. It must not continue
    accumulating time in the background.
-   When the user reopens the application, restore the paused session
    state and allow the user to resume or finish it.
-   Do not silently award time for a period when the application was
    closed.

Implementation note: persist session state and elapsed time safely. Use
a monotonic timing strategy while the process is active to avoid timer
drift. Persist enough state to restore a paused session after restart.

### 4.4. Focus session data

A focus session should support at least: - Session identifier. - Start
timestamp. - End timestamp, if completed. - Recorded duration. - Timer
mode. - Session status (active, paused, completed, stopped,
interrupted). - Associated task, optional. - Whether the session was a
focus phase or break phase. - XP/reward calculation reference, where
applicable.

Do not require users to name sessions. Session naming is intentionally
excluded from the initial requirements.

### 4.5. Focus history and statistics

Provide: - Today's focus time. - Total focus time. - Daily, weekly, and
monthly summaries. - Session history. - Number of completed sessions. -
Average session duration. - Calendar heatmap or equivalent activity
calendar. - Optional breakdown by task, when sessions are linked to
tasks.

Break time should not count as focus time for XP or focus goals unless a
future rule explicitly says otherwise.

### 4.6. Focus fullscreen / ambient mode

Provide a distraction-reduced mode: - Large timer. - Minimal controls. -
Optional music controls. - Optional subtle pixel-art animation. - Avoid
unnecessary notifications and busy UI. - The garden should not compete
visually with the timer during active focus.

### 4.7. Focus and garden presentation

The default Home / Focus screen: - Timer is the visual center and
primary interaction. - Garden is visible as a background or secondary
visual element. - The user can switch to Garden view using a clear
navigation control.

When Garden view is selected: - Garden becomes the main content. - Timer
remains visible in a panel on the right. - The timer must remain usable
without leaving Garden view.

------------------------------------------------------------------------

## 5. Music System

The Music System creates a calm study atmosphere.

### 5.1. Sound categories

Suggested categories: - Lo-fi. - Rain. - Forest ambience. - Fireplace. -
Ocean waves. - Piano. - Nature sounds.

### 5.2. Features

-   Play / pause.
-   Volume control.
-   Playlist selection.
-   Favorite playlists or tracks.
-   Random playback.
-   Background sound mixer for combining supported ambience layers.
-   Optional automatic volume adjustment or fade-out at the end of a
    focus session.
-   Music preferences persist locally.

### 5.3. Audio content constraints

Use original audio, properly licensed audio, public-domain audio, or
sources whose terms explicitly permit the intended use. Do not bundle
copyrighted commercial music without permission.

The app should remain functional if no music assets are installed or
available.

------------------------------------------------------------------------

## 6. Task Management

Task management should be simple and focused on the user's current day,
not a full project-management suite.

### 6.1. Task features

-   Create task.
-   Edit task.
-   Delete task.
-   Mark task as complete / incomplete.
-   Set priority: Low, Medium, High.
-   Set optional deadline.
-   Set category, such as Study, Work, or Personal.
-   Set optional estimated duration.
-   Link a focus session to a task.

### 6.2. Task views

-   Today's tasks.
-   Completed tasks.
-   Incomplete tasks.
-   Optional overdue tasks.
-   Simple progress summary.

### 6.3. Task and focus integration

A user may select an existing task before starting a focus session or
associate it afterward. Statistics may show the total focus time spent
on each task.

Do not require a task to start a focus session.

------------------------------------------------------------------------

## 7. Daily and Weekly Goals

Goals provide short-term direction and reward consistency.

### 7.1. Goal types

Support a variety of goal templates, including: - Focus for a specified
number of minutes. - Complete a specified number of focus sessions. -
Complete a specified number of tasks. - Complete a session of at least a
specified duration. - Study across multiple days or subjects, if the
data model supports it. - Complete a lighter focus session after a rest
day.

### 7.2. Goal periods

-   Daily goals.
-   Weekly goals.
-   Monthly goals may be considered in a later iteration.

### 7.3. Goal behavior

-   Show progress toward each goal.
-   Clearly show completed and incomplete goals.
-   Award XP or configured rewards when goals are completed.
-   Prevent duplicate reward claims for the same goal instance.
-   Refresh daily and weekly goals according to the user's local date
    and configured timezone.
-   Keep historical goal completion records for statistics and
    achievements.

### 7.4. Goal variety

Avoid showing exactly the same set of goals every day. Use a pool of
goal templates and selection rules. Ensure goals are achievable and do
not encourage unhealthy overwork.

Exact goal catalog, difficulty levels, XP values, and selection
algorithms are to be balanced in a later product-design step.

------------------------------------------------------------------------

## 8. Streak System

A streak represents consecutive calendar days on which the user meets
the minimum focus requirement.

### 8.1. Initial proposed rule

-   A day counts toward a streak when the user records at least **20
    minutes of valid focus time** on that local calendar day.
-   Only completed/valid focus time counts; break time does not.
-   The streak uses the user's local date.
-   Show current streak and longest streak.
-   Show a calendar heatmap or activity calendar.

The 20-minute threshold is a proposed initial default and should be
configurable or revisited during balancing.

### 8.2. Milestones and rewards

Suggested milestones: - 3 days. - 7 days. - 14 days. - 30 days. - 60
days. - 100 days.

Possible rewards: - Seed packs. - Special pots or plants. - Decorative
items. - Pet-related rewards. - Garden-area unlock progress.

### 8.3. Streak protection

A Streak Freeze item may protect a streak for an eligible missed day.
This is a proposed feature, not a requirement to complete before the
core timer and streak tracking work.

Streak rules must be transparent. Do not use guilt-inducing language or
punish users for taking breaks.

------------------------------------------------------------------------

## 9. Achievement System

Achievements recognize different kinds of progress and provide long-term
goals.

### 9.1. Achievement categories

-   **Focus Master:** total focus time and completed sessions.
-   **Consistency:** streaks and regular study habits.
-   **Green Thumb:** plants collected or planted.
-   **Explorer:** garden areas unlocked.
-   **Collector:** collection milestones.
-   **Pet Lover:** pets collected.
-   **Early Bird:** focus sessions during morning hours.
-   **Night Owl:** focus sessions during evening or night hours.

### 9.2. Achievement tiers

Suggested tiers: - Bronze. - Silver. - Gold.

### 9.3. Achievement behavior

Each achievement should define: - Name. - Description. - Category. -
Tier or rarity. - Unlock condition. - Progress value and target, if
applicable. - Reward, if any. - Unlock timestamp. - Whether it has been
viewed by the user.

Achievements should be tracked reliably and should not be awarded more
than once unless explicitly designed as repeatable.

------------------------------------------------------------------------

## 10. XP and Reward Economy

The progression economy connects focus activity to garden customization.

### 10.1. Confirmed direction

-   Users earn XP through valid focus activity and eligible progression
    events.
-   Users spend XP to exchange for items.
-   Rewards may also be granted directly from daily goals, streak
    milestones, achievements, and other defined events.
-   No real-money purchases.
-   Gacha may use earned tickets and/or in-app currency, but never real
    money.

### 10.2. Potential reward categories

-   Plants.
-   Seeds.
-   Tools.
-   Technologies.
-   Garden-area unlocks.
-   Pet gacha tickets.
-   Decorative or collectible items, if later approved.

### 10.3. Economy rules

-   All XP grants and spends should be recorded in a transaction
    history.
-   The XP balance must not become negative.
-   A reward should not be granted twice for the same one-time event.
-   The user should see the cost before exchanging XP.
-   Avoid pay-to-win or real-money mechanics.
-   Do not add selling, trading, or a complex player economy.

### 10.4. Balancing status

Exact XP per minute, session bonuses, item prices, gacha probabilities,
and reward quantities are **not finalized**. Keep these values in
configuration or data tables rather than hardcoding them throughout the
application.

------------------------------------------------------------------------

## 11. Garden System

The Garden System is the visual reward space and a major personalization
feature.

### 11.1. Confirmed garden content scope

The initial garden domain includes: - **Plants** - **Seeds** -
**Tools** - **Technology** - **Animals** - **Garden Areas**

Do not add a complex crop-selling or trading system.

### 11.2. User customization

Users should be able to set up and personalize their own garden. The
garden is not only an automatic reward display.

Support, subject to implementation planning: - Selecting a garden
area. - Placing owned plants and objects. - Moving and removing placed
objects. - Selecting from owned inventory. - Saving the garden layout. -
Switching between unlocked garden areas.

The user wants both: 1. Garden progression that reflects focus activity
and earned rewards. 2. Direct user customization and arrangement of the
garden.

### 11.3. Visual perspective

-   Use **2D isometric pixel art**.
-   The garden should feel cozy, bright, peaceful, and readable.
-   Avoid a dark or overly muted palette; use a somewhat brighter
    palette than the visual inspiration.
-   Use pixel-art assets consistently in scale, perspective, lighting,
    and palette.
-   Garden view should feel like a small diorama rather than a
    controllable character game.

### 11.4. Multiple gardens

-   Support multiple garden areas with distinct themes.
-   New areas may be unlocked through achievements or progression
    milestones.
-   Unlocking a new garden must not delete or replace older gardens.
-   Each garden retains its own layout and placed objects.
-   The user can switch between unlocked gardens.

Possible future themes include spring, autumn, winter, and magical
gardens. These are examples, not a fixed launch requirement.

### 11.5. Garden progression

Focus activity, goals, streaks, achievements, and XP can unlock or
provide: - Seeds. - Plants. - Tools. - Technologies. - Animals. - New
garden areas.

The exact effects of tools and technologies are not finalized. Do not
invent complex automation or farming mechanics without approval.

### 11.6. Collection-first philosophy

Plants and other garden items are primarily collectibles and
customization assets. They are not intended to create a market, trading
loop, or crop-selling economy.

------------------------------------------------------------------------

## 12. Pet System and Gacha

### 12.1. Initial pet types

The initial pet scope is limited to: - Cats. - Dogs. - Capybaras.

Do not include bears in the initial version.

### 12.2. Pet features

-   Pet collection / album.
-   Pet rarity or collection tiers.
-   Pet details and descriptions.
-   Ability to place or display owned pets in eligible garden areas,
    subject to the garden placement design.
-   Distinct visual appearance and simple idle animations where assets
    allow.

### 12.3. Gacha rules

-   Gacha uses only in-app rewards, such as earned tickets or earned
    currency.
-   No real-money purchases.
-   Display probability information clearly.
-   Consider a pity system or guaranteed reward after a defined number
    of attempts.
-   Prevent accidental duplicate reward ambiguity; define whether
    duplicates convert to another reward or remain duplicate collection
    counts.

Exact rarity rates, pity thresholds, and duplicate handling are not
finalized.

------------------------------------------------------------------------

## 13. Collection and Journal

Provide a collection-oriented interface for the user's progress.

Suggested collection groups: - Plants discovered / owned. - Seeds
owned. - Tools unlocked. - Technologies unlocked. - Pets collected. -
Garden areas unlocked. - Achievements earned.

Each collectible may include: - Name. - Pixel-art icon or sprite. -
Description. - Rarity or category, if applicable. - Acquisition date. -
Unlock condition or source.

A journal or album can provide a historical record of milestones and
discoveries. Keep this lightweight and avoid turning it into a large
narrative system in the initial release.

------------------------------------------------------------------------

## 14. Visual and Interaction Design

### 14.1. Art direction

-   Cozy pixel art.
-   Inspired by the warmth and charm of Stardew Valley, but not copying
    its assets, characters, maps, UI, or distinctive artwork.
-   Slightly brighter, softer, and more cheerful palette.
-   Cute cats and other small animals.
-   Calm, welcoming, low-pressure atmosphere.
-   Consistent pixel density and sprite scale.

### 14.2. Main Focus screen

The main screen should prioritize: 1. Timer mode and timer display. 2.
Start / Pause / Resume / Stop controls. 3. Music access. 4. Today's
focus progress. 5. Daily goals. 6. Today's tasks. 7. Current streak. 8.
Garden as a secondary background or visual area.

Avoid crowding the main screen. Use secondary panels, pages, or
collapsible sections for detailed information.

### 14.3. Garden screen

When the user switches to Garden: - Garden becomes the main visual
area. - The timer remains visible in a panel on the right. - Garden
customization controls should be accessible but should not overwhelm the
scene. - The user can switch between garden areas without losing saved
layouts.

### 14.4. Accessibility and usability

-   Readable typography and contrast.
-   Clear timer states.
-   Keyboard shortcuts may be added for common timer actions.
-   Important actions should provide feedback.
-   Destructive actions should ask for confirmation.
-   Animations should be subtle and should not reduce timer readability.
-   Provide settings to reduce or disable distracting animations and
    sounds where practical.

------------------------------------------------------------------------

## 15. Notifications and Feedback

Potential notifications: - Focus timer completed. - Break completed. -
Daily goal completed. - Streak milestone reached. - Achievement
unlocked. - Reward received.

Notifications should be configurable. Avoid excessive notifications,
especially during active focus sessions.

------------------------------------------------------------------------

## 16. Data and Domain Model --- Initial Entities

The following is a conceptual starting point, not a finalized database
schema.

  -----------------------------------------------------------------------
  Entity                              Responsibility
  ----------------------------------- -----------------------------------
  FocusSession                        Recorded focus and break sessions

  TimerPreference                     Pomodoro, stopwatch, and custom
                                      timer settings

  Task                                User tasks and completion state

  GoalTemplate                        Reusable daily/weekly goal
                                      definitions

  GoalInstance                        A goal assigned to a particular
                                      period

  GoalProgress                        Progress toward a goal

  DailyActivity                       Per-day focus totals and activity

  StreakState                         Current and longest streak

  AchievementDefinition               Achievement catalog and unlock
                                      rules

  UserAchievement                     User achievement progress and
                                      unlock state

  XPTransaction                       XP earned and spent

  ItemDefinition                      Catalog of plants, seeds, tools,
                                      technologies, and other items

  InventoryItem                       User-owned item quantities

  GardenAreaDefinition                Available garden areas

  UserGarden                          User's unlocked garden areas

  GardenPlacement                     Item positions and layout in a
                                      garden

  PetDefinition                       Pet catalog

  UserPet                             Pets owned by the user

  GachaHistory                        Gacha attempts and results

  MusicPreference                     Audio preferences

  AppSetting                          General application settings
  -----------------------------------------------------------------------

### Data integrity requirements

-   Use stable identifiers.
-   Store timestamps consistently and interpret daily boundaries using
    the user's local timezone.
-   Persist focus sessions and reward transactions reliably.
-   Use database transactions for operations that update multiple
    related records, such as spending XP and granting an item.
-   Keep reward and XP changes auditable.
-   Do not derive the user's entire progress only from UI state.

------------------------------------------------------------------------

## 17. Technical Architecture Guidance

The implementation technology has not yet been selected. The coding
agent should propose a suitable desktop stack before implementation or
follow a stack explicitly supplied by the project owner.

Regardless of stack: - Separate UI, application logic, domain rules, and
persistence. - Keep timer logic independent from rendering. - Keep XP
and reward calculations in a dedicated service or domain module. - Keep
garden layout logic separate from focus tracking. - Use local
persistence behind a repository/data-access layer. - Keep game content
and balancing values data-driven where practical. - Design interfaces so
a future cloud repository/synchronization layer can be introduced
without rewriting core domain logic. - Avoid premature microservices or
unnecessary distributed architecture for a single-user local desktop
application.

### Timer reliability

The timer must not depend on UI frame counts or repeated UI increments
as its source of truth. Use a reliable elapsed-time calculation while
the app is active, and persist state on important transitions.

### Asset pipeline

-   Use original, commissioned, public-domain, or appropriately licensed
    assets.
-   Keep sprite assets organized by category.
-   Define consistent tile size, sprite scale, and isometric grid
    conventions.
-   Avoid using Stardew Valley assets or other copyrighted game assets.

------------------------------------------------------------------------

## 18. MVP and Development Roadmap

### Phase 1 --- Core productivity MVP

Priority: highest.

-   Desktop shell and navigation.
-   Main Focus screen.
-   Pomodoro timer.
-   Stopwatch.
-   Custom timer.
-   Start / Pause / Resume / Stop behavior.
-   Pause active session when application exits.
-   Restore paused session after reopening.
-   Reliable local focus-session history.
-   Today's focus total and basic statistics.
-   Music player with a small set of legally usable audio assets.
-   Task CRUD and completion.
-   Basic daily goals.
-   Basic streak tracking.
-   Local settings and persistence.
-   Basic garden screen with isometric presentation and saved layout.

### Phase 2 --- Garden progression and collection

-   XP earning and spending.
-   Reward catalog.
-   Seeds and plants.
-   Tools and technologies.
-   Garden inventory.
-   Garden placement and customization.
-   Multiple garden areas.
-   Garden unlock progression.
-   Achievement catalog and progress.
-   Collection / journal.
-   Weekly goals and richer statistics.

### Phase 3 --- Pets and extended cozy experience

-   Cats, dogs, and capybaras.
-   Pet collection.
-   Gacha tickets and in-app reward currency.
-   Gacha probability display and duplicate handling.
-   Pet placement in gardens.
-   More garden themes and assets.
-   Ambient mode improvements.
-   Seasonal and weather visuals, if desired.

The phases are a suggested sequence. The timer and reliable local
persistence must not be delayed by decorative or game-related work.

------------------------------------------------------------------------

## 19. Acceptance Criteria for the First Usable Version

The first usable version should satisfy all of the following:

### Focus

-   User can start, pause, resume, and stop a Pomodoro session.
-   User can use a stopwatch.
-   User can configure and use a custom countdown timer.
-   Only explicitly started focus sessions count.
-   Closing the app pauses the current session.
-   Reopening the app restores the session as paused.
-   No time is added while the app is closed.
-   Completed/stopped session records persist after restart.
-   Break time is excluded from focus totals.

### Tasks

-   User can create, edit, delete, and complete tasks.
-   Tasks remain available after application restart.
-   A task can optionally be associated with a focus session.

### Goals and streaks

-   Daily goal progress reflects valid focus time and supported task
    events.
-   A completed goal cannot award the same one-time reward repeatedly.
-   Streak progress follows the configured daily minimum and local
    calendar day.
-   Current and longest streak are displayed.

### Garden

-   User can open Garden view.
-   Garden view uses an isometric pixel-art presentation.
-   Timer remains visible on the right in Garden view.
-   User can arrange owned garden objects.
-   Garden layout persists after application restart.
-   Multiple garden areas can exist without replacing previous layouts.

### Local data

-   Core data survives application restart.
-   XP and item transactions cannot accidentally create negative
    balances or duplicate one-time rewards.
-   No account or cloud connection is required.

------------------------------------------------------------------------

## 20. Open Decisions --- Do Not Invent Without Product Approval

The following details still require balancing or a later design
decision:

1.  Desktop framework and programming language.
2.  Exact default Pomodoro durations and break-cycle behavior.
3.  Whether a completed custom timer automatically records a session or
    asks for confirmation.
4.  Whether stopping early records the elapsed focus time and under what
    minimum threshold.
5.  Exact XP per minute/session and any session bonuses.
6.  XP prices for seeds, plants, tools, technologies, and other items.
7.  Exact daily and weekly goal catalog and selection rules.
8.  Whether the 20-minute streak threshold is configurable.
9.  Streak Freeze availability and rules.
10. Achievement catalog, thresholds, and rewards.
11. Exact plant and seed catalog.
12. Exact function of tools and technologies.
13. Garden tile dimensions, placement rules, and collision behavior.
14. Number of garden areas available initially and unlock conditions.
15. Pet rarity tiers, gacha rates, pity rules, and duplicate handling.
16. Music asset sources and supported audio formats.
17. Whether application startup should restore the last opened page or
    always open Focus.

Where a decision is needed for a prototype, the agent may propose a
sensible default, document it, and keep it configurable. It must not
silently turn an unapproved proposal into a fixed product requirement.

------------------------------------------------------------------------

## 21. Instructions for the AI Coding Agent

Before writing implementation code:

1.  Read this entire PRD.
2.  Summarize the product vision, confirmed requirements, constraints,
    and open decisions.
3.  Propose a suitable desktop technology stack and explain the
    trade-offs.
4.  Propose the application architecture and local persistence approach.
5.  Propose the initial database/domain model.
6.  Propose the main screen layout and navigation.
7.  Identify technical risks, especially timer accuracy, app-exit
    handling, local data integrity, and isometric garden rendering.
8.  Present an implementation plan divided into small, testable
    milestones.
9.  Ask for approval of the proposed stack and plan before large-scale
    implementation.

During implementation:

-   Prioritize timer correctness and data integrity.
-   Do not expand the product into a complex farming or RPG game.
-   Do not add character movement or direct character control.
-   Do not add real-money purchases.
-   Do not add selling or trading of crops or collectibles.
-   Do not add bears to the initial pet roster.
-   Do not remove or replace previously unlocked gardens.
-   Do not count time while the application is closed.
-   Do not use copyrighted game assets without permission.
-   Keep the UI cozy, bright, pixel-art, and productivity-focused.
-   Keep uncertain balancing values configurable.
-   Add tests for timer state transitions, session persistence, XP
    transactions, goal rewards, and streak calculations.

------------------------------------------------------------------------

## 22. Product Success Criteria

The initial product is successful if:

-   The timer is dependable enough to be used every day.
-   Users can quickly start a focus session without navigating through
    game menus.
-   Focus history and task progress are understandable.
-   The garden provides a satisfying visual reward for consistent
    effort.
-   Garden customization feels personal without requiring complex
    gameplay.
-   The application remains lightweight and calm.
-   The product encourages sustainable study habits rather than
    maximizing screen time.

**Product north star:** Help users build a consistent focus habit by
giving their effort a peaceful, visible, and collectible home.
