"use client";

import { useState, useEffect, ReactNode } from "react";
import { Lock } from "lucide-react";

interface AdminAuthGateProps {
  children: ReactNode;
  /** Called when the user signs out, so the parent can reset state if needed. */
  onSignOut?: () => void;
}

export default function AdminAuthGate({ children, onSignOut }: AdminAuthGateProps) {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  // On mount, ask the server whether the session cookie is still valid.
  useEffect(() => {
    fetch("/api/admin/auth")
      .then((r) => r.ok && setAuthed(true))
      .finally(() => setChecking(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setPassword("");
        setAuthed(true);
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("Could not verify. Try again.");
    }
  };

  const handleSignOut = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setAuthed(false);
    onSignOut?.();
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500 text-sm">Loading...</p>
      </div>
    );
  }

  if (authed) {
    return (
      <>
        {/* Sign-out bar */}
        <div className="fixed top-0 right-0 z-50 p-3">
          <button
            onClick={handleSignOut}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded"
          >
            Sign out
          </button>
        </div>
        {children}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-lg p-8 space-y-6"
      >
        <div className="text-center space-y-2">
          <Lock className="w-8 h-8 mx-auto text-zinc-500" />
          <h1 className="text-xl font-light tracking-tight">Admin Access</h1>
          <p className="text-xs text-zinc-500">Enter the admin password to continue.</p>
        </div>

        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-full bg-zinc-800 border border-zinc-700 px-4 py-3 rounded text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          />
        </div>

        {error && (
          <p className="text-sm text-red-400 text-center">{error}</p>
        )}

        <button
          type="submit"
          className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-sm uppercase tracking-[0.1em] transition-colors"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
