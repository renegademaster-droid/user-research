import {
  Box,
  Button,
  Card,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
} from "design-system";
import type { ConsolidatedInsight, StoredStudy } from "../types";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export interface StudiesListViewProps {
  studies: StoredStudy[];
  aggregatedInsight: ConsolidatedInsight | null;
  isSynthesizing: boolean;
  onOpenStudy: (study: StoredStudy) => void;
  onSynthesizeAll: () => void;
  onNewStudy: () => void;
}

export function StudiesListView({
  studies,
  aggregatedInsight,
  isSynthesizing,
  onOpenStudy,
  onSynthesizeAll,
  onNewStudy,
}: StudiesListViewProps) {
  const canSynthesizeAll =
    studies.length > 0 &&
    studies.some((s) =>
      s.participants.some(
        (p) => p.needs.length > 0 || p.messages.some((m) => m.role === "user")
      )
    );

  return (
    <Container maxW="800px" py={6}>
      <VStack align="stretch" spacing={6}>
        <HStack justify="space-between" align="center" flexWrap="wrap" gap={2}>
          <Heading size="lg">Saved research sessions</Heading>
          <Button size="sm" colorScheme="teal" label="New research study" onClick={onNewStudy} />
        </HStack>

        <Text color="figma.fg_muted" fontSize="sm">
          Data from each session is stored here. Open a session to continue it, or synthesize all
          sessions into one aggregated insight.
        </Text>

        {studies.length === 0 ? (
          <Card cardVariant="subtle" p={6}>
            <Text color="figma.fg_muted">
              No saved sessions yet. Define a theme and run a research session; it will be saved
              automatically. Start with “New research study”.
            </Text>
          </Card>
        ) : (
          <>
            <VStack align="stretch" spacing={3}>
              {[...studies].reverse().map((study) => {
                const participantCount = study.participants.length;
                const hasContent = study.participants.some(
                  (p) =>
                    p.needs.length > 0 || p.messages.some((m) => m.role === "user")
                );
                return (
                  <Card
                    key={study.id}
                    cardVariant="outline"
                    p={4}
                    cursor="pointer"
                    _hover={{ borderColor: "teal.400", bg: "figma.bgSubtle" }}
                    onClick={() => onOpenStudy(study)}
                  >
                    <HStack justify="space-between" align="center" flexWrap="wrap" gap={2}>
                      <Box flex={1} minW={0}>
                        <Heading as="h3" size="sm" fontWeight="600" noOfLines={1}>
                          {study.theme.title}
                        </Heading>
                        <Text fontSize="xs" color="figma.fg_muted" mt={1}>
                          Updated {formatDate(study.updatedAt)}
                        </Text>
                      </Box>
                      <HStack gap={2}>
                        <Badge colorScheme="teal" variant="subtle" fontSize="xs">
                          {participantCount} participant{participantCount !== 1 ? "s" : ""}
                        </Badge>
                        {study.consolidatedInsight && (
                          <Badge variant="outline" fontSize="xs" colorScheme="gray">
                            Insight
                          </Badge>
                        )}
                        {hasContent && (
                          <Button
                            size="xs"
                            variant="ghost"
                            colorScheme="teal"
                            label="Open"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenStudy(study);
                            }}
                          />
                        )}
                      </HStack>
                    </HStack>
                  </Card>
                );
              })}
            </VStack>

            <Box pt={2}>
              <Heading size="sm" mb={2}>
                Aggregate across sessions
              </Heading>
              <Text fontSize="sm" color="figma.fg_muted" mb={3}>
                Synthesize data from all saved sessions into a single set of insights.
              </Text>
              <Button
                size="sm"
                colorScheme="teal"
                label={isSynthesizing ? "Synthesizing…" : "Synthesize all into one insight"}
                onClick={onSynthesizeAll}
                isDisabled={!canSynthesizeAll || isSynthesizing}
              />
            </Box>

            {aggregatedInsight && (
              <Box pt={4} borderTopWidth="1px" borderColor="figma.borderDefault">
                <Heading size="sm" mb={3}>
                  Aggregated insight
                </Heading>
                <Card cardVariant="outline" p={5}>
                  <VStack align="stretch" spacing={3}>
                    <Heading as="h3" size="xs">
                      {aggregatedInsight.title}
                    </Heading>
                    <Text fontSize="sm" color="figma.fg" lineHeight="tall" whiteSpace="pre-wrap">
                      {aggregatedInsight.summary}
                    </Text>
                    <Text fontSize="xs" color="figma.fg_muted">
                      {aggregatedInsight.keyNeeds.length} key need
                      {aggregatedInsight.keyNeeds.length !== 1 ? "s" : ""} · Generated{" "}
                      {formatDate(aggregatedInsight.createdAt)}
                    </Text>
                  </VStack>
                </Card>
              </Box>
            )}
          </>
        )}
      </VStack>
    </Container>
  );
}
