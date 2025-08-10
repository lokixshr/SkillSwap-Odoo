import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import Sessions from "./pages/sessions";
import Notifications from "./pages/notifications";
import NotFound from "./pages/NotFound";
import MessagingTest from "./components/MessagingTest";
import SystemTester from "./components/SystemTester";

// Import debug utilities in development
if (import.meta.env.DEV) {
  import('./utils/messageDebugger');
  import('./utils/firestoreDebug');
  import('./utils/debugGuide');
}

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
            <Route path="/login" element={
              <ProtectedRoute requireAuth={false}>
                <Login />
              </ProtectedRoute>
            } />
            <Route path="/signup" element={
              <ProtectedRoute requireAuth={false}>
                <Signup />
              </ProtectedRoute>
            } />
            <Route path="/onboarding" element={
              <ProtectedRoute requireAuth={true}>
                <Onboarding />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute requireAuth={true}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute requireAuth={true}>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute requireAuth={true}>
                <Messages />
              </ProtectedRoute>
            } />
            <Route path="/sessions" element={
              <ProtectedRoute requireAuth={true}>
                <Sessions />
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute requireAuth={true}>
                <Notifications />
              </ProtectedRoute>
            } />
            <Route path="/test-messaging" element={
              <ProtectedRoute requireAuth={true}>
                <div className="min-h-screen bg-background">
                  <div className="container mx-auto px-4 py-8">
                    <MessagingTest />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/test-system" element={
              <ProtectedRoute requireAuth={true}>
                <div className="min-h-screen bg-background">
                  <div className="container mx-auto px-4 py-8">
                    <SystemTester />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
