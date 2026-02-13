import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Container,
  Heading,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  HStack,
  Badge,
  Button,
  Text,
} from "design-system";
import { ThemeForm } from "./components/ThemeForm";
import { Chat } from "./components/Chat";
import { UserNeedsList } from "./components/UserNeedsList";
import { ConsolidatedInsightView } from "./components/ConsolidatedInsightView";
import { StudiesListView } from "./components/StudiesListView";
import { SurveySettings } from "./components/SurveySettings";
import { agent } from "./agent";
import * as storage from "./storage";
import type {
  ConsolidatedInsight,
  Message,
  ParticipantSession,
  ResearchTheme,
  StoredStudy,
  UserNeed,
} from "./types";

type View = "theme" | "chat" | "needs" | "insight" | "settings";

function createParticipant(index: number): ParticipantSession {
  const id = `participant-${Date.now()}-${index}`;
  return {
    id,
    label: `Participant ${index}`,
    messages: [],
    needs: [],
    createdAt: Date.now(),
  };
}

function buildCurrentStudy(
  studyId: string,
  theme: ResearchTheme,
  participants: ParticipantSession[],
  consolidatedInsight: ConsolidatedInsight | null,
  existing?: StoredStudy | null,
  schedule?: { openFrom?: number; openUntil?: number }
): StoredStudy {
  const now = Date.now();
  return {
    id: studyId,
    theme,
    participants,
    consolidatedInsight,
    openFrom: schedule?.openFrom ?? existing?.openFrom,
    openUntil: schedule?.openUntil ?? existing?.openUntil,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

function App() {
  const [theme, setTheme] = useState<ResearchTheme | null>(null);
  const [participants, setParticipants] = useState<ParticipantSession[]>([]);
  const [consolidatedInsight, setConsolidatedInsight] =
    useState<ConsolidatedInsight | null>(null);
  const [currentStudyId, setCurrentStudyId] = useState<string | null>(null);
  const [studies, setStudies] = useState<StoredStudy[]>([]);
  const [showStudiesList, setShowStudiesList] = useState(false);
  const [aggregatedInsight, setAggregatedInsight] = useState<ConsolidatedInsight | null>(null);
  const [openFrom, setOpenFrom] = useState<number | undefined>(undefined);
  const [openUntil, setOpenUntil] = useState<number | undefined>(undefined);
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const [activeView, setActiveView] = useState<View>("theme");
  const [hydrated, setHydrated] = useState(false);

  const currentParticipant = participants[participants.length - 1] ?? null;
  const canSynthesize =
    participants.length >= 2 &&
    participants.some(
      (p) => p.needs.length > 0 || p.messages.some((m) => m.role === "user")
    );

  // Restore current study from storage on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await storage.loadStudies();
        if (cancelled) return;
        setStudies(all);
        const id = storage.getCurrentStudyId();
        if (id) {
          const study = all.find((s) => s.id === id) ?? (await storage.loadStudy(id));
          if (cancelled) return;
          if (study) {
            setTheme(study.theme);
            setParticipants(study.participants.length > 0 ? study.participants : [createParticipant(1)]);
            setConsolidatedInsight(study.consolidatedInsight);
            setOpenFrom(study.openFrom);
            setOpenUntil(study.openUntil);
            setCurrentStudyId(study.id);
            setActiveView("chat");
          }
        }
      } catch {
        if (!cancelled) setStudies([]);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist current study whenever theme, participants, insight, or schedule change
  useEffect(() => {
    if (!hydrated || !currentStudyId || !theme) return;
    let cancelled = false;
    (async () => {
      const existing = await storage.loadStudy(currentStudyId);
      if (cancelled) return;
      const study = buildCurrentStudy(
        currentStudyId,
        theme,
        participants,
        consolidatedInsight,
        existing,
        { openFrom, openUntil }
      );
      await storage.saveStudy(study);
      if (cancelled) return;
      const list = await storage.loadStudies();
      if (cancelled) return;
      setStudies(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, currentStudyId, theme, participants, consolidatedInsight, openFrom, openUntil]);

  // Refresh studies list when opening the list view
  useEffect(() => {
    if (!showStudiesList) return;
    let cancelled = false;
    (async () => {
      const list = await storage.loadStudies();
      if (cancelled) return;
      setStudies(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [showStudiesList]);

  const addMessage = useCallback(
    (role: Message["role"], content: string) => {
      const msg: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        role,
        content,
        timestamp: Date.now(),
      };
      setParticipants((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last) next[next.length - 1] = { ...last, messages: [...last.messages, msg] };
        return next;
      });
      return msg;
    },
    []
  );

  const handleThemeSubmit = useCallback(
    (newTheme: ResearchTheme) => {
      const studyId = `study-${Date.now()}`;
      setTheme(newTheme);
      setParticipants([createParticipant(1)]);
      setConsolidatedInsight(null);
      setCurrentStudyId(studyId);
      setActiveView("chat");
      storage.setCurrentStudyId(studyId);
      setIsAgentThinking(true);
      if (!newTheme) return;
      agent.getNextMessage(newTheme, []).then((content) => {
        addMessage("agent", content);
        setIsAgentThinking(false);
      });
    },
    [addMessage]
  );

  const handleSendMessage = useCallback(
    (content: string) => {
      if (!theme || !currentParticipant) return;
      const userMsg: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        role: "user",
        content,
        timestamp: Date.now(),
      };
      const nextMessages = [...currentParticipant.messages, userMsg];
      setParticipants((prev) => {
        const next = [...prev];
        next[next.length - 1] = { ...currentParticipant, messages: nextMessages };
        return next;
      });
      setIsAgentThinking(true);
      agent.getNextMessage(theme, nextMessages).then((reply) => {
        addMessage("agent", reply);
        setIsAgentThinking(false);
      });
    },
    [theme, currentParticipant, addMessage]
  );

  const handleGenerateNeeds = useCallback(() => {
    if (!theme || !currentParticipant) return;
    setIsAgentThinking(true);
    agent.generateNeeds(theme, currentParticipant.messages).then((generated) => {
      setParticipants((prev) => {
        const next = [...prev];
        next[next.length - 1] = { ...currentParticipant, needs: generated };
        return next;
      });
      setActiveView("needs");
      setIsAgentThinking(false);
    });
  }, [theme, currentParticipant]);

  const handleAddParticipant = useCallback(() => {
    if (!theme) return;
    setParticipants((prev) => [...prev, createParticipant(prev.length + 1)]);
    setActiveView("chat");
    setIsAgentThinking(true);
    agent.getNextMessage(theme, []).then((content) => {
      addMessage("agent", content);
      setIsAgentThinking(false);
    });
  }, [theme, addMessage]);

  const handleSynthesizeInsight = useCallback(() => {
    if (!theme || !canSynthesize) return;
    setIsAgentThinking(true);
    agent.synthesizeInsight(theme, participants).then((insight) => {
      setConsolidatedInsight(insight);
      setActiveView("insight");
      setIsAgentThinking(false);
    });
  }, [theme, participants, canSynthesize]);

  const handleNewStudy = useCallback(async () => {
    if (theme && currentStudyId) {
      const existing = await storage.loadStudy(currentStudyId);
      const study = buildCurrentStudy(
        currentStudyId,
        theme,
        participants,
        consolidatedInsight,
        existing,
        { openFrom, openUntil }
      );
      await storage.saveStudy(study);
    }
    setTheme(null);
    setParticipants([]);
    setConsolidatedInsight(null);
    setOpenFrom(undefined);
    setOpenUntil(undefined);
    setCurrentStudyId(null);
    setAggregatedInsight(null);
    storage.setCurrentStudyId(null);
    setActiveView("theme");
    setShowStudiesList(false);
    const list = await storage.loadStudies();
    setStudies(list);
  }, [theme, currentStudyId, participants, consolidatedInsight, openFrom, openUntil]);

  const handleOpenStudy = useCallback((study: StoredStudy) => {
    setTheme(study.theme);
    setParticipants(
      study.participants.length > 0 ? study.participants : [createParticipant(1)]
    );
    setConsolidatedInsight(study.consolidatedInsight);
    setOpenFrom(study.openFrom);
    setOpenUntil(study.openUntil);
    setCurrentStudyId(study.id);
    storage.setCurrentStudyId(study.id);
    setShowStudiesList(false);
    setActiveView("chat");
  }, []);

  const handleSaveSchedule = useCallback((openFromVal?: number, openUntilVal?: number) => {
    setOpenFrom(openFromVal);
    setOpenUntil(openUntilVal);
  }, []);

  const handleSynthesizeAll = useCallback(async () => {
    const all = await storage.loadStudies();
    setStudies(all);
    setIsAgentThinking(true);
    agent.synthesizeInsightFromStudies(all).then((insight) => {
      setAggregatedInsight(insight);
      setIsAgentThinking(false);
    });
  }, []);

  if (!hydrated) {
    return null;
  }

  // Landing: theme form or saved sessions list
  if (!theme) {
    return (
      <Box minH="100%" bg="figma.bgSubtle">
        <Box py={6} borderBottomWidth="1px" borderColor="figma.borderDefault" bg="figma.default">
          <Container maxW="1200px">
            <HStack justify="space-between" align="center" flexWrap="wrap" gap={2}>
              <Heading size="lg" color="figma.fg">
                User study
              </Heading>
              <Button
                size="sm"
                variant={showStudiesList ? "solid" : "outline"}
                colorScheme="teal"
                label="Saved sessions"
                onClick={() => setShowStudiesList((v) => !v)}
              />
            </HStack>
          </Container>
        </Box>
        {showStudiesList ? (
          <StudiesListView
            studies={studies}
            aggregatedInsight={aggregatedInsight}
            isSynthesizing={isAgentThinking}
            onOpenStudy={handleOpenStudy}
            onSynthesizeAll={handleSynthesizeAll}
            onNewStudy={() => setShowStudiesList(false)}
          />
        ) : (
          <ThemeForm onSubmit={handleThemeSubmit} />
        )}
      </Box>
    );
  }

  const tabIndex =
    activeView === "chat" ? 0 : activeView === "needs" ? 1 : activeView === "insight" ? 2 : 3;
  const setViewFromTab = (i: number) => {
    if (i === 0) setActiveView("chat");
    else if (i === 1) setActiveView("needs");
    else if (i === 2) setActiveView("insight");
    else setActiveView("settings");
  };

  const currentStudyForSettings: StoredStudy | null =
    theme && currentStudyId
      ? buildCurrentStudy(
          currentStudyId,
          theme,
          participants,
          consolidatedInsight,
          null,
          { openFrom, openUntil }
        )
      : null;

  return (
    <Box minH="100%" bg="figma.bgSubtle" display="flex" flexDirection="column">
      <Box py={4} borderBottomWidth="1px" borderColor="figma.borderDefault" bg="figma.default">
        <Container maxW="1200px">
          <HStack justify="space-between" align="center" flexWrap="wrap" gap={2}>
            <Heading size="md" color="figma.fg">
              User study
            </Heading>
            <HStack gap={2} align="center">
              <Text fontSize="sm" color="figma.fg_muted">
                {currentParticipant?.label ?? ""}
              </Text>
              {participants.length > 0 && (
                <Badge colorScheme="teal" variant="subtle" fontSize="xs">
                  {participants.length} participant{participants.length !== 1 ? "s" : ""}
                </Badge>
              )}
              <Button
                size="sm"
                variant="outline"
                colorScheme="teal"
                label="Add participant"
                onClick={handleAddParticipant}
                isDisabled={isAgentThinking}
              />
              {canSynthesize && (
                <Button
                  size="sm"
                  colorScheme="teal"
                  label="Synthesize insight"
                  onClick={handleSynthesizeInsight}
                  isDisabled={isAgentThinking}
                />
              )}
            </HStack>
          </HStack>
        </Container>
      </Box>

      <Tabs
        index={tabIndex}
        onChange={setViewFromTab}
        flex={1}
        display="flex"
        flexDirection="column"
        minH={0}
      >
        <TabList
          px={4}
          pt={2}
          borderBottomWidth="1px"
          borderColor="figma.borderDefault"
          bg="figma.default"
        >
          <Tab>Conversation</Tab>
          <Tab>Structured needs {currentParticipant?.needs.length ? `(${currentParticipant.needs.length})` : ""}</Tab>
          <Tab>Consolidated insight {consolidatedInsight ? "✓" : ""}</Tab>
          <Tab>Settings</Tab>
        </TabList>
        <TabPanels flex={1} minH={0} overflow="auto">
          <TabPanel p={0} h="100%">
            <Chat
              theme={theme}
              messages={currentParticipant?.messages ?? []}
              isAgentThinking={isAgentThinking}
              onSendMessage={handleSendMessage}
              onGenerateNeeds={handleGenerateNeeds}
            />
          </TabPanel>
          <TabPanel p={0} h="100%">
            <UserNeedsList
              needs={currentParticipant?.needs ?? []}
              onBackToChat={() => setActiveView("chat")}
              onNewSession={handleNewStudy}
            />
          </TabPanel>
          <TabPanel p={0} h="100%">
            {consolidatedInsight ? (
              <ConsolidatedInsightView
                insight={consolidatedInsight}
                onBackToParticipants={() => setActiveView("chat")}
                onNewStudy={handleNewStudy}
              />
            ) : (
              <Container maxW="720px" py={8}>
                <Box
                  p={6}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor="figma.borderDefault"
                  bg="figma.bgSubtle"
                >
                  <Heading size="sm" mb={2}>
                    No consolidated insight yet
                  </Heading>
                  <Text fontSize="sm" color="figma.fg_muted" mb={4}>
                    Add at least two participants and have conversations (or generate needs) for
                    them. Then use “Synthesize insight” in the header to combine their responses
                    into one insight for your service prototype.
                  </Text>
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="teal"
                    label="Back to conversation"
                    onClick={() => setActiveView("chat")}
                  />
                </Box>
              </Container>
            )}
          </TabPanel>
          <TabPanel p={0} h="100%">
            {currentStudyForSettings && (
              <SurveySettings
                study={currentStudyForSettings}
                onSave={handleSaveSchedule}
              />
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

export default App;
