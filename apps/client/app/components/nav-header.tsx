"use client";

import { useAuth } from "../providers/auth-provider";

export function NavHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <span className="text-lg font-semibold tracking-tight text-zinc-900">
          KDP Puzzle Platform
        </span>

        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">{user.email}</span>
            <button
              onClick={logout}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
