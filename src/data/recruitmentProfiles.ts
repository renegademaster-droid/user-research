import type { RecruitmentProfile } from "../types";

export const recruitmentProfiles: RecruitmentProfile[] = [
  {
    id: "profile-1",
    title: "Parents with young children",
    description:
      "We're looking for parents or guardians with at least one child under 5 to share their experience of applying for family benefits and childcare support.",
    category: "Citizens",
    segment: "Parents",
    topic: "Benefits",
    availability: "open",
    studyTitle: "Family benefits service",
  },
  {
    id: "profile-2",
    title: "First-time benefit applicants",
    description:
      "Adults who have never applied for government benefits before and are considering or have just started an application.",
    category: "Citizens",
    segment: "First-time users",
    topic: "Benefits",
    availability: "open",
    studyTitle: "Benefits application journey",
  },
  {
    id: "profile-3",
    title: "Small business owners (1–10 employees)",
    description:
      "Owner or main decision-maker of a small business. We want to understand how you handle tax and reporting obligations.",
    category: "Business",
    segment: "Small business",
    topic: "Tax",
    availability: "open",
    studyTitle: "Business tax portal",
  },
  {
    id: "profile-4",
    title: "Drivers renewing a licence",
    description:
      "People who have renewed or are about to renew their driving licence (any age). We're improving the renewal process.",
    category: "Citizens",
    segment: "General",
    topic: "Licences",
    availability: "full",
    studyTitle: "Licence renewal",
  },
  {
    id: "profile-5",
    title: "Landlords reporting income",
    description:
      "Individuals who earn rental income and need to report it. We're testing a new way to declare property income.",
    category: "Citizens",
    segment: "Landlords",
    topic: "Tax",
    availability: "open",
    studyTitle: "Property income reporting",
  },
  {
    id: "profile-6",
    title: "Newly registered companies",
    description:
      "Someone who has registered a company in the last 12 months. We want to learn about your experience of the registration and first steps.",
    category: "Business",
    segment: "Start-ups",
    topic: "Registration",
    availability: "open",
    studyTitle: "Company registration",
  },
  {
    id: "profile-7",
    title: "Older adults (65+) using digital services",
    description:
      "Adults aged 65 or over who use online government services. We're making our services easier to use for everyone.",
    category: "Citizens",
    segment: "Older adults",
    topic: "Accessibility",
    availability: "open",
    studyTitle: "Inclusive digital services",
  },
  {
    id: "profile-8",
    title: "Jobseekers using employment support",
    description:
      "People who are looking for work and have used or are considering employment support, job search tools or benefit-related services.",
    category: "Citizens",
    segment: "Jobseekers",
    topic: "Benefits",
    availability: "open",
    studyTitle: "Employment support",
  },
];
