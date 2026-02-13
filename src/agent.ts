import type {
  ConsolidatedInsight,
  DerivedThemeFields,
  Message,
  ParticipantSession,
  ResearchTheme,
  StoredStudy,
  StudySummaryAnalysis,
  StudySummaryFinding,
  UserNeed,
} from "./types";

/** Simulated delay for mock agent (ms). */
const MOCK_DELAY_MS = 800;

/**
 * Mock LLM agent: returns theme-based questions and synthesizes user needs from the conversation.
 * Replace with a real LLM API (e.g. OpenAI, Anthropic) when ready.
 */
export const agent = {
  /**
   * Derive theme fields (title, description, focus areas) from uploaded PDF text.
   * Replace with a real LLM call that extracts a research brief from the document.
   */
  async deriveThemeFromPdf(pdfText: string): Promise<DerivedThemeFields> {
    await sleep(MOCK_DELAY_MS);
    const excerpt = pdfText.slice(0, 500).replace(/\s+/g, " ").trim();
    const firstLine = excerpt.split(/[.!?]/)[0] ?? excerpt.slice(0, 80);
    return {
      title: firstLine.length > 60 ? firstLine.slice(0, 57) + "…" : firstLine,
      description: excerpt.length > 300 ? excerpt.slice(0, 297) + "…" : excerpt,
      focusAreas: ["goals", "pain points", "current process"],
    };
  },

  /**
   * Get the next agent message (question) based on theme and conversation so far.
   */
  async getNextMessage(theme: ResearchTheme, messages: Message[]): Promise<string> {
    await sleep(MOCK_DELAY_MS);

    const userMessages = messages.filter((m) => m.role === "user");
    const agentMessages = messages.filter((m) => m.role === "agent");

    if (userMessages.length === 0) {
      const docContext = theme.sourcePdfText
        ? " I’ll use the research brief you provided to guide my questions."
        : "";
      return `I'm here to understand your needs around **${theme.title}**. ${theme.description}${docContext}\n\nTo start, how would you describe your main goal or challenge in this area?`;
    }

    if (userMessages.length === 1) {
      return "Can you tell me more about a specific situation where that comes up? What would an ideal outcome look like for you?";
    }

    if (userMessages.length === 2) {
      return "What’s the biggest friction or frustration you run into today when trying to achieve that?";
    }

    if (userMessages.length >= 3 && userMessages.length < 5) {
      const areas = theme.focusAreas?.length ? theme.focusAreas : ["pain points", "goals", "current workflow"];
      const area = areas[agentMessages.length % areas.length];
      return `To wrap up, is there anything else about **${area}** that we haven’t covered yet that matters to you?`;
    }

    return "Thanks — I have enough to summarize your needs. You can review and edit the structured needs below, or add more to the conversation if you’d like.";
  },

  /**
   * Generate structured user needs from the full conversation.
   */
  async generateNeeds(_theme: ResearchTheme, messages: Message[]): Promise<UserNeed[]> {
    await sleep(MOCK_DELAY_MS);

    const userContent = messages
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .join("\n");

    if (!userContent.trim()) {
      return [];
    }

    const now = Date.now();
    const mockNeeds: UserNeed[] = [
      {
        id: `need-${now}-1`,
        title: "Clear visibility of status",
        description: "User wants to see where things stand at a glance without digging through multiple places.",
        category: "transparency",
        priority: "high",
        evidence: userContent.slice(0, 80) + (userContent.length > 80 ? "…" : ""),
        createdAt: now,
      },
      {
        id: `need-${now}-2`,
        title: "Reduced friction in key workflow",
        description: "User wants fewer steps and less cognitive load when doing the main task.",
        category: "efficiency",
        priority: "medium",
        evidence: undefined,
        createdAt: now,
      },
      {
        id: `need-${now}-3`,
        title: "Alignment with real-world context",
        description: "Solution should fit how they actually work, not assume an ideal process.",
        category: "fit",
        priority: "high",
        evidence: undefined,
        createdAt: now,
      },
    ];

    return mockNeeds;
  },

  /**
   * Synthesize multiple participants' responses and needs into one consolidated insight
   * for creating a service prototype.
   */
  async synthesizeInsight(
    theme: ResearchTheme,
    participants: ParticipantSession[]
  ): Promise<ConsolidatedInsight> {
    await sleep(MOCK_DELAY_MS);

    const participantsWithContent = participants.filter(
      (p) => p.needs.length > 0 || p.messages.some((m) => m.role === "user")
    );

    const now = Date.now();
    const insight: ConsolidatedInsight = {
      id: `insight-${now}`,
      title: `${theme.title} — consolidated insight`,
      summary: `Across ${participantsWithContent.length} participant(s), users consistently need clearer visibility of status and outcomes, fewer steps in key workflows, and solutions that fit their real-world context. Pain points center on uncertainty about what happens next and extra effort to complete the main task.`,
      keyNeeds: [
        {
          title: "Clear visibility of status and outcomes",
          description:
            "Users want to see where things stand at a glance and what happens next, without digging through multiple places or waiting for confirmation.",
          category: "transparency",
          priority: "high",
          participantCount: participantsWithContent.length,
        },
        {
          title: "Reduced friction in the main workflow",
          description:
            "Fewer steps and less cognitive load when completing the core task; less back-and-forth and fewer dead ends.",
          category: "efficiency",
          priority: "high",
          participantCount: participantsWithContent.length,
        },
        {
          title: "Fit with how people actually work",
          description:
            "The service should support real-world contexts (e.g. interruptions, partial completion, different devices) rather than assuming an ideal linear flow.",
          category: "fit",
          priority: "medium",
          participantCount: Math.max(1, participantsWithContent.length - 1),
        },
      ],
      patterns: [
        "Uncertainty about next steps and timelines",
        "Desire for one place to see status and actions",
        "Frustration with repetitive or redundant steps",
      ],
      recommendations: [
        "Provide a single, clear status view (e.g. dashboard or checklist) with next actions.",
        "Minimize required steps; pre-fill and remember context where possible.",
        "Support saving progress and resuming; avoid long, unbreakable flows.",
      ],
      createdAt: now,
    };

    return insight;
  },

  /**
   * Synthesize data from multiple stored studies into a single aggregated insight.
   * Flattens all participants across studies and runs consolidation.
   */
  async synthesizeInsightFromStudies(studies: StoredStudy[]): Promise<ConsolidatedInsight> {
    await sleep(MOCK_DELAY_MS);

    const participantsWithContent = studies.flatMap((s) =>
      s.participants.filter(
        (p) => p.needs.length > 0 || p.messages.some((m) => m.role === "user")
      )
    );

    if (participantsWithContent.length === 0) {
      const now = Date.now();
      return {
        id: `insight-${now}`,
        title: "Aggregated insight (no participant data yet)",
        summary: "Add participants and collect responses across studies, then synthesize again.",
        keyNeeds: [],
        createdAt: now,
      };
    }

    const firstTheme = studies[0]?.theme;
    const combinedTheme: ResearchTheme = firstTheme
      ? {
          ...firstTheme,
          id: `aggregate-${Date.now()}`,
          title: firstTheme.title + " (aggregated across sessions)",
          description: `Insight aggregated from ${studies.length} session(s) and ${participantsWithContent.length} participant(s).`,
          createdAt: Date.now(),
        }
      : {
          id: `aggregate-${Date.now()}`,
          title: "Aggregated research",
          description: `Data from ${studies.length} session(s), ${participantsWithContent.length} participant(s).`,
          createdAt: Date.now(),
        };

    return agent.synthesizeInsight(combinedTheme, participantsWithContent);
  },

  /**
   * Analyze one or more study-summary PDFs and produce a synthesis (with 3–10 main findings
   * and possible resolutions), plus a prompt for creating the service with the design system.
   * Replace with a real LLM call that reads the combined text.
   */
  async analyzeStudySummaries(pdfTexts: string[]): Promise<StudySummaryAnalysis> {
    await sleep(MOCK_DELAY_MS);

    const combined = pdfTexts
      .map((t, i) => `--- Document ${i + 1} ---\n${t.slice(0, 3000)}`)
      .join("\n\n");
    const excerpt = combined.slice(0, 800).replace(/\s+/g, " ").trim();

    const synthesis =
      `Synthesis based on ${pdfTexts.length} study summary document(s)\n` +
      `================================================================\n\n` +
      `Overview\n--------\n` +
      `The study summaries describe user needs, pain points and desired outcomes. Users need a digital service that provides clear visibility of status and next steps, reduces friction in the main workflow, and fits real-world use (saving/resuming, multiple devices, partial completion).\n\n` +
      `Key themes from the documents\n-----------------------------\n` +
      `• Visibility: Users want one place to see where they are, what has been done, and what to do next.\n` +
      `• Friction: Too many steps, repeated data entry and unclear progress cause drop-off and frustration.\n` +
      `• Context: The service should remember context, pre-fill where possible and support interrupted or non-linear use.\n` +
      `• Trust: Clear confirmation, timelines and expectations (e.g. “You’ll hear back within X days”) build confidence.\n\n` +
      `Document excerpt (for context)\n--------------------------------\n` +
      `"${excerpt.slice(0, 400)}${excerpt.length > 400 ? "…" : ""}"\n\n` +
      `Recommended direction for the digital service: a status-led experience with minimal steps, clear calls to action, and support for saving and resuming. The sections below list main findings and possible resolutions.`;

    const findings: StudySummaryFinding[] = [
      {
        finding:
          "Users cannot see the current status of their case or request at a glance; they have to hunt across multiple channels or pages.",
        resolutions: [
          "Provide a single status view (e.g. dashboard or summary card) showing current stage, last update and next action.",
          "Use clear status labels (e.g. Badge/Tag: In progress, Waiting on you, Done) and optional timeline.",
          "Send status updates by email or notification with a direct link back to the status view.",
        ],
      },
      {
        finding:
          "The main task requires too many steps or repeated data entry, leading to abandonment or errors.",
        resolutions: [
          "Reduce the number of steps; combine or skip steps where the system already has the data.",
          "Pre-fill from previous submissions or account data; allow “same as before” where relevant.",
          "Use progressive disclosure: show only the next 1–2 steps and keep the rest for later.",
        ],
      },
      {
        finding:
          "Users cannot save progress and resume later; they fear losing work or must complete in one sitting.",
        resolutions: [
          "Support saving drafts and resuming by email link or account; persist form state.",
          "Show a clear “Save and continue later” action and confirm that progress is saved.",
          "Allow re-entry from the status view (“Continue where you left off”) instead of starting over.",
        ],
      },
      {
        finding:
          "Unclear what happens after submission (e.g. no confirmation, timeline or next steps).",
        resolutions: [
          "Show an immediate confirmation with a reference number and summary of what was submitted.",
          "Set expectations: e.g. “We’ll respond within 5 working days” or “Next step: we’ll contact you.”",
          "Include a link to the status view and optional email confirmation.",
        ],
      },
      {
        finding:
          "Information and actions are spread across multiple places; users don’t know where to go.",
        resolutions: [
          "Centralise key actions (e.g. “What do you want to do?”) and status on one landing or dashboard.",
          "Use simple navigation (tabs or links) so the main journey is obvious; avoid deep hierarchies.",
          "Provide a short “How this works” or checklist so users see the full path.",
        ],
      },
      {
        finding:
          "Forms and language are complex or assume prior knowledge; some users are unsure what to enter.",
        resolutions: [
          "Use plain language for labels, hints and errors; avoid jargon and acronyms.",
          "Add short help text or examples for non-obvious fields; consider optional “What’s this?”.",
          "Validate in real time and explain what’s wrong and how to fix it.",
        ],
      },
      {
        finding:
          "The experience doesn’t work well on mobile or when switching devices.",
        resolutions: [
          "Design for small screens first: large tap targets, single column, minimal horizontal scroll.",
          "Ensure the same journey works on desktop and mobile; use responsive layout from the design system.",
          "Use links that work across devices (e.g. “Continue on this device” via email link).",
        ],
      },
    ];

    const designSystemPrompt =
      `Create a digital service using the Chakra Design System (from /gds/chakra-app/src/design-system) with the following requirements derived from user study summaries:\n\n` +
      `1. **Layout & navigation**\n` +
      `   - Use Container, Stack (VStack/HStack), and Box from the design system.\n` +
      `   - Provide a clear main heading and optional sub-navigation (Tabs or links).\n\n` +
      `2. **Content and status**\n` +
      `   - Use Heading, Text, and Card to show status and key information at a glance.\n` +
      `   - Use Badge or Tag for status labels (e.g. "In progress", "Done").\n\n` +
      `3. **Actions and forms**\n` +
      `   - Use Button for primary and secondary actions (colorScheme="teal" for primary).\n` +
      `   - Use Input, Textarea, and Field/FormControl for any forms; keep required steps to a minimum.\n\n` +
      `4. **Feedback**\n` +
      `   - Use Alert for success or error messages; use Spinner or Skeleton for loading states.\n\n` +
      `5. **Theme**\n` +
      `   - Wrap the app in ChakraProvider with the design-system theme; use semantic tokens (e.g. figma.fg, figma.bgSubtle) for colours.\n\n` +
      `Context from study summaries: Users need visibility of status, fewer steps, and support for partial completion. Design the service so the main task is achievable in as few steps as possible with a clear status view.`;

    return { synthesis, findings, designSystemPrompt };
  },
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
