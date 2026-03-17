/**
 * AppLayout.tsx — Main application shell with responsive sidebar navigation.
 *
 * DESKTOP (≥768px): Fixed sidebar on the left, main content offset by sidebar width.
 * MOBILE (<768px):  Sidebar hidden by default, toggled via a hamburger button.
 *                   Uses a sheet (slide-over) pattern for mobile nav.
 *
 * ACCESSIBILITY (WCAG):
 *   - 2.1.1 Keyboard: All nav links and buttons are focusable and operable via keyboard.
 *     The sidebar uses semantic <nav> with aria-label for screen readers.
 *   - 1.4.3 Contrast: Active links use bg-sidebar-accent with high-contrast foreground.
 *     Inactive links use 70% opacity foreground — still meets AA ratio on dark sidebar.
 *   - 4.1.3 Status Messages: Logout action triggers a toast (handled by Sonner's aria-live).
 * 
 */

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { BookOpen, LayoutDashboard, FolderOpen, Calendar, BarChart3, LogOut, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

// ─── Navigation Items ──────────────────────────────────────────────────────────
// Each item maps to a protected route defined in App.tsx.

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/plans", label: "Plans", icon: FolderOpen },
  { to: "/schedule/week", label: "Schedule", icon: Calendar },
  { to: "/summary/week", label: "Summary", icon: BarChart3 },
];

// ─── Sidebar Content (shared between desktop and mobile) ───────────────────────

/**
 * SidebarContent — Renders the nav links and user section.
 * ACCESSIBILITY:
 *   - <nav> element with aria-label="Main navigation" for landmark identification.
 *   - Each link has clear focus-visible styles for keyboard navigation (2.1.1).
 *   - Active state uses both colour AND font weight, not colour alone (1.4.3).
 *   - Logout button has accessible text content.
 *
 * @param onNavigate - Optional callback fired after a link click.
 *                     Used on mobile to close the Sheet after navigation.
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
        <span className="font-display text-lg font-bold text-sidebar-primary-foreground">
          StudyPlanner
        </span>
      </div>

      {/* ── Navigation Links ── */}
      {/* aria-label identifies this landmark for screen reader users */}
      <nav className="flex-1 space-y-1 px-3 pt-4" aria-label="Main navigation">
        {navItems.map(({ to, label, icon: Icon }) => {
          // Determine if this nav item is the current active route
          const active = location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate} // Close mobile Sheet on click
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                }`}
              aria-current={active ? "page" : undefined}
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
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70
                    transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </button>
      </div>
    </>
  );
};

// ─── Main Layout Component ─────────────────────────────────────────────────────
/**
 * AppLayout — Responsive shell wrapping every authenticated page.
 *
 * MOBILE BEHAVIOUR:
 *   - Sticky top header with hamburger menu trigger.
 *   - Sheet slides in from the left containing SidebarContent.
 *   - Main content gets top padding (pt-16) to clear the sticky header.
 *
 * DESKTOP BEHAVIOUR:
 *   - Fixed sidebar (w-60) on the left.
 *   - Main content offset by ml-60 with generous padding.
 *
 * ACCESSIBILITY:
 *   - <main> landmark wraps page content for screen reader navigation.
 *   - Mobile hamburger button has screen-reader-only label via aria-label.
 */
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* ── Desktop Sidebar (hidden on mobile) ── */}
      {!isMobile && (
        <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-sidebar text-sidebar-foreground">
          <SidebarContent />
        </aside>
      )}

      {/* ── Mobile Header Bar (hidden on desktop) ── */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-30 flex items-center gap-3 border-b border-border bg-background px-4 py-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Open navigation menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            {/* Sidebar slides in from the left on mobile */}
            <SheetContent side="left" className="w-60 p-0 bg-sidebar text-sidebar-foreground" aria-label="Navigation sidebar">
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
      {/* <main> landmark for screen reader navigation */}
      <main className={`flex-1 ${isMobile ? "pt-16 px-4 pb-6" : "ml-60 p-8"}`}>
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
