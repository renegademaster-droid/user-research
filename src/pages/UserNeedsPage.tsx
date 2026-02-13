import { useState } from "react";
import {
  Box,
  Button,
  Card,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Textarea,
} from "design-system";
import { pdfToText } from "../pdfToText";
import { agent } from "../agent";
import type { StudySummaryFinding } from "../types";

function formatSynthesisForCopy(synthesis: string, findings: StudySummaryFinding[]): string {
  let out = synthesis + "\n\n";
  out += "Main findings and possible resolutions\n";
  out += "=====================================\n\n";
  findings.forEach((f, i) => {
    out += `${i + 1}. ${f.finding}\n`;
    f.resolutions.forEach((r) => {
      out += `   • ${r}\n`;
    });
    out += "\n";
  });
  return out;
}

export function UserNeedsPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "parsing" | "analyzing" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [synthesis, setSynthesis] = useState<string | null>(null);
  const [findings, setFindings] = useState<StudySummaryFinding[]>([]);
  const [designSystemPrompt, setDesignSystemPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState<"synthesis" | "prompt" | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const pdfs = selected.filter((f) => f.type === "application/pdf");
    setFiles((prev) => (e.target.multiple ? [...prev, ...pdfs] : pdfs));
    e.target.value = "";
    setStatus("idle");
    setError(null);
    setSynthesis(null);
    setFindings([]);
    setDesignSystemPrompt(null);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (files.length === 0) {
      setError("Upload at least one PDF.");
      return;
    }
    setError(null);
    setStatus("parsing");
    const texts: string[] = [];
    for (const file of files) {
      const result = await pdfToText(file);
      if (result.error) {
        setError(`Failed to read "${file.name}": ${result.error}`);
        setStatus("error");
        return;
      }
      if (!result.text.trim()) {
        setError(`No text in "${file.name}" (e.g. scanned image).`);
        setStatus("error");
        return;
      }
      texts.push(result.text);
    }
    setStatus("analyzing");
    try {
      const { synthesis: syn, findings: f, designSystemPrompt: prompt } =
        await agent.analyzeStudySummaries(texts);
      setSynthesis(syn);
      setFindings(f);
      setDesignSystemPrompt(prompt);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
      setStatus("error");
    }
  };

  const copyToClipboard = async (
    value: string,
    which: "synthesis" | "prompt"
  ) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <Container maxW="800px" py={8}>
      <VStack align="stretch" spacing={6}>
        <Box>
          <Heading size="lg" mb={2}>
            User needs
          </Heading>
          <Text color="figma.fg_muted" fontSize="sm">
            Upload one or more PDFs that summarise the outcomes, results and synthesis of your user
            studies. The service will analyse them and suggest what kind of digital service to build,
            plus a prompt for creating it with the design system.
          </Text>
        </Box>

        <Card cardVariant="outline" p={6}>
          <VStack align="stretch" spacing={4}>
            <Heading size="sm">Upload study summaries (PDF)</Heading>
            <Text fontSize="sm" color="figma.fg_muted">
              Add one or many PDF files. Each file should be a manually created summary of a group
              of user studies (outcomes, results, synthesis).
            </Text>
            <Box>
              <input
                type="file"
                accept=".pdf,application/pdf"
                multiple
                onChange={handleFileChange}
                style={{
                  padding: "8px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              />
            </Box>
            {files.length > 0 && (
              <VStack align="stretch" spacing={2}>
                <Text fontSize="sm" fontWeight="500">
                  {files.length} file{files.length !== 1 ? "s" : ""} selected
                </Text>
                {files.map((file, i) => (
                  <HStack key={i} justify="space-between" bg="figma.bgSubtle" p={2} borderRadius="md">
                    <Text fontSize="sm" noOfLines={1}>
                      {file.name}
                    </Text>
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => removeFile(i)}
                    >
                      Remove
                    </Button>
                  </HStack>
                ))}
              </VStack>
            )}
            {error && (
              <Text fontSize="sm" color="red.500">
                {error}
              </Text>
            )}
            <Button
              colorScheme="teal"
              label={
                status === "parsing"
                  ? "Reading PDFs…"
                  : status === "analyzing"
                    ? "Analysing…"
                    : "Analyse and create synthesis"
              }
              onClick={handleAnalyze}
              isDisabled={files.length === 0 || status === "parsing" || status === "analyzing"}
            />
          </VStack>
        </Card>

        {status === "done" && synthesis && designSystemPrompt && (
          <VStack align="stretch" spacing={6}>
            <Card cardVariant="outline" p={6}>
              <HStack justify="space-between" mb={3}>
                <Heading size="sm">Synthesis: what digital service to create</Heading>
                <Button
                  size="xs"
                  variant="outline"
                  colorScheme="teal"
                  label={copied === "synthesis" ? "Copied!" : "Copy full synthesis"}
                  onClick={() =>
                    copyToClipboard(
                      formatSynthesisForCopy(synthesis, findings),
                      "synthesis"
                    )
                  }
                />
              </HStack>
              <Textarea
                value={synthesis}
                isReadOnly
                rows={14}
                fontSize="sm"
                fontFamily="body"
                bg="figma.bgSubtle"
              />
            </Card>

            <Card cardVariant="outline" p={6}>
              <Heading size="sm" mb={3}>
                Main findings and possible resolutions
              </Heading>
              <Text fontSize="sm" color="figma.fg_muted" mb={4}>
                {findings.length} finding{findings.length !== 1 ? "s" : ""} from the study
                summaries with suggested resolutions.
              </Text>
              <VStack align="stretch" spacing={4}>
                {findings.map((f, i) => (
                  <Box
                    key={i}
                    p={4}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor="figma.borderDefault"
                    bg="figma.bgSubtle"
                  >
                    <Text fontWeight="600" fontSize="sm" mb={2}>
                      {i + 1}. {f.finding}
                    </Text>
                    <VStack align="stretch" spacing={1} pl={2} borderLeftWidth="2px" borderColor="teal.300">
                      {f.resolutions.map((r, j) => (
                        <Text key={j} fontSize="sm" color="figma.fg">
                          • {r}
                        </Text>
                      ))}
                    </VStack>
                  </Box>
                ))}
              </VStack>
            </Card>

            <Card cardVariant="outline" p={6} borderColor="teal.200" bg="teal.50">
              <HStack justify="space-between" mb={3}>
                <Heading size="sm">Prompt: create the service with the design system</Heading>
                <Button
                  size="xs"
                  variant="outline"
                  colorScheme="teal"
                  label={copied === "prompt" ? "Copied!" : "Copy prompt"}
                  onClick={() => copyToClipboard(designSystemPrompt, "prompt")}
                />
              </HStack>
              <Text fontSize="xs" color="figma.fg_muted" mb={2}>
                Use this prompt with the design system (/gds/chakra-app/src/design-system) to build
                the service.
              </Text>
              <Textarea
                value={designSystemPrompt}
                isReadOnly
                rows={16}
                fontSize="sm"
                fontFamily="mono"
                bg="figma.default"
              />
            </Card>
          </VStack>
        )}
      </VStack>
    </Container>
  );
}
