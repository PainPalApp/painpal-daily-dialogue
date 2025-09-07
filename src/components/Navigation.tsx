import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { NavLink, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    { id: "today", label: "Today", href: "/" },
    { id: "insights", label: "Insights", href: "/insights" },
    { id: "records", label: "Records", href: "/records" },
    { id: "profile", label: "Profile", href: "/profile" },
  ];

  return (
    <header className="bg-background/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-lg font-semibold text-foreground tracking-tight">PainPal</h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.href}
                  className={({ isActive }) =>
                    `nav-button ${isActive ? "nav-button-active" : ""}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="h-8 w-8 p-0 text-text-secondary hover:text-icon-active hover:bg-accent/10"
            >
              <LogOut className="h-4 w-4 icon-default" />
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="h-8 w-8 p-0"
            >
              <svg
                className="h-5 w-5 icon-default"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border animate-fade-in">
            <div className="py-4 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.href}
                  className={({ isActive }) =>
                    `block w-full text-left nav-button ${isActive ? "nav-button-active" : ""}`
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  signOut();
                  setIsMenuOpen(false);
                }}
                className="w-full justify-start text-text-secondary hover:text-icon-active mt-3"
              >
                <LogOut className="h-4 w-4 mr-2 icon-default" />
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}