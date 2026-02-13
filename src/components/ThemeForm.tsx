import React, { useState } from "react";
import {
  Button,
  Card,
  Container,
  Heading,
  Input,
  Text,
  Textarea,
  VStack,
  HStack,
  Box,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Spinner,
} from "design-system";
import { pdfToText } from "../pdfToText";
import { agent } from "../agent";
import type { DerivedThemeFields, ResearchTheme } from "../types";

export interface ThemeFormProps {
  onSubmit: (theme: ResearchTheme) => void;
}

type InputMode = "manual" | "pdf";

export function ThemeForm({ onSubmit }: ThemeFormProps) {
  const [inputMode, setInputMode] = useState<InputMode>("manual");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [focusAreasRaw, setFocusAreasRaw] = useState("");
  const [existingWebService, setExistingWebService] = useState("");

  // PDF flow
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfStatus, setPdfStatus] = useState<"idle" | "parsing" | "deriving" | "ready" | "error">("idle");
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfText, setPdfText] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const focusAreas = focusAreasRaw
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    onSubmit({
      id: `theme-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      focusAreas: focusAreas.length > 0 ? focusAreas : undefined,
      existingWebService: existingWebService.trim() || undefined,
      sourcePdfText: pdfText ?? undefined,
      sourcePdfFileName: pdfFile?.name,
      createdAt: Date.now(),
    });
  };

  const applyDerivedFields = (derived: DerivedThemeFields) => {
    setTitle(derived.title);
    setDescription(derived.description);
    setFocusAreasRaw(derived.focusAreas?.join(", ") ?? "");
  };

  const handlePdfSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf") {
      setPdfError("Please select a PDF file.");
      setPdfStatus("error");
      return;
    }
    setPdfFile(file);
    setPdfError(null);
    setPdfStatus("parsing");
    const result = await pdfToText(file);
    if (result.error) {
      setPdfError(result.error);
      setPdfStatus("error");
      return;
    }
    if (!result.text.trim()) {
      setPdfError("No text could be extracted from this PDF (e.g. scanned image).");
      setPdfStatus("error");
      return;
    }
    setPdfText(result.text);
    setPdfStatus("deriving");
    try {
      const derived = await agent.deriveThemeFromPdf(result.text);
      applyDerivedFields(derived);
      setPdfStatus("ready");
    } catch {
      setPdfError("Could not derive theme from PDF.");
      setPdfStatus("error");
    }
  };

  const clearPdf = () => {
    setPdfFile(null);
    setPdfText(null);
    setPdfStatus("idle");
    setPdfError(null);
    setTitle("");
    setDescription("");
    setFocusAreasRaw("");
  };

  const canSubmit =
    title.trim() &&
    description.trim() &&
    (inputMode === "manual" || (inputMode === "pdf" && pdfStatus === "ready"));

  return (
    <Container maxW="640px" py={8}>
      <VStack align="stretch" spacing={6}>
        <Box>
          <Heading size="lg" mb={2}>
            Define the research theme
          </Heading>
          <Text color="figma.fg_muted" fontSize="sm">
            Set the theme for the agent so it can ask the right questions. You can fill in the
            fields manually or upload a PDF and have the theme derived from it.
          </Text>
        </Box>

        <Tabs
          index={inputMode === "manual" ? 0 : 1}
          onChange={(i) => setInputMode(i === 0 ? "manual" : "pdf")}
          variant="enclosed"
        >
          <TabList borderColor="figma.borderDefault">
            <Tab>Define manually</Tab>
            <Tab>Upload PDF</Tab>
          </TabList>
          <TabPanels>
            <TabPanel px={0} pt={4}>
              <Card as="form" onSubmit={handleSubmit} cardVariant="outline" p={6}>
                <VStack align="stretch" spacing={4}>
                  <Input
                    label="Theme title"
                    placeholder="e.g. Booking a visit to a government office"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    isRequired
                  />
                  <Textarea
                    label="Description"
                    placeholder="Describe the area or service you want to research. The agent will use this to guide its questions."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    isRequired
                  />
                  <Textarea
                    label="Focus areas (optional)"
                    placeholder="One per line or comma-separated, e.g. pain points, goals, current workflow"
                    value={focusAreasRaw}
                    onChange={(e) => setFocusAreasRaw(e.target.value)}
                    rows={2}
                  />
                  <Input
                    label="Existing web service (optional)"
                    placeholder="e.g. Service name or URL the survey applies to"
                    value={existingWebService}
                    onChange={(e) => setExistingWebService(e.target.value)}
                  />
                  <HStack justify="flex-end" pt={2}>
                    <Button
                      type="submit"
                      colorScheme="teal"
                      label="Start research session"
                      isDisabled={!title.trim() || !description.trim()}
                    />
                  </HStack>
                </VStack>
              </Card>
            </TabPanel>
            <TabPanel px={0} pt={4}>
              <VStack align="stretch" spacing={4}>
                <Card cardVariant="outline" p={6}>
                  <VStack align="stretch" spacing={4}>
                    <Text fontSize="sm" color="figma.fg_muted">
                      Upload a PDF (e.g. research brief, scope document). The agent will derive the
                      research theme and use the document to determine which questions to ask.
                    </Text>
                    <Box>
                      <Input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handlePdfSelect}
                        sx={{
                          "input[type=file]": {
                            padding: 2,
                            cursor: "pointer",
                          },
                        }}
                      />
                      {pdfStatus === "parsing" && (
                        <HStack mt={2} gap={2}>
                          <Spinner size="sm" color="teal.500" />
                          <Text fontSize="sm" color="figma.fg_muted">
                            Reading PDF…
                          </Text>
                        </HStack>
                      )}
                      {pdfStatus === "deriving" && (
                        <HStack mt={2} gap={2}>
                          <Spinner size="sm" color="teal.500" />
                          <Text fontSize="sm" color="figma.fg_muted">
                            Deriving theme from document…
                          </Text>
                        </HStack>
                      )}
                      {pdfStatus === "error" && pdfError && (
                        <Text fontSize="sm" color="red.500" mt={2}>
                          {pdfError}
                        </Text>
                      )}
                      {pdfFile && pdfStatus === "ready" && (
                        <HStack mt={2} justify="space-between" align="center">
                          <Text fontSize="sm" color="figma.fg_muted">
                            {pdfFile.name}
                          </Text>
                          <Button size="xs" variant="ghost" colorScheme="gray" onClick={clearPdf}>
                            Remove
                          </Button>
                        </HStack>
                      )}
                    </Box>
                  </VStack>
                </Card>

                {pdfStatus === "ready" && (
                  <Card as="form" onSubmit={handleSubmit} cardVariant="outline" p={6}>
                    <Heading size="sm" mb={3}>
                      Extracted theme (edit if needed)
                    </Heading>
                    <VStack align="stretch" spacing={4}>
                      <Input
                        label="Theme title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        isRequired
                      />
                      <Textarea
                        label="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        isRequired
                      />
                      <Textarea
                        label="Focus areas (optional)"
                        value={focusAreasRaw}
                        onChange={(e) => setFocusAreasRaw(e.target.value)}
                        rows={2}
                      />
                      <Input
                        label="Existing web service (optional)"
                        value={existingWebService}
                        onChange={(e) => setExistingWebService(e.target.value)}
                      />
                      <HStack justify="flex-end" pt={2}>
                        <Button
                          type="submit"
                          colorScheme="teal"
                          label="Start research session"
                          isDisabled={!canSubmit}
                        />
                      </HStack>
                    </VStack>
                  </Card>
                )}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
}
