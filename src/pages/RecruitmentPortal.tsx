import { useMemo, useState } from "react";
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
  Input,
  Textarea,
  Select,
  Dialog,
} from "design-system";
import { recruitmentProfiles } from "../data/recruitmentProfiles";
import type { RecruitmentProfile, RecruitmentSignup } from "../types";

const SIGNUPS_KEY = "user-research-recruitment-signups";

function loadSignups(): RecruitmentSignup[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SIGNUPS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecruitmentSignup[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSignups(signups: RecruitmentSignup[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SIGNUPS_KEY, JSON.stringify(signups));
}

function getUniqueValues<T>(items: RecruitmentProfile[], key: keyof RecruitmentProfile): T[] {
  const set = new Set(items.map((p) => p[key] as T));
  return Array.from(set).filter(Boolean).sort();
}

export function RecruitmentPortal() {
  const [signups, setSignups] = useState<RecruitmentSignup[]>(loadSignups);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [segmentFilter, setSegmentFilter] = useState<string>("");
  const [topicFilter, setTopicFilter] = useState<string>("");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("");
  const [selectedProfile, setSelectedProfile] = useState<RecruitmentProfile | null>(null);
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupMessage, setSignupMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const categories = useMemo(() => getUniqueValues<string>(recruitmentProfiles, "category"), []);
  const segments = useMemo(() => getUniqueValues<string>(recruitmentProfiles, "segment"), []);
  const topics = useMemo(() => getUniqueValues<string>(recruitmentProfiles, "topic"), []);

  const filteredProfiles = useMemo(() => {
    return recruitmentProfiles.filter((p) => {
      if (categoryFilter && p.category !== categoryFilter) return false;
      if (segmentFilter && p.segment !== segmentFilter) return false;
      if (topicFilter && p.topic !== topicFilter) return false;
      if (availabilityFilter && p.availability !== availabilityFilter) return false;
      return true;
    });
  }, [categoryFilter, segmentFilter, topicFilter, availabilityFilter]);

  const handleOpenSignup = (profile: RecruitmentProfile) => {
    setSelectedProfile(profile);
    setSignupName("");
    setSignupEmail("");
    setSignupMessage("");
    setSubmitted(false);
  };

  const handleCloseSignup = () => {
    setSelectedProfile(null);
  };

  const handleSubmitSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile || !signupName.trim() || !signupEmail.trim()) return;
    const signup: RecruitmentSignup = {
      id: `signup-${Date.now()}`,
      profileId: selectedProfile.id,
      name: signupName.trim(),
      email: signupEmail.trim(),
      message: signupMessage.trim() || undefined,
      createdAt: Date.now(),
    };
    const next = [...signups, signup];
    setSignups(next);
    saveSignups(next);
    setSubmitted(true);
    setSignupName("");
    setSignupEmail("");
    setSignupMessage("");
  };

  return (
    <Container maxW="1100px" py={8}>
      <VStack align="stretch" spacing={6}>
        <Box>
          <Heading size="lg" mb={2}>
            Recruitment portal
          </Heading>
          <Text color="figma.fg_muted" fontSize="sm">
            Browse user profiles we're recruiting for. Filter by category, segment, topic and
            availability, then sign up to the profiles you're interested in.
          </Text>
        </Box>

        <Card cardVariant="outline" p={4}>
          <Heading size="sm" mb={3}>
            Filters
          </Heading>
          <HStack gap={4} flexWrap="wrap" align="flex-end">
            <Box minW="140px">
              <Select
                label="Category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Box>
            <Box minW="140px">
              <Select
                label="Segment"
                value={segmentFilter}
                onChange={(e) => setSegmentFilter(e.target.value)}
              >
                <option value="">All</option>
                {segments.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Box>
            <Box minW="140px">
              <Select
                label="Topic"
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
              >
                <option value="">All</option>
                {topics.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Box>
            <Box minW="120px">
              <Select
                label="Availability"
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="open">Open</option>
                <option value="full">Full</option>
              </Select>
            </Box>
            <Button
              size="sm"
              variant="outline"
              colorScheme="teal"
              label="Clear filters"
              onClick={() => {
                setCategoryFilter("");
                setSegmentFilter("");
                setTopicFilter("");
                setAvailabilityFilter("");
              }}
            />
          </HStack>
        </Card>

        <Text fontSize="sm" color="figma.fg_muted">
          {filteredProfiles.length} profile{filteredProfiles.length !== 1 ? "s" : ""} matching your
          filters
        </Text>

        <Box
          display="grid"
          gridTemplateColumns="repeat(auto-fill, minmax(320px, 1fr))"
          gap={4}
        >
          {filteredProfiles.map((profile) => (
            <Card key={profile.id} cardVariant="outline" p={5}>
              <VStack align="stretch" spacing={3}>
                <HStack justify="space-between" align="flex-start" gap={2}>
                  <Heading as="h3" size="sm" fontWeight="600">
                    {profile.title}
                  </Heading>
                  <Badge
                    colorScheme={profile.availability === "open" ? "green" : "gray"}
                    variant="subtle"
                    fontSize="xs"
                  >
                    {profile.availability === "open" ? "Open" : "Full"}
                  </Badge>
                </HStack>
                <Text fontSize="sm" color="figma.fg_muted" lineHeight="tall" noOfLines={4}>
                  {profile.description}
                </Text>
                <HStack gap={2} flexWrap="wrap">
                  <Badge variant="outline" fontSize="xs" colorScheme="teal">
                    {profile.category}
                  </Badge>
                  <Badge variant="outline" fontSize="xs" colorScheme="gray">
                    {profile.segment}
                  </Badge>
                  <Badge variant="outline" fontSize="xs" colorScheme="gray">
                    {profile.topic}
                  </Badge>
                </HStack>
                {profile.studyTitle && (
                  <Text fontSize="xs" color="figma.fg_muted">
                    Study: {profile.studyTitle}
                  </Text>
                )}
                <Button
                  size="sm"
                  colorScheme="teal"
                  label="Sign up"
                  onClick={() => handleOpenSignup(profile)}
                  isDisabled={profile.availability === "full"}
                />
              </VStack>
            </Card>
          ))}
        </Box>

        {filteredProfiles.length === 0 && (
          <Card cardVariant="subtle" p={6}>
            <Text color="figma.fg_muted">
              No profiles match the current filters. Try changing or clearing the filters.
            </Text>
          </Card>
        )}
      </VStack>

      <Dialog
        isOpen={!!selectedProfile}
        onClose={handleCloseSignup}
        title={selectedProfile ? `Sign up: ${selectedProfile.title}` : ""}
        footer={
          submitted ? (
            <Button colorScheme="teal" label="Done" onClick={handleCloseSignup} />
          ) : (
            <HStack gap={2}>
              <Button variant="ghost" onClick={handleCloseSignup}>
                Cancel
              </Button>
              <Button
                type="button"
                colorScheme="teal"
                label="Submit"
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmitSignup(e as unknown as React.FormEvent);
                }}
                isDisabled={!signupName.trim() || !signupEmail.trim()}
              />
            </HStack>
          )
        }
      >
        {selectedProfile && (
          <>
            {submitted ? (
              <Text>
                Thanks for signing up. We'll be in touch about the "{selectedProfile.title}"
                profile.
              </Text>
            ) : (
              <Box as="form" onSubmit={handleSubmitSignup}>
                <VStack align="stretch" spacing={4}>
                  <Text fontSize="sm" color="figma.fg_muted">
                    {selectedProfile.description}
                  </Text>
                  <Input
                    label="Name"
                    placeholder="Your name"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    isRequired
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="your@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    isRequired
                  />
                  <Textarea
                    label="Message (optional)"
                    placeholder="Anything you'd like to add?"
                    value={signupMessage}
                    onChange={(e) => setSignupMessage(e.target.value)}
                    rows={3}
                  />
                </VStack>
              </Box>
            )}
          </>
        )}
      </Dialog>
    </Container>
  );
}
