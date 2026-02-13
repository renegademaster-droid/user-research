import {
  Button,
  Card,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Divider,
} from "design-system";
import type { UserNeed } from "../types";

export interface UserNeedsListProps {
  needs: UserNeed[];
  onBackToChat?: () => void;
  onNewSession?: () => void;
}

const priorityColor: Record<NonNullable<UserNeed["priority"]>, string> = {
  high: "red",
  medium: "orange",
  low: "gray",
};

export function UserNeedsList({
  needs,
  onBackToChat,
  onNewSession,
}: UserNeedsListProps) {
  if (needs.length === 0) {
    return (
      <Container maxW="720px" py={8}>
        <Card cardVariant="subtle" p={6}>
          <Text color="figma.fg_muted">
            No structured needs yet. Continue the conversation and use “Generate structured needs” to create them from the dialogue.
          </Text>
          {onBackToChat && (
            <Button
              mt={4}
              colorScheme="teal"
              variant="outline"
              label="Back to conversation"
              onClick={onBackToChat}
            />
          )}
        </Card>
      </Container>
    );
  }

  return (
    <Container maxW="720px" py={6}>
      <VStack align="stretch" spacing={6}>
        <HStack justify="space-between" align="center" flexWrap="wrap" gap={2}>
          <Heading size="lg">Structured user needs</Heading>
          <HStack gap={2}>
            {onBackToChat && (
              <Button
                size="sm"
                variant="outline"
                colorScheme="teal"
                label="Back to conversation"
                onClick={onBackToChat}
              />
            )}
            {onNewSession && (
              <Button
                size="sm"
                colorScheme="teal"
                label="New research session"
                onClick={onNewSession}
              />
            )}
          </HStack>
        </HStack>

        <Text color="figma.fg_muted" fontSize="sm">
          Use these needs to inform service prototypes and test with users.
        </Text>

        <VStack align="stretch" spacing={4}>
          {needs.map((need) => (
            <Card key={need.id} cardVariant="outline" p={5}>
              <VStack align="stretch" spacing={2}>
                <HStack justify="space-between" align="flex-start" gap={2} flexWrap="wrap">
                  <Heading as="h3" size="sm" fontWeight="600">
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
                  </HStack>
                </HStack>
                <Text fontSize="sm" color="figma.fg" lineHeight="tall">
                  {need.description}
                </Text>
                {need.evidence && (
                  <>
                    <Divider />
                    <Text fontSize="xs" color="figma.fg_muted" fontStyle="italic">
                      “{need.evidence}”
                    </Text>
                  </>
                )}
              </VStack>
            </Card>
          ))}
        </VStack>
      </VStack>
    </Container>
  );
}
