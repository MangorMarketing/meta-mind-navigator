
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Settings from "@/pages/Settings";
import Reports from "@/pages/Reports";
import MetaCallback from "@/pages/MetaCallback";
import NotFound from "@/pages/NotFound";
import AIInsights from "@/pages/AIInsights";
import AIChat from "@/pages/AIChat";
import CampaignAnalytics from "@/pages/CampaignAnalytics";
import CreativeLibrary from "@/pages/CreativeLibrary";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/insights" element={<ProtectedRoute><AIInsights /></ProtectedRoute>} />
            <Route path="/ai-chat" element={<ProtectedRoute><AIChat /></ProtectedRoute>} />
            <Route path="/campaign-analytics" element={<ProtectedRoute><CampaignAnalytics /></ProtectedRoute>} />
            <Route path="/creative-library" element={<ProtectedRoute><CreativeLibrary /></ProtectedRoute>} />
            <Route path="/auth/meta/callback" element={<MetaCallback />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
