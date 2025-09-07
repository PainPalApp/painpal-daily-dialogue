import { Navigation } from "@/components/Navigation";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Page Content with proper spacing */}
      <main className="pt-0">
        {children}
      </main>
    </div>
  );
}