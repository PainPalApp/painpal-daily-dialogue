import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { TodaySection } from "@/components/TodaySection";
import { InsightsSection } from "@/components/InsightsSection";
import { RecordsSection } from "@/components/RecordsSection";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState(searchParams.get('section') || "today");
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (user) {
      checkOnboardingStatus();
    }
  }, [user, loading, navigate]);

  const checkOnboardingStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user!.id)
        .single();

      if (error) throw error;
      
      setShowOnboarding(!data?.onboarding_completed);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setShowOnboarding(true); // Default to showing onboarding if error
    } finally {
      setProfileLoading(false);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const renderContent = () => {
    switch (activeSection) {
      case "today":
        return <TodaySection onNavigateToInsights={() => setActiveSection('insights')} />;
      case "insights":
        return <InsightsSection />;
      case "records":
        return <RecordsSection />;
      default:
        return <TodaySection onNavigateToInsights={() => setActiveSection('insights')} />;
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation activeSection={activeSection} onSectionChange={setActiveSection} />
      {renderContent()}
    </div>
  );
};

export default Index;
