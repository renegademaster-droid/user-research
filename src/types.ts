/** A single message in the research conversation (agent or user). */
export type MessageRole = "agent" | "user";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

/** Theme defined by the primary user; guides the agent's questions. */
export interface ResearchTheme {
  id: string;
  title: string;
  description: string;
  /** Optional focus areas the agent should explore (e.g. "pain points", "goals"). */
  focusAreas?: string[];
  /** Optional: the survey applies to this existing web service (name or URL). */
  existingWebService?: string;
  /** Optional: full text from an uploaded PDF; agent uses this to determine questions. */
  sourcePdfText?: string;
  /** Optional: original PDF file name when theme was derived from PDF. */
  sourcePdfFileName?: string;
  createdAt: number;
}

/** Extracted theme fields from a PDF (e.g. by agent or mock). */
export interface DerivedThemeFields {
  title: string;
  description: string;
  focusAreas?: string[];
}

/** One main finding from study-summary analysis, with possible resolutions. */
export interface StudySummaryFinding {
  finding: string;
  resolutions: string[];
}

/** Result of analysing study-summary PDFs (User needs page). */
export interface StudySummaryAnalysis {
  synthesis: string;
  findings: StudySummaryFinding[];
  designSystemPrompt: string;
}

/** A structured user need extracted from the conversation. */
export interface UserNeed {
  id: string;
  /** Short label (e.g. "Clear status visibility") */
  title: string;
  /** Detailed description of the need */
  description: string;
  /** Optional category for grouping (e.g. "transparency", "speed") */
  category?: string;
  /** Optional priority hint: high, medium, low */
  priority?: "high" | "medium" | "low";
  /** Quote or paraphrase from the conversation that supports this need */
  evidence?: string;
  createdAt: number;
}

/** One participant's conversation and extracted needs. */
export interface ParticipantSession {
  id: string;
  /** Display label (e.g. "User 1", "Participant A"). */
  label: string;
  messages: Message[];
  needs: UserNeed[];
  createdAt: number;
}

/**
 * Consolidated insight synthesized from multiple participants' responses.
 * Use this as the basis for creating a service prototype.
 */
export interface ConsolidatedInsight {
  id: string;
  /** Short title for the insight (e.g. "Booking a visit — key findings"). */
  title: string;
  /** Executive summary of what users need and why. */
  summary: string;
  /** Synthesized needs across participants (merged, deduplicated, prioritized). */
  keyNeeds: Array<{
    title: string;
    description: string;
    category?: string;
    priority?: "high" | "medium" | "low";
    /** How many participants or conversations mentioned this (if available). */
    participantCount?: number;
  }>;
  /** Recurring patterns or themes across responses. */
  patterns?: string[];
  /** Concrete recommendations for the service prototype. */
  recommendations?: string[];
  createdAt: number;
}

/** Session state: theme, messages, and generated needs. */
export interface ResearchSession {
  theme: ResearchTheme | null;
  messages: Message[];
  needs: UserNeed[];
  /** Whether the agent is currently "thinking" (e.g. calling LLM). */
  isAgentThinking: boolean;
}

/**
 * A research session stored for persistence and cross-session aggregation.
 * One study = one theme + multiple participants + optional consolidated insight.
 */
export interface StoredStudy {
  id: string;
  theme: ResearchTheme;
  participants: ParticipantSession[];
  consolidatedInsight: ConsolidatedInsight | null;
  /** Optional: survey only open from this timestamp (ms). */
  openFrom?: number;
  /** Optional: survey only open until this timestamp (ms). */
  openUntil?: number;
  createdAt: number;
  updatedAt: number;
}

/** User profile type in the recruitment portal (who we're looking for). */
export interface RecruitmentProfile {
  id: string;
  title: string;
  description: string;
  /** e.g. "Citizens", "Business" */
  category: string;
  /** e.g. "Parents", "First-time users" */
  segment: string;
  /** e.g. "Benefits", "Tax", "Licences" */
  topic: string;
  /** "open" | "full" */
  availability: "open" | "full";
  /** Optional study or project this profile is for */
  studyTitle?: string;
}

/** Sign-up to a recruitment profile (user expressed interest). */
export interface RecruitmentSignup {
  id: string;
  profileId: string;
  name: string;
  email: string;
  message?: string;
  createdAt: number;
}
