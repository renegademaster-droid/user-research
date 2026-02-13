import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Button, Card, Container, Heading, Text, VStack } from "design-system";
import { Chat } from "../components/Chat";
import { agent } from "../agent";
import * as storage from "../storage";
import type {
  Message,
  ParticipantSession,
  ResearchTheme,
  StoredStudy,
  UserNeed,
} from "../types";

const PARTICIPANT_STORAGE_KEY_PREFIX = "user-research-survey-participant-";

function createParticipant(study: StoredStudy): ParticipantSession {
  const index = study.participants.length + 1;
  const id = `participant-${Date.now()}-${index}`;
  return {
    id,
    label: `Participant ${index}`,
    messages: [],
    needs: [],
    createdAt: Date.now(),
  };
}

function getStoredParticipantId(surveyId: string): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(`${PARTICIPANT_STORAGE_KEY_PREFIX}${surveyId}`);
}

function setStoredParticipantId(surveyId: string, participantId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(`${PARTICIPANT_STORAGE_KEY_PREFIX}${surveyId}`, participantId);
}

export function SurveyParticipantView() {
  const { id: surveyId } = useParams<{ id: string }>();
  const [study, setStudy] = useState<StoredStudy | null>(null);
  const [participant, setParticipant] = useState<ParticipantSession | null>(null);
  const [status, setStatus] = useState<"loading" | "not-found" | "closed" | "not-yet" | "open">("loading");
  const [isAgentThinking, setIsAgentThinking] = useState(false);

  useEffect(() => {
    if (!surveyId) {
      setStatus("not-found");
      return;
    }
    let cancelled = false;
    (async () => {
      const loaded = await storage.loadStudy(surveyId);
      if (cancelled) return;
      if (!loaded) {
        setStatus("not-found");
        return;
      }
      const now = Date.now();
      if (loaded.openFrom != null && now < loaded.openFrom) {
        setStudy(loaded);
        setStatus("not-yet");
        return;
      }
      if (loaded.openUntil != null && now > loaded.openUntil) {
        setStudy(loaded);
        setStatus("closed");
        return;
      }
      setStudy(loaded);
      const storedParticipantId = getStoredParticipantId(surveyId);
      let currentParticipant: ParticipantSession;
      if (storedParticipantId) {
        const existing = loaded.participants.find((p) => p.id === storedParticipantId);
        if (existing) {
          currentParticipant = existing;
        } else {
          currentParticipant = createParticipant(loaded);
          const updatedParticipants = [...loaded.participants, currentParticipant];
          const updated: StoredStudy = {
            ...loaded,
            participants: updatedParticipants,
            updatedAt: Date.now(),
          };
          await storage.saveStudy(updated);
          if (cancelled) return;
          setStoredParticipantId(surveyId, currentParticipant.id);
          setStudy(updated);
        }
      } else {
        currentParticipant = createParticipant(loaded);
        const updatedParticipants = [...loaded.participants, currentParticipant];
        const updated: StoredStudy = {
          ...loaded,
          participants: updatedParticipants,
          updatedAt: Date.now(),
        };
        await storage.saveStudy(updated);
        if (cancelled) return;
        setStoredParticipantId(surveyId, currentParticipant.id);
        setStudy(updated);
      }
      setParticipant(currentParticipant);
      setStatus("open");
    })();
    return () => {
      cancelled = true;
    };
  }, [surveyId]);

  const persistParticipant = useCallback(
    async (updatedParticipant: ParticipantSession) => {
      if (!study || !surveyId) return;
      const nextParticipants = study.participants.map((p) =>
        p.id === updatedParticipant.id ? updatedParticipant : p
      );
      const updated: StoredStudy = {
        ...study,
        participants: nextParticipants,
        updatedAt: Date.now(),
      };
      await storage.saveStudy(updated);
      setStudy(updated);
      setParticipant(updatedParticipant);
    },
    [study, surveyId]
  );

  const addMessage = useCallback(
    (role: Message["role"], content: string) => {
      if (!participant) return;
      const msg: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        role,
        content,
        timestamp: Date.now(),
      };
      const next = { ...participant, messages: [...participant.messages, msg] };
      persistParticipant(next);
      return msg;
    },
    [participant, persistParticipant]
  );

  const handleSendMessage = useCallback(
    (content: string) => {
      if (!study || !participant) return;
      const userMsg: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        role: "user",
        content,
        timestamp: Date.now(),
      };
      const nextMessages = [...participant.messages, userMsg];
      const nextParticipant = { ...participant, messages: nextMessages };
      persistParticipant(nextParticipant);
      setIsAgentThinking(true);
      agent.getNextMessage(study.theme, nextMessages).then((reply) => {
        addMessage("agent", reply);
        setIsAgentThinking(false);
      });
    },
    [study, participant, persistParticipant, addMessage]
  );

  const handleGenerateNeeds = useCallback(() => {
    if (!study || !participant) return;
    setIsAgentThinking(true);
    agent.generateNeeds(study.theme, participant.messages).then((generated: UserNeed[]) => {
      const next = { ...participant, needs: generated };
      persistParticipant(next);
      setIsAgentThinking(false);
    });
  }, [study, participant, persistParticipant]);

  if (status === "loading") {
    return (
      <Box minH="100%" bg="figma.bgSubtle" display="flex" alignItems="center" justifyContent="center">
        <Text color="figma.fg_muted">Loading survey…</Text>
      </Box>
    );
  }

  if (status === "not-found") {
    return (
      <Box minH="100%" bg="figma.bgSubtle">
        <Container maxW="md" py={12}>
          <Card cardVariant="outline" p={6}>
            <Heading size="md" mb={2}>
              Survey not found
            </Heading>
            <Text color="figma.fg_muted" mb={4}>
              This survey link may be incorrect or the survey may have been removed.
            </Text>
            <Button
              size="sm"
              variant="outline"
              colorScheme="teal"
              label="Go back"
              onClick={() => window.history.back()}
            />
          </Card>
        </Container>
      </Box>
    );
  }

  if (status === "not-yet" && study) {
    const openFrom = study.openFrom != null ? new Date(study.openFrom).toLocaleString() : "";
    return (
      <Box minH="100%" bg="figma.bgSubtle">
        <Container maxW="md" py={12}>
          <Card cardVariant="outline" p={6}>
            <Heading size="md" mb={2}>
              Survey is not open yet
            </Heading>
            <Text color="figma.fg_muted" mb={4}>
              This survey will open for responses at {openFrom}.
            </Text>
          </Card>
        </Container>
      </Box>
    );
  }

  if (status === "closed" && study) {
    const openUntil = study.openUntil != null ? new Date(study.openUntil).toLocaleString() : "";
    return (
      <Box minH="100%" bg="figma.bgSubtle">
        <Container maxW="md" py={12}>
          <Card cardVariant="outline" p={6}>
            <Heading size="md" mb={2}>
              Survey has closed
            </Heading>
            <Text color="figma.fg_muted" mb={4}>
              This survey closed at {openUntil}. Thank you for your interest.
            </Text>
          </Card>
        </Container>
      </Box>
    );
  }

  if (status === "open" && study && participant) {
    return (
      <Box minH="100%" bg="figma.bgSubtle" display="flex" flexDirection="column">
        <Box py={4} borderBottomWidth="1px" borderColor="figma.borderDefault" bg="figma.default">
          <Container maxW="720px">
            <Heading size="md" color="figma.fg">
              {study.theme.title}
            </Heading>
            <Text fontSize="sm" color="figma.fg_muted" mt={1}>
              Answer the questions below. Your responses will help improve this service.
            </Text>
          </Container>
        </Box>
        <Box flex={1} minH={0} overflow="auto">
          <Chat
            theme={study.theme}
            messages={participant.messages}
            isAgentThinking={isAgentThinking}
            onSendMessage={handleSendMessage}
            onGenerateNeeds={handleGenerateNeeds}
          />
        </Box>
      </Box>
    );
  }

  return null;
}
