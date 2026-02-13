import { extendTheme } from "@chakra-ui/react";

export const theme = extendTheme({
  semanticTokens: {
    colors: {
      "figma.fg": { default: "gray.800", _dark: "white" },
      "figma.fg_muted": { default: "gray.600", _dark: "gray.400" },
      "figma.bgSubtle": { default: "gray.50", _dark: "gray.900" },
      "figma.default": { default: "white", _dark: "gray.800" },
      "figma.borderDefault": { default: "gray.200", _dark: "gray.700" },
    },
  },
});

export {
  Box,
  Container,
  Heading,
  HStack,
  Link,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Badge,
  Button,
  Text,
  Card,
  VStack,
  Textarea,
  Input,
  Spinner,
  Divider,
  Select,
  useDisclosure,
} from "@chakra-ui/react";
export { Modal as Dialog } from "@chakra-ui/react";
