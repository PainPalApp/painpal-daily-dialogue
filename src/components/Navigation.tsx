import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogOut } from "lucide-react";

interface NavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function Navigation({ activeSection, onSectionChange }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { signOut } = useAuth();

  const navItems = [
    { id: "today", label: "Today" },
    { id: "insights", label: "Insights" },
    { id: "records", label: "Records" },
    { id: "profile", label: "Profile", isLink: true, href: "/profile" },
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
                item.isLink ? (
                  <a
                    key={item.id}
                    href={item.href}
                    className="nav-button"
                  >
                    {item.label}
                  </a>
                ) : (
                  <button
                    key={item.id}
                    onClick={() => onSectionChange(item.id)}
                    className={`nav-button ${
                      activeSection === item.id ? "nav-button-active" : ""
                    }`}
                  >
                    {item.label}
                  </button>
                )
              ))}
            </nav>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <LogOut className="h-4 w-4" />
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
                className="h-5 w-5"
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
                <button
                  key={item.id}
                  onClick={() => {
                    onSectionChange(item.id);
                    setIsMenuOpen(false);
                  }}
                  className={`block w-full text-left nav-button ${
                    activeSection === item.id ? "nav-button-active" : ""
                  }`}
                >
                  {item.label}
                </button>
              ))}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  signOut();
                  setIsMenuOpen(false);
                }}
                className="w-full justify-start text-muted-foreground hover:text-foreground mt-3"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}