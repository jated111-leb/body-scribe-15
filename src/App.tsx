import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { FloatingChat } from "@/components/FloatingChat";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import RoleSelection from "./pages/RoleSelection";
import Onboarding from "./pages/Onboarding";
import DieticianOnboarding from "./pages/DieticianOnboarding";
import Dashboard from "./pages/Dashboard";
import DieticianDashboard from "./pages/DieticianDashboard";
import ClientProfile from "./pages/ClientProfile";
import AcceptInvitation from "./pages/AcceptInvitation";
import Settings from "./pages/Settings";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/invite" element={<AcceptInvitation />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/role-selection" element={
              <ProtectedRoute requireAuth={true}>
                <RoleSelection />
              </ProtectedRoute>
            } />
            <Route path="/onboarding" element={
              <ProtectedRoute requireAuth={true}>
                <Onboarding />
              </ProtectedRoute>
            } />
            <Route path="/dietician-onboarding" element={
              <ProtectedRoute requireAuth={true}>
                <DieticianOnboarding />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute requireRole="client">
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/dietician-dashboard" element={
              <ProtectedRoute requireRole="dietician">
                <DieticianDashboard />
              </ProtectedRoute>
            } />
            <Route path="/client/:clientId" element={
              <ProtectedRoute requireRole="dietician">
                <ClientProfile />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute requireAuth={true}>
                <Settings />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <FloatingChat />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
