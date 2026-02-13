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
import type { ConsolidatedInsight } from "../types";

const priorityColor: Record<"high" | "medium" | "low", string> = {
  high: "red",
  medium: "orange",
  low: "gray",
};

export interface ConsolidatedInsightViewProps {
  insight: ConsolidatedInsight;
  onBackToParticipants?: () => void;
  onNewStudy?: () => void;
}

export function ConsolidatedInsightView({
  insight,
  onBackToParticipants,
  onNewStudy,
}: ConsolidatedInsightViewProps) {
  return (
    <Container maxW="720px" py={6}>
      <VStack align="stretch" spacing={6}>
        <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap={2}>
          <Heading size="lg">{insight.title}</Heading>
          <HStack gap={2}>
            {onBackToParticipants && (
              <Button
                size="sm"
                variant="outline"
                colorScheme="teal"
                label="Back to participants"
                onClick={onBackToParticipants}
              />
            )}
            {onNewStudy && (
              <Button
                size="sm"
                colorScheme="teal"
                label="New research study"
                onClick={onNewStudy}
              />
            )}
          </HStack>
        </HStack>

        <Text color="figma.fg_muted" fontSize="sm">
          Use this consolidated insight as the basis for your service prototype.
        </Text>

        <Card cardVariant="outline" p={5}>
          <Heading as="h2" size="sm" mb={3} color="figma.fg">
            Summary
          </Heading>
          <Text fontSize="sm" color="figma.fg" lineHeight="tall" whiteSpace="pre-wrap">
            {insight.summary}
          </Text>
        </Card>

        <Box>
          <Heading as="h2" size="sm" mb={3} color="figma.fg">
            Key needs (synthesized)
          </Heading>
          <VStack align="stretch" spacing={3}>
            {insight.keyNeeds.map((need, i) => (
              <Card key={i} cardVariant="outline" p={4}>
                <VStack align="stretch" spacing={2}>
                  <HStack justify="space-between" align="flex-start" gap={2} flexWrap="wrap">
                    <Heading as="h3" size="xs" fontWeight="600">
                      {need.title}
                    </Heading>
                    <HStack gap={2}>
                      {need.priority && (
                        <Badge
                          colorScheme={priorityColor[need.priority]}
                          variant="subtle"
                          fontSize="xs"
                        >
                          {need.priority}
                        </Badge>
                      )}
                      {need.category && (
                        <Badge colorScheme="teal" variant="outline" fontSize="xs">
                          {need.category}
                        </Badge>
                      )}
                      {need.participantCount != null && (
                        <Badge variant="subtle" fontSize="xs" colorScheme="gray">
                          {need.participantCount} participant{need.participantCount !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </HStack>
                  </HStack>
                  <Text fontSize="sm" color="figma.fg" lineHeight="tall">
                    {need.description}
                  </Text>
                </VStack>
              </Card>
            ))}
          </VStack>
        </Box>

        {insight.patterns && insight.patterns.length > 0 && (
          <Card cardVariant="subtle" p={5}>
            <Heading as="h2" size="sm" mb={3} color="figma.fg">
              Patterns across responses
            </Heading>
            <VStack as="ul" align="stretch" spacing={2} listStyleType="disc" pl={4}>
              {insight.patterns.map((pattern, i) => (
                <Text key={i} as="li" fontSize="sm" color="figma.fg">
                  {pattern}
                </Text>
              ))}
            </VStack>
          </Card>
        )}

        {insight.recommendations && insight.recommendations.length > 0 && (
          <Card cardVariant="outline" p={5} borderColor="teal.200" bg="teal.50">
            <Heading as="h2" size="sm" mb={3} color="figma.fg">
              Recommendations for prototype
            </Heading>
            <VStack as="ol" align="stretch" spacing={2} listStyleType="decimal" pl={4}>
              {insight.recommendations.map((rec, i) => (
                <Text key={i} as="li" fontSize="sm" color="figma.fg" lineHeight="tall">
                  {rec}
                </Text>
              ))}
            </VStack>
          </Card>
        )}
      </VStack>
    </Container>
  );
}
