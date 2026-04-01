import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AISchedule from "./pages/AISchedule";
import StudyPlan from "./pages/StudyPlan";
import SessionTracker from "./pages/SessionTracker";
import ProgressTracker from "./pages/ProgressTracker";
import Reminders from "./pages/Reminders";
import SettingsPage from "./pages/SettingsPage";
import AppLayout from "./components/AppLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/ai-schedule" element={<AISchedule />} />
              <Route path="/study-plan" element={<StudyPlan />} />
              <Route path="/session-tracker" element={<SessionTracker />} />
              <Route path="/progress" element={<ProgressTracker />} />
              <Route path="/reminders" element={<Reminders />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
