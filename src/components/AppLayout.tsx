import { Outlet, NavLink } from "react-router-dom";
import { Box, Container, HStack, Link, Heading } from "design-system";

const navLinkStyle = {
  px: 3,
  py: 2,
  borderRadius: "md",
  fontWeight: 500,
  "&.active": {
    bg: "teal.50",
    color: "teal.700",
  },
};

export function AppLayout() {
  return (
    <Box minH="100%" display="flex" flexDirection="column" bg="figma.bgSubtle">
      <Box
        as="header"
        borderBottomWidth="1px"
        borderColor="figma.borderDefault"
        bg="figma.default"
        py={3}
      >
        <Container maxW="1200px">
          <HStack gap={6} align="center">
            <Heading size="md" color="figma.fg" fontWeight="700">
              User study
            </Heading>
            <HStack as="nav" gap={1}>
              <Link
                as={NavLink}
                to="/"
                end
                color="figma.fg_muted"
                _hover={{ color: "figma.fg" }}
                sx={navLinkStyle}
              >
                Studies
              </Link>
              <Link
                as={NavLink}
                to="/user-needs"
                color="figma.fg_muted"
                _hover={{ color: "figma.fg" }}
                sx={navLinkStyle}
              >
                User needs
              </Link>
              <Link
                as={NavLink}
                to="/recruitment"
                color="figma.fg_muted"
                _hover={{ color: "figma.fg" }}
                sx={navLinkStyle}
              >
                Recruitment
              </Link>
            </HStack>
          </HStack>
        </Container>
      </Box>
      <Box as="main" flex={1} minH={0} display="flex" flexDirection="column">
        <Outlet />
      </Box>
    </Box>
  );
}
