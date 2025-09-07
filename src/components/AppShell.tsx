import { useLocation } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: "Today", href: "/" },
    { name: "Insights", href: "/insights" },
    { name: "Records", href: "/records" },
    { name: "Profile", href: "/profile" },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-navbar border-b border-navbar-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            {/* Navigation Links */}
            <div className="flex space-x-8">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors ${
                        isActive
                          ? "text-navbar-accent border-b-2 border-navbar-accent"
                          : "text-navbar-foreground hover:text-navbar-accent hover:border-b-2 hover:border-navbar-accent/50"
                      }`
                    }
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.name}
                  </NavLink>
                );
              })}
            </div>

            {/* Sign Out Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-navbar-foreground hover:text-navbar-accent hover:bg-navbar-accent/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Page Content with proper spacing */}
      <main className="pt-0">
        {children}
      </main>
    </div>
  );
}