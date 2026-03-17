/**
 * LoginPage.tsx — Combined Login / Register page.
 *
 * WIREFRAME ALIGNMENT: Matches Wireframe 1 (Login/Register screen).
 * - Centered card layout with branding at the top.
 * - Toggle tabs to switch between Login and Register modes.
 * - Register mode shows an additional "Confirm Password" field.
 *
 * BACKEND INTEGRATION:
 * The form calls useAuth().login() or useAuth().register(), which currently
 * use mock logic. When the Django backend is ready, update AuthContext to
 * call authApi.login() / authApi.register() from src/services/api.ts.
 *
 * MOBILE: The card is full-width with padding on small screens,
 * constrained to max-w-md on larger screens.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

const LoginPage = () => {
  // ── Local State ──────────────────────────────────────────────────────────────
  const [isLogin, setIsLogin] = useState(true);       // Toggle between login/register mode
  const [email, setEmail] = useState("");              // Email input value
  const [password, setPassword] = useState("");        // Password input value
  const [confirmPassword, setConfirmPassword] = useState(""); // Only used in register mode
  const [error, setError] = useState("");              // Inline error message
  const { login, register } = useAuth();               // Auth actions from context
  const navigate = useNavigate();

  /**
   * handleSubmit — Validates inputs and calls the appropriate auth action.
   * On success, navigates to /dashboard.
   * On failure, displays the error message inline.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic client-side validation
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    // Register mode: ensure passwords match before calling the API
    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      // Call the appropriate auth action
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
      }
      // Redirect to dashboard on successful auth
      navigate("/dashboard");
    } catch (err) {
      // Display server error message or generic fallback
      setError(err instanceof Error ? err.message : "An error occurred.");
    }
  };

  return (
    // Full-screen centered layout, responsive padding
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">

        {/* ── Branding Header ── */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <BookOpen className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">StudyPlanner</h1>
          <p className="mt-1 text-sm text-muted-foreground">Plan your academic success</p>
        </div>

        {/* ── Auth Card ── */}
        <Card className="border-border shadow-lg">
          <CardHeader className="pb-4">
            {/* ── Login / Register Toggle Tabs ── */}
            {/* Uses a pill-style toggle that visually indicates the active mode */}
            <div className="flex rounded-lg bg-muted p-1">
              <button
                type="button"
                onClick={() => { setIsLogin(true); setError(""); }}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                  isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => { setIsLogin(false); setError(""); }}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                  !isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Register
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@university.ac.uk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
              </div>

              {/* Confirm Password — only shown in Register mode */}
              {!isLogin && (
                <div className="space-y-2 animate-fade-in">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              )}

              {/* Inline Error Message */}
              {error && (
                <p className="text-sm text-destructive animate-fade-in" role="alert">{error}</p>
              )}

              {/* Submit Button */}
              <Button type="submit" className="w-full">
                {isLogin ? "Sign In" : "Sign Up"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
