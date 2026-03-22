"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../providers/auth-provider";

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");

    if (!accessToken || !refreshToken) {
      router.replace("/login");
      return;
    }

    login(accessToken, refreshToken)
      .then(() => router.replace("/dashboard"))
      .catch(() => router.replace("/login"));
  }, [searchParams, login, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900" />
        <p className="text-sm text-zinc-500">Signing you in…</p>
      </div>
    </div>
  );
}
