import React from "react";
import {
  extendTheme,
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
  Button as ChakraButton,
  Text,
  Card as ChakraCard,
  VStack,
  Textarea,
  Input,
  Spinner,
  Divider,
  Select,
  useDisclosure,
  Modal,
} from "@chakra-ui/react";

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

// App uses label prop; Chakra Button uses children.
export function Button(props) {
  const { label, children, ...rest } = props;
  return React.createElement(ChakraButton, rest, label ?? children);
}

// App uses cardVariant; Chakra Card uses variant.
export function Card(props) {
  const { cardVariant, variant, ...rest } = props;
  return React.createElement(ChakraCard, { ...rest, variant: cardVariant ?? variant });
}

export { Box, Container, Heading, HStack, Link, Tabs, TabList, Tab, TabPanels, TabPanel, Badge, Text, VStack, Textarea, Input, Spinner, Divider, Select, useDisclosure };
export { Modal as Dialog } from "@chakra-ui/react";
