import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import RaffleDetail from "./pages/RaffleDetail";
import Activity from "./pages/Activity";
import Profile from "./pages/Profile";
import About from "./pages/About";
import Rules from "./pages/Rules";
import FAQ from "./pages/FAQ";
import NotFound from "./pages/NotFound";
import LoadingScreen from "./components/LoadingScreen";
import NavigationLoadingScreen from "./components/NavigationLoadingScreen";
import DesignCard from "./pages/DesignCard";
import { LoadingProvider, useLoading } from "./contexts/LoadingContext";

// Export queryClient untuk digunakan di seluruh aplikasi
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent = () => {
  const { isLoading: isNavigationLoading, hideLoading } = useLoading();

  if (isNavigationLoading) {
    return <NavigationLoadingScreen onLoadingComplete={hideLoading} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/app" element={<Dashboard />} />
      <Route path="/raffle/:id" element={<RaffleDetail />} />
      <Route path="/activity" element={<Activity />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/about" element={<About />} />
      <Route path="/rules" element={<Rules />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/designcard" element={<DesignCard />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasShownLoading, setHasShownLoading] = useState(false);

  useEffect(() => {
    // Check if loading has been shown before
    const loadingShown = sessionStorage.getItem('loadingShown');
    if (loadingShown) {
      setIsLoading(false);
      setHasShownLoading(true);
    }
  }, []);

  const handleLoadingComplete = () => {
    sessionStorage.setItem('loadingShown', 'true');
    setIsLoading(false);
    setHasShownLoading(true);
  };

  if (isLoading && !hasShownLoading) {
    return <LoadingScreen onLoadingComplete={handleLoadingComplete} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <LoadingProvider>
            <AppContent />
          </LoadingProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
