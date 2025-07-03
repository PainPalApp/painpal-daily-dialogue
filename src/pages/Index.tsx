import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { TodaySection } from "@/components/TodaySection";

const Index = () => {
  const [activeSection, setActiveSection] = useState("today");

  const renderContent = () => {
    switch (activeSection) {
      case "today":
        return <TodaySection />;
      case "insights":
        return (
          <div className="flex-1 bg-background flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-4">Insights</h2>
              <p className="text-muted-foreground">Insights section coming soon...</p>
            </div>
          </div>
        );
      case "records":
        return (
          <div className="flex-1 bg-background flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-4">Records</h2>
              <p className="text-muted-foreground">Records section coming soon...</p>
            </div>
          </div>
        );
      default:
        return <TodaySection />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation activeSection={activeSection} onSectionChange={setActiveSection} />
      {renderContent()}
    </div>
  );
};

export default Index;
