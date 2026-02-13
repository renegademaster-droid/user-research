# User Research

A React TypeScript service that collects user needs through a conversational LLM agent so you can create and test service prototypes.

## Features

- **Theme definition (two ways)** — **Manual:** fill in title, description, optional focus areas and existing web service. **Upload PDF:** upload a research brief or scope document; the service extracts text, derives a theme (title, description, focus areas), and the agent uses the document to determine which questions to ask. You can edit the extracted theme before starting.
- **Conversational agent** — An LLM-backed agent asks questions; each research participant responds in the chat. The agent adapts based on the theme and conversation.
- **Multiple participants** — Add multiple participants (e.g. User 1, User 2). Each has their own conversation and optional structured needs.
- **Structured user needs** — From each conversation, the service generates clear, structured user needs (title, description, category, priority, evidence) per participant.
- **Consolidated insight** — Synthesize responses from all participants into one consolidated insight (summary, key needs, patterns, recommendations) to use as the basis for your service prototype.
- **Persistent storage** — Each research session (one theme + participants + insight) is stored in the browser (localStorage). Data survives refresh; the current session is restored on load.
- **Saved sessions** — From the landing page, use **Saved sessions** to see all stored research sessions, open any session to continue it, or run **Synthesize all into one insight** to aggregate data from every session into a single set of insights.
- **Survey settings and scheduling** — In the **Settings** tab of a study you can set an optional **open from** / **open until** time window so the survey only accepts responses during that period. You can copy a **share survey link** (e.g. `/survey/:id`) and send it to participants; they open the link and answer the agent’s questions on their own. Each person’s responses are stored as a separate participant for that study.

## Tech stack

- **React** + **TypeScript**
- **Chakra Design System** from `/gds/chakra-app/src/design-system`
- **Vite** for build and dev

## Setup

From this directory:

```bash
npm install
npm run dev
```

The design system is linked from `../chakra-app`. Ensure that path exists and that `chakra-app` has been built or is available.

## GitHub Pages

To avoid a blank page and “disallowed MIME type” errors:

1. **Settings → Pages → Build and deployment → Source** must be **GitHub Actions** (not “Deploy from a branch”).  
   Otherwise the site serves the raw repo and the browser tries to load `/src/main.tsx` instead of the built app.
2. Open the app at **`https://<your-username>.github.io/userresearch/`** (with the `/userresearch/` path and trailing slash).

## Scripts

- `npm run dev` — Start the frontend dev server (Vite)
- `npm run build` — Production build (Vite)
- `npm run preview` — Preview the production build
- `npm run server` — Start the backend API (Express + SQLite) for `VITE_STORAGE_MODE=api`

## Replacing the mock agent with a real LLM

The agent in `src/agent.ts` is a mock that returns theme-based questions, synthetic needs, and a consolidated insight. To use a real LLM:

1. **getNextMessage(theme, messages)** — Call your LLM API with a system prompt derived from `theme` and a conversation history from `messages`.
2. **generateNeeds(theme, messages)** — Call your LLM with the full conversation and ask it to return structured user needs matching `UserNeed` in `src/types.ts`.
3. **synthesizeInsight(theme, participants)** — Call your LLM with the theme and all participants’ messages/needs, and ask it to return a `ConsolidatedInsight` (summary, key needs, patterns, recommendations) for your service prototype.
4. **synthesizeInsightFromStudies(studies)** — Call your LLM with all stored studies (each has theme + participants) and ask it to return one aggregated `ConsolidatedInsight` across sessions.
5. **deriveThemeFromPdf(pdfText)** — When the user uploads a PDF, call your LLM with the extracted text and ask it to return `DerivedThemeFields` (title, description, focus areas) so the theme form can be pre-filled. The full PDF text is stored on the theme as `sourcePdfText` and passed to the agent when generating questions.

You can keep the same interface and swap the implementation (e.g. OpenAI, Anthropic, or your own backend).

## Storage and configuration

You can choose where study data is stored via a **configuration flag** (env):

| Mode   | Where data lives | Use case |
|--------|------------------|----------|
| `local` | Browser **localStorage** only | Single device, no backend |
| `api`   | Backend REST API (SQLite)     | Share survey link across devices |

Set in `.env` (copy from `.env.example`):

- **`VITE_STORAGE_MODE`** — `local` (default) or `api`
- **`VITE_API_URL`** — Backend base URL when using `api` (e.g. `http://localhost:4000`; no trailing slash)

When **`VITE_STORAGE_MODE=api`**, the app calls:

- `GET /api/studies` — list studies  
- `GET /api/studies/:id` — get one study (admin or survey participant)  
- `PUT /api/studies/:id` — create or update a study  
- `DELETE /api/studies/:id` — delete a study  

Start the backend with `npm run server` (see below). The current study id (which survey you’re editing) is always kept in **localStorage**; only study payloads use the API when mode is `api`. Participant identity for the survey link is still in **sessionStorage** per survey so one browser session = one participant.

**Sharing the survey link:** With `api` mode and the backend running, share the link (e.g. `https://yoursite.com/survey/study-123`) with anyone; they can open it and respond. With `local` mode, the link only works on the same browser that created the study.
