import React, { useRef, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  Container,
  Heading,
  Text,
  Textarea,
  VStack,
  HStack,
  Badge,
  Spinner,
} from "design-system";
import { useSpeechRecognition } from "../useSpeechRecognition";
import type { Message, ResearchTheme } from "../types";

export interface ChatProps {
  theme: ResearchTheme;
  messages: Message[];
  isAgentThinking: boolean;
  onSendMessage: (content: string) => void;
  onGenerateNeeds: () => void;
}

export function Chat({
  theme,
  messages,
  isAgentThinking,
  onSendMessage,
  onGenerateNeeds,
}: ChatProps) {
  const [input, setInput] = React.useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { isSupported: isSpeechSupported, isListening, error: speechError, toggle: toggleMic } =
    useSpeechRecognition({
      onResult: (transcript) => {
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      },
    });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAgentThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isAgentThinking) return;
    onSendMessage(trimmed);
    setInput("");
  };

  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const canGenerateNeeds = userMessageCount >= 2 && !isAgentThinking;

  return (
    <Container maxW="720px" py={6} display="flex" flexDirection="column" height="100%">
      <VStack align="stretch" spacing={4} flex={1} minH={0}>
        <HStack justify="space-between" align="center" flexShrink={0}>
          <Box>
            <Heading size="md">{theme.title}</Heading>
            <Text fontSize="sm" color="figma.fg_muted" mt={1}>
              {theme.description}
            </Text>
          </Box>
          {theme.focusAreas?.length ? (
            <HStack gap={2} flexWrap="wrap">
              {theme.focusAreas.map((area) => (
                <Badge key={area} colorScheme="teal" variant="subtle" fontSize="xs">
                  {area}
                </Badge>
              ))}
            </HStack>
          ) : null}
        </HStack>

        <Box
          flex={1}
          overflowY="auto"
          borderRadius="lg"
          borderWidth="1px"
          borderColor="figma.borderDefault"
          bg="figma.bgSubtle"
          p={4}
        >
          <VStack align="stretch" spacing={4} pb={2}>
            {messages.map((msg) => (
              <Box
                key={msg.id}
                alignSelf={msg.role === "user" ? "flex-end" : "flex-start"}
                maxW="85%"
              >
                <Card
                  cardVariant={msg.role === "user" ? "subtle" : "outline"}
                  p={3}
                  bg={msg.role === "user" ? "teal.50" : "figma.default"}
                  borderColor={msg.role === "user" ? "teal.200" : undefined}
                >
                  <Text fontSize="xs" color="figma.fg_muted" mb={1}>
                    {msg.role === "agent" ? "Agent" : "You"}
                  </Text>
                  <Text fontSize="sm" whiteSpace="pre-wrap">
                    {msg.content}
                  </Text>
                </Card>
              </Box>
            ))}
            {isAgentThinking && (
              <HStack align="flex-start" spacing={2} p={3}>
                <Spinner size="sm" color="teal.500" />
                <Text fontSize="sm" color="figma.fg_muted">
                  Agent is thinking…
                </Text>
              </HStack>
            )}
            <div ref={bottomRef} />
          </VStack>
        </Box>

        <Box flexShrink={0} as="form" onSubmit={handleSubmit}>
          <VStack align="stretch" spacing={2}>
            {speechError && (
              <Text fontSize="xs" color="red.500" role="alert">
                {speechError}
              </Text>
            )}
            <HStack as="div" gap={2} align="flex-end">
              <Textarea
                placeholder="Type your response… or use the mic to speak"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                rows={2}
                resize="none"
                flex={1}
                isDisabled={isAgentThinking}
              />
              {isSpeechSupported && (
                <Button
                  type="button"
                  aria-label={isListening ? "Stop speaking" : "Speak your response"}
                  colorScheme={isListening ? "red" : "gray"}
                  variant={isListening ? "solid" : "outline"}
                  label={isListening ? "Stop" : "Speak"}
                  onClick={toggleMic}
                  isDisabled={isAgentThinking}
                />
              )}
              <Button
                type="submit"
                colorScheme="teal"
                label="Send"
                isDisabled={!input.trim() || isAgentThinking}
              />
            </HStack>
            {isListening && (
              <Text fontSize="xs" color="figma.fg_muted">
                Listening… Speak your answer, then tap Stop or Send when done.
              </Text>
            )}
            {canGenerateNeeds && (
              <Button
                size="sm"
                variant="outline"
                colorScheme="teal"
                label="Generate structured needs from conversation"
                onClick={onGenerateNeeds}
              />
            )}
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}
