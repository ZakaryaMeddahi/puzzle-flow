"use client";

import Image from "next/image";
import { useAuth } from "../providers/auth-provider";
import { Button } from "../ui";

export function NavHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-2">
        <div className="flex items-center gap-2.5">
          <Image
            src="/puzzle-flow-transparent.png"
            alt=""
            width={80}
            height={80}
            className="h-10 w-auto object-contain"
            priority
            suppressHydrationWarning
          />
          <span className="text-lg font-bold tracking-tight">
            <span className="text-zinc-900">Puzzle</span>
            <span className="text-indigo-600">Flow</span>
          </span>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">{user.email}</span>
            <Button variant="secondary" size="sm" onClick={logout}>
              Sign out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
