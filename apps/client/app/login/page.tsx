"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { API_URL } from "../lib/api";
import { Button, Input } from "../ui";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [linkError, setLinkError] = useState(false);

  useEffect(() => {
    if (searchParams.get("error") === "invalid_link") setLinkError(true);
  }, [searchParams]);

  function handleGoogle() {
    setGoogleLoading(true);
    window.location.href = `${API_URL}/auth/google`;
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || magicLoading) return;
    setMagicLoading(true);
    try {
      await fetch(`${API_URL}/auth/magic-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } finally {
      setMagicLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
      <div className="w-full max-w-[400px] rounded-2xl bg-white px-8 py-10 shadow-md shadow-zinc-200/80 ring-1 ring-zinc-100">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-5 flex flex-col items-center gap-0.5">
            <Image
              src="/puzzle-flow-logo.png"
              alt=""
              width={80}
              height={80}
              priority
              className="h-20 w-auto object-contain"
              suppressHydrationWarning
            />
            <span className="text-2xl font-bold tracking-tight">
              <span className="text-zinc-900">Puzzle</span>
              <span className="text-indigo-600">Flow</span>
            </span>
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight text-zinc-900">
            Get started
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Create puzzle books in minutes
          </p>
        </div>

        {/* Google */}
        <Button
          variant="secondary"
          className="w-full"
          loading={googleLoading}
          icon={<GoogleIcon />}
          onClick={handleGoogle}
        >
          Continue with Google
        </Button>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-200" />
          <span className="text-xs font-medium text-zinc-400">or</span>
          <div className="h-px flex-1 bg-zinc-200" />
        </div>

        {/* Invalid link error */}
        {linkError && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-center">
            <p className="text-sm font-medium text-red-700">
              This login link is invalid or has expired. Please request a new one.
            </p>
          </div>
        )}

        {/* Magic link */}
        {sent ? (
          <div className="rounded-lg bg-indigo-50 px-4 py-3.5 text-center">
            <p className="text-sm font-medium text-indigo-700">
              Check your email for a login link
            </p>
            <button
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
              className="mt-1.5 text-xs text-indigo-500 underline-offset-2 hover:underline"
            >
              Send to a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-3">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
            <Button
              type="submit"
              className="w-full"
              loading={magicLoading}
              disabled={!email.trim()}
            >
              Send magic link
            </Button>
          </form>
        )}

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-zinc-400">
          No password required
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
