import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "design-system";
import { AppLayout } from "./components/AppLayout";
import App from "./App";
import { SurveyParticipantView } from "./pages/SurveyParticipantView";
import { UserNeedsPage } from "./pages/UserNeedsPage";
import { RecruitmentPortal } from "./pages/RecruitmentPortal";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <BrowserRouter basename="/userresearch">
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<App />} />
            <Route path="/user-needs" element={<UserNeedsPage />} />
            <Route path="/recruitment" element={<RecruitmentPortal />} />
          </Route>
          <Route path="/survey/:id" element={<SurveyParticipantView />} />
        </Routes>
      </BrowserRouter>
    </ChakraProvider>
  </React.StrictMode>
);
