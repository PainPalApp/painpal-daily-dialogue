import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Today from "./pages/TodayV2";
import Insights from "./pages/Insights";
import Records from "./pages/Records";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <div className="dark">
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
           <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/track" element={<AppShell><Today /></AppShell>} />
            <Route path="/insights" element={<AppShell><Insights /></AppShell>} />
            <Route path="/records" element={<AppShell><Records /></AppShell>} />
            <Route path="/profile" element={<AppShell><Profile /></AppShell>} />
            <Route path="/" element={<Navigate to="/track" replace />} />
            <Route path="/today" element={<Navigate to="/track" replace />} />
            <Route path="/today-old" element={<Navigate to="/track" replace />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </AuthProvider>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
