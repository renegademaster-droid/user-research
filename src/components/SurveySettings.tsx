import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  Container,
  Heading,
  Input,
  Text,
  VStack,
  HStack,
} from "design-system";
import type { StoredStudy } from "../types";

function toDatetimeLocal(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}

function fromDatetimeLocal(s: string): number | undefined {
  if (!s.trim()) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d.getTime();
}

export interface SurveySettingsProps {
  study: StoredStudy;
  onSave: (openFrom?: number, openUntil?: number) => void;
}

export function SurveySettings({ study, onSave }: SurveySettingsProps) {
  const [openFromInput, setOpenFromInput] = useState("");
  const [openUntilInput, setOpenUntilInput] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (study.openFrom != null) setOpenFromInput(toDatetimeLocal(study.openFrom));
    else setOpenFromInput("");
    if (study.openUntil != null) setOpenUntilInput(toDatetimeLocal(study.openUntil));
    else setOpenUntilInput("");
  }, [study.id, study.openFrom, study.openUntil]);

  const surveyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname.replace(/\/?$/, "")}/survey/${study.id}`
      : "";

  const handleSaveSchedule = () => {
    const openFrom = fromDatetimeLocal(openFromInput);
    const openUntil = fromDatetimeLocal(openUntilInput);
    onSave(openFrom, openUntil);
  };

  const handleCopyLink = async () => {
    if (!surveyUrl) return;
    try {
      await navigator.clipboard.writeText(surveyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select and show
    }
  };

  return (
    <Container maxW="640px" py={6}>
      <VStack align="stretch" spacing={6}>
        <Box>
          <Heading size="md" mb={2}>
            Survey settings
          </Heading>
          <Text color="figma.fg_muted" fontSize="sm">
            Optionally limit when the survey is open, and share the link so users can respond on their own.
          </Text>
        </Box>

        <Card cardVariant="outline" p={6}>
          <Heading size="sm" mb={3}>
            Schedule (optional)
          </Heading>
          <Text fontSize="sm" color="figma.fg_muted" mb={4}>
            Set a time window so the survey is only open for responses during that period. Leave blank for no limit.
          </Text>
          <VStack align="stretch" spacing={4}>
            <Input
              label="Open from"
              type="datetime-local"
              value={openFromInput}
              onChange={(e) => setOpenFromInput(e.target.value)}
            />
            <Input
              label="Open until"
              type="datetime-local"
              value={openUntilInput}
              onChange={(e) => setOpenUntilInput(e.target.value)}
            />
            <HStack justify="flex-end">
              <Button
                size="sm"
                colorScheme="teal"
                label="Save schedule"
                onClick={handleSaveSchedule}
              />
            </HStack>
          </VStack>
        </Card>

        <Card cardVariant="outline" p={6}>
          <Heading size="sm" mb={3}>
            Share survey link
          </Heading>
          <Text fontSize="sm" color="figma.fg_muted" mb={4}>
            Share this URL with participants. They can open it and answer the agent’s questions independently. Each person’s responses are stored as a separate participant for this study.
          </Text>
          <VStack align="stretch" spacing={2}>
            <Box
              p={3}
              borderRadius="md"
              borderWidth="1px"
              borderColor="figma.borderDefault"
              bg="figma.bgSubtle"
              fontFamily="mono"
              fontSize="sm"
              wordBreak="break-all"
            >
              {surveyUrl}
            </Box>
            <Button
              size="sm"
              colorScheme="teal"
              variant="outline"
              label={copied ? "Copied!" : "Copy link"}
              onClick={handleCopyLink}
            />
          </VStack>
        </Card>
      </VStack>
    </Container>
  );
}
