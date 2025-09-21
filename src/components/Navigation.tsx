'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Activity, LogIn } from "lucide-react";

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const navItems = [
    { id: "track", label: "Track", href: "/track" },
    { id: "insights", label: "Insights", href: "/insights" },
    { id: "records", label: "Records", href: "/records" },
    { id: "profile", label: "Profile", href: "/profile" },
  ];

  return (
    <header className="bg-background/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <NavLink to="/track" className="flex-shrink-0 flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Activity 
              className="h-4 w-4" 
              style={{ color: '#A78BFA' }}
              strokeWidth={2.5}
            />
            <span className="text-lg font-medium text-[hsl(var(--text-primary))] tracking-tight">
              Lila
            </span>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.href}
                  className={
                    `nav-button ${pathname.startsWith(item.href) ? "nav-button-active" : ""}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="h-8 w-8 p-0 text-text-secondary hover:text-icon-active hover:bg-accent/10"
              >
                <LogOut className="h-4 w-4 icon-default" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/auth')}
                className="h-8 px-3 text-text-secondary hover:text-icon-active hover:bg-accent/10"
              >
                <LogIn className="h-4 w-4 mr-2 icon-default" />
                Sign in
              </Button>
            )}
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
                  className={
                    `block w-full text-left nav-button ${pathname.startsWith(item.href) ? "nav-button-active" : ""}`
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
              </NavLink>
              ))}
              
              {user ? (
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
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigate('/auth');
                    setIsMenuOpen(false);
                  }}
                  className="w-full justify-start text-text-secondary hover:text-icon-active mt-3"
                >
                  <LogIn className="h-4 w-4 mr-2 icon-default" />
                  Sign in
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}