# Hero Story Roadmap

## Purpose

The current prototype proves the core loop: collect a user goal, generate a story
frame, propose a quest, collect the outcome, and turn that outcome into the next
story beat.

The next goal is to make the app viable to iterate on. That means moving from a
client-only, single-session experience to a durable workflow where users can:

- complete one quest and receive the next one;
- refresh or return later without losing progress;
- see current story progress and quest history;
- eventually manage multiple stories;
- eventually use real account management across devices.

This roadmap favors incremental migration. The app should keep the working flow
intact while persistence, identity, and backend orchestration are introduced one
piece at a time.

## Current State

The app is currently a client-orchestrated prototype.

- Onboarding input lives in the Zustand store in `src/state/onboarding.ts`.
- Story, quest, and result generation are triggered by React Query hooks in the
  frontend.
- The frontend calls generic backend routes:
  - `/api/generate/data`
  - `/api/generate/image`
- Those backend routes call the AI provider and return generated data, but they
  do not write durable application state.
- Supabase exists as a basic client integration and test route, but it is not yet
  the source of truth for the story flow.
- Query keys are based on prompt inputs such as name, goal, challenge, task, and
  result text instead of durable story or quest IDs.
- The hidden recommended task and the visible quest can currently be regenerated
  independently, which is more workflow surface than the product needs.

This is good for proving the experience, but it creates problems as soon as the
app needs real iteration:

- progress disappears on refresh or browser changes;
- completed quest results are not stored;
- the app cannot reliably know which quest is active;
- regenerating and completing quests can drift from what the user actually saw;
- multiple stories and user separation have no stable foundation.

## Target Architecture

The target direction is backend-owned workflow state with Supabase as the durable
store.

The frontend should remain responsible for presentation, local form drafts, and
interaction state. The backend should own operations that create or mutate durable
story state, especially when AI generation is involved.

Recommended boundary:

- The frontend sends domain actions: create story, generate quest, accept quest,
  complete quest, get next quest.
- The backend validates the user, calls AI helpers, writes Supabase rows, stores
  generated images, and returns the resulting domain record.
- The frontend renders returned records immediately and can also refetch by ID.
- Supabase anonymous auth separates users first; full sign-in can be added later.
- Generated images are uploaded to Supabase Storage. Database rows store storage
  paths and display URLs, not raw base64 blobs.
- The hidden recommended task and visible quest are treated as one quest proposal
  unit. They may still be produced by two internal AI helper calls, but the UI and
  persisted workflow regenerate and store them together.

This keeps generation and persistence from diverging. If the backend returns a
quest to the frontend, that quest should already exist in durable storage.

## Core Data Model

Do not over-model the first pass, but introduce stable IDs and ownership from the
start.

### Users

Use Supabase Auth as the identity source.

Initial path:

- enable anonymous auth;
- create or retrieve an anonymous session when the app starts;
- attach every story to `auth.users.id`;
- write RLS policies so users can only read and mutate their own records.

Later path:

- allow anonymous users to upgrade to email, OAuth, or another sign-in method;
- preserve existing stories during account upgrade;
- add profile fields only when the product needs them.

### Stories

A story is the long-running container for a user goal.

Conceptual fields:

- `id`
- `user_id`
- `name`
- `goal`
- `challenge`
- `status`: `draft`, `active`, `paused`, `completed`, `archived`
- `blueprint`: generated story blueprint JSON
- `blueprint_generated_at`
- `story_image_path`
- `story_image_url`
- `current_quest_id`
- `created_at`
- `updated_at`

The first version only needs one active story in the UI, but the schema should
support many stories per user.

### Quests

A quest is one iteration step inside a story.

Conceptual fields:

- `id`
- `story_id`
- `sequence_number`
- `status`: `proposed`, `accepted`, `completed`, `unresolved`, `rejected`
- `recommended_task`: hidden real-world task JSON
- `quest`: visible quest JSON
- `accepted_at`
- `outcome_status`: nullable while proposed or accepted; later set to
  `completed`, `unresolved`, or `rejected`
- `feedback`: lightweight JSON object for user feedback; initially only an
  optional note, later extensible to rejection reasons, blockers, difficulty, or
  structured form answers
- `result_text`: generated result beat JSON
- `result_image_path`
- `result_image_url`
- `completed_at`
- `created_at`
- `updated_at`

The hidden recommendation and visible quest should be persisted together. Result
text and result image should be persisted when the user completes or marks the
quest unresolved.

Do not create separate feedback tables or quest-version tables in the first
persistence pass. Keep the first durable model small, but avoid painting the app
into a corner by using an outcome status and a feedback object instead of a
single success boolean.

### Assets

Generated images should not stay as base64 response data.

Use Supabase Storage buckets for:

- story banner images;
- quest result images.

Store:

- storage bucket;
- storage path;
- public or signed display URL strategy;
- image prompt metadata if useful for debugging;
- generation timestamps.

The first implementation can store images in one generated-assets bucket with
paths grouped by user, story, and quest.

## Backend API Direction

The existing generic generation routes are useful implementation details, but
screens should move toward domain routes.

Initial domain operations:

- `POST /api/stories`
  - input: name, goal, challenge;
  - action: create story, generate blueprint, generate story image, persist all;
  - output: persisted story record.

- `GET /api/stories`
  - action: list the current user's stories;
  - output: story summaries.

- `GET /api/stories/:storyId`
  - action: load one story, current quest, and recent quest history;
  - output: story detail.

- `POST /api/stories/:storyId/quests`
  - action: generate a new quest for the story using stored story context and
    prior quest history;
  - output: persisted quest record.

- `POST /api/quests/:questId/accept`
  - action: mark a proposed quest as accepted;
  - output: updated quest record.

- `POST /api/quests/:questId/complete`
  - input: outcome status and optional feedback object;
  - action: persist outcome, generate result text, generate result image, update
    story progress, and make the story ready for the next quest;
  - output: updated quest and story summary.

- `POST /api/quests/:questId/regenerate`
  - action: regenerate the proposal as a unit by generating a new recommended
    task and visible quest together;
  - output: replacement quest proposal.

Keep the lower-level AI helpers internal:

- `generateData`
- `generateImage`
- prompt builders
- Zod schemas

The frontend should stop sending raw prompts once domain APIs exist. Prompts are
backend implementation details.

## Frontend Direction

The frontend should become a durable workflow UI.

Key changes:

- Keep Zustand only for unsaved form drafts and transient UI state.
- Use persisted `storyId` and `questId` in routes or search params.
- Replace query keys based on name, goal, and challenge with keys based on IDs.
- Use route loaders or React Query to fetch persisted records by ID.
- Let mutation responses update the UI immediately, then refetch if needed.
- Add recovery states for missing, completed, rejected, or inaccessible records.

Near-term route direction:

- `/story-flow` loads or redirects to the current active story if one exists.
- `/story-flow/name`, `/goal`, and `/problem` remain draft onboarding steps.
- `/story-flow/blurb` becomes the story creation result screen after persisted
  story creation.
- `/story-flow/stories/:storyId/quest` shows the active or proposed quest.
- `/story-flow/stories/:storyId/quest/:questId/feedback` records the outcome.
- `/story-flow/stories/:storyId/quest/:questId/result` shows the persisted result
  beat and the next quest action.

The exact route shape can be refined during implementation, but the important
shift is that screens load records by durable IDs.

## Phased Roadmap

### Phase 0: Straighten The Domain Model

Goal: simplify the current app model before persistence makes it harder to
change.

Status: done.

What changed:

- Added a `QuestProposal` aggregate so the hidden recommended task and visible
  quest move through the app as one unit.
- Replaced separate task and quest query lifecycles with one proposal query that
  still keeps the internal two-step AI generation.
- Removed independent task-only regeneration from the UI.
- Introduced lightweight outcome and feedback types for future persistence:
  `completed`, `unresolved`, `rejected`, plus an optional feedback note.

Work:

- Treat the hidden recommended task and visible quest as one quest proposal.
- Remove independent user controls for "regenerate quest only" and "generate a
  new hidden task only"; expose one regenerate action for the whole proposal.
- Keep the internal two-step AI flow if useful: generate the practical task
  first, then translate it into the visible quest.
- Refactor frontend hooks and UI state around the proposal unit, not separate
  task and quest lifecycles.
- Replace result handling concepts based on a success boolean with an outcome
  status and a small feedback object, even if the current UI still only asks for
  completed/unresolved plus an optional note.

Acceptance criteria:

- The user can accept a proposal or regenerate the whole proposal, but cannot
  independently regenerate the hidden task and visible quest.
- A proposal object contains both the hidden recommendation and visible quest.
- Existing onboarding, quest, feedback, and result screens still work.
- The simplified shape maps directly to the future persisted quest row.

### Phase 1: Establish Supabase Ownership

Goal: add the durable foundation without changing the visible story flow yet.

Work:

- Add Supabase schema for stories, quests, and generated assets.
- Enable anonymous auth.
- Add client startup logic that ensures an anonymous session exists.
- Add RLS policies for user-owned stories and story-owned quests.
- Add typed helpers for server-side Supabase access.
- Keep the current flow working while these pieces are introduced.

Acceptance criteria:

- A browser session has a Supabase user ID.
- Server code can create rows owned by that user.
- RLS prevents one user from reading another user's stories.
- Existing prototype screens still run.

### Phase 2: Persist Story Creation

Goal: make onboarding produce a durable story record.

Work:

- Replace frontend story blueprint generation with a backend story creation
  operation.
- Backend creates the story row, generates the blueprint, generates the image,
  uploads the image to Storage, and updates the story row.
- Frontend navigates using the returned `storyId`.
- Story blurb screen renders the persisted blueprint and image URL.
- Keep form draft state local until the user submits onboarding.

Acceptance criteria:

- Refreshing the story blurb screen reloads the same persisted story.
- Story generation cannot return to the frontend without being stored.
- The story image is loaded from Storage, not base64 query data.

### Phase 3: Persist Quest Proposal And Acceptance

Goal: make the active quest a durable record.

Work:

- Add a backend operation to generate the next quest for a story.
- Backend reads the persisted story context and recent quest history.
- Backend generates and stores both the hidden recommended task and visible quest.
- Quest proposal screen loads the current proposed quest by story ID.
- Accepting a quest updates the quest status to `accepted`.
- Regeneration creates a clear replacement proposal and does not expose separate
  task-only or quest-only paths.

Acceptance criteria:

- Refreshing the quest proposal screen shows the same quest.
- Accepted quests remain accepted after navigation.
- The app can distinguish proposed, accepted, rejected, and replaced proposals.

### Phase 4: Persist Quest Feedback And Result

Goal: make the completion loop durable.

Work:

- Completion endpoint accepts an outcome status and optional feedback object.
- Backend stores the feedback and outcome on the quest.
- Backend generates result text from persisted story, quest, task, and feedback.
- Backend generates and stores the result image.
- Backend updates quest status and story progress fields.
- Result screen loads persisted result data by quest ID.

Acceptance criteria:

- Refreshing the result screen does not regenerate a different result.
- Feedback notes are stored and visible in the result view.
- Completed and unresolved quests appear in story history.
- Failed image generation does not lose the text result or quest outcome.

### Phase 5: Close The Iteration Loop

Goal: let the user repeatedly complete quests and receive new ones.

Work:

- Add "next quest" behavior that uses persisted quest history.
- Add a current progress view for the active story.
- Show recent quest outcomes and current active quest status.
- Add guardrails so only one active accepted quest exists per story.
- Make rejected or regenerated proposals visible enough for debugging, even if
  not prominent in the UI.

Acceptance criteria:

- User can complete a quest and generate the next quest from the result screen.
- Story progress survives refresh and browser restart.
- The app can show where the user is in the story without relying on client
  cache.

### Phase 6: Prepare Multiple Stories

Goal: support more than one story per user without redesigning persistence.

Work:

- Add story list screen.
- Add create-new-story entry point.
- Add active, paused, archived, and completed story states.
- Allow switching between stories.
- Ensure quest generation always uses the selected story ID.

Acceptance criteria:

- A user can have multiple stories.
- Each story has independent quest history.
- Archived or completed stories do not accidentally receive new quests.

### Phase 7: Upgrade User Management

Goal: move from anonymous-only usage to real account management.

Work:

- Add explicit sign-in and sign-out UI.
- Support upgrading an anonymous account to a permanent account.
- Preserve stories during account upgrade.
- Add account recovery and cross-device access if the chosen auth provider
  supports it.
- Add basic profile/account settings only when needed.

Acceptance criteria:

- Existing anonymous users can keep their stories when they sign up.
- Signed-in users can access their stories across sessions.
- RLS still enforces ownership for all story and quest records.

## Testing Strategy

Add tests at the boundary where behavior becomes durable.

Minimum test coverage:

- schema and RLS tests for story and quest ownership;
- API tests for creating a story and loading it by authenticated user;
- API tests proving generation writes persisted records before returning;
- API tests for quest accept and completion state transitions;
- storage tests or mocked integration tests for generated image upload;
- UI flow tests for onboarding, story creation, quest proposal, feedback, result,
  and next quest;
- regression test for refresh/navigation preserving story and quest progress.

Mock AI generation in most tests. Reserve live provider calls for manual checks
or a small explicit integration suite.

## Implementation Principles

- Prefer domain operations over generic generation endpoints in user-facing
  screens.
- Persist AI outputs before showing them as canonical app state.
- Use IDs, not prompt text, as the frontend's stable references.
- Keep local state for drafts only.
- Introduce account concepts early through Supabase Auth, even if the UI stays
  anonymous at first.
- Store generated images as assets, not base64 database payloads.
- Keep each phase shippable and preserve the existing basic flow while replacing
  its internals.

## Open Decisions For Later

These should not block the first persistence migration:

- whether rejected or superseded proposals should be kept once rejection feedback
  exists;
- which richer feedback fields are worth promoting from the feedback object into
  first-class columns;
- how much story progress should be summarized by deterministic fields versus
  generated narrative summaries;
- whether image URLs should be public, signed, or proxied through backend routes;
- how much quest history to include in future quest generation prompts;
- which permanent auth providers to support after anonymous auth.

The first durable version should choose simple defaults, document them, and make
later changes possible without losing user data.
