/**
 * AppLayout.tsx — Main application shell with responsive sidebar navigation.
 *
 * DESKTOP (≥768px): Fixed sidebar on the left, main content offset by sidebar width.
 * MOBILE (<768px):  Sidebar hidden by default, toggled via a hamburger button.
 *                   Uses a sheet (slide-over) pattern for mobile nav.
 *
 * This layout wraps every authenticated page. The sidebar contains:
 *   - App branding (logo + name)
 *   - Navigation links (Dashboard, Plans, Schedule)
 *   - User email display and logout button
 *
 * The `children` prop receives the page-specific content.
 */

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { BookOpen, LayoutDashboard, FolderOpen, Calendar, LogOut, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

// ─── Navigation Items ──────────────────────────────────────────────────────────
// Each item maps to a protected route defined in App.tsx.
// The `icon` is a Lucide React component rendered in the sidebar.

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/plans", label: "Plans", icon: FolderOpen },
  { to: "/schedule", label: "Schedule", icon: Calendar },
];

// ─── Sidebar Content (shared between desktop and mobile) ───────────────────────

/**
 * SidebarContent — Renders the nav links and user section.
 * Extracted as a separate component so it can be reused in both
 * the desktop fixed sidebar and the mobile sheet overlay.
 *
 * @param onNavigate - Optional callback fired after a link is clicked.
 *                     Used on mobile to close the sheet after navigation.
 */
const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  /** Log out the user and redirect to the login page */
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      {/* ── Branding ── */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
          <BookOpen className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <span className="font-display text-lg font-bold text-sidebar-primary-foreground">StudyPlanner</span>
      </div>

      {/* ── Navigation Links ── */}
      {/* Each link highlights when active (current path starts with link's `to`) */}
      <nav className="flex-1 space-y-1 px-3 pt-4" aria-label="Main navigation">
        {navItems.map(({ to, label, icon: Icon }) => {
          // Check if the current route matches this nav item
          const active = location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate} // Close mobile sheet on navigation
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* ── User Info & Logout ── */}
      <div className="border-t border-sidebar-border p-3">
        {/* Show the logged-in user's email, truncated if too long */}
        <div className="mb-2 px-3 text-xs text-sidebar-foreground/50 truncate">{user?.email}</div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </button>
      </div>
    </>
  );
};

// ─── Main Layout Component ─────────────────────────────────────────────────────

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* ── Desktop Sidebar (hidden on mobile) ── */}
      {/* Fixed position, always visible on screens ≥768px */}
      {!isMobile && (
        <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-sidebar text-sidebar-foreground">
          <SidebarContent />
        </aside>
      )}

      {/* ── Mobile Header Bar (hidden on desktop) ── */}
      {/* Sticky top bar with hamburger menu trigger */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-30 flex items-center gap-3 border-b border-border bg-background px-4 py-3">
          {/* Sheet component creates a slide-over sidebar on mobile */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            {/* Sidebar slides in from the left on mobile */}
            <SheetContent side="left" className="w-60 p-0 bg-sidebar text-sidebar-foreground">
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Mobile branding in the header bar */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-base font-bold text-foreground">StudyPlanner</span>
          </div>
        </div>
      )}

      {/* ── Main Content Area ── */}
      {/* On desktop: offset by sidebar width (ml-60). On mobile: full width with top padding for header. */}
      <main className={`flex-1 ${isMobile ? "pt-16 px-4 pb-6" : "ml-60 p-8"}`}>
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
