"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRequireAuth } from "../../hooks/use-require-auth";
import { useAuth } from "../../providers/auth-provider";
import { apiFetch } from "../../lib/api";
import { NavHeader } from "../../components/nav-header";

interface UsageInfo {
  plan: string;
  booksThisMonth: number;
  limit: number | null;
  currentPeriodEnd: string | null;
}

const PLAN_LABELS: Record<string, string> = {
  pay_per_book: "Pay per book",
  starter: "Starter",
  pro: "Pro",
};

const PLAN_COLORS: Record<string, string> = {
  pay_per_book: "bg-zinc-100 text-zinc-600",
  starter: "bg-emerald-100 text-emerald-700",
  pro: "bg-indigo-100 text-indigo-700",
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function SettingsPage() {
  const { loading: authLoading } = useRequireAuth();
  const { user, refreshUser } = useAuth();

  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user?.plan === "starter") {
      apiFetch<UsageInfo>("/users/me/usage")
        .then(setUsage)
        .catch(() => {});
    }
  }, [user?.plan]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-zinc-100">
        <NavHeader />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-600" />
        </div>
      </div>
    );
  }

  const plan = user.plan ?? "pay_per_book";
  const isSubscriber = plan === "starter" || plan === "pro";
  const isCanceled = user.subscriptionStatus === "canceled";
  const isPaused = user.subscriptionStatus === "paused";

  async function handleUpgrade(targetPlan: "starter" | "pro") {
    setActionLoading(true);
    setError(null);
    try {
      const { checkoutUrl } = await apiFetch<{ checkoutUrl: string }>(
        "/users/me/subscription",
        { method: "POST", body: JSON.stringify({ plan: targetPlan }) },
      );
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    setActionLoading(true);
    setError(null);
    try {
      await apiFetch("/users/me/subscription", { method: "DELETE" });
      await refreshUser();
      setConfirmCancel(false);
      setSuccessMsg(
        "Subscription canceled. You'll retain access until the end of your billing period.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBillingPortal() {
    setActionLoading(true);
    setError(null);
    try {
      const { url } = await apiFetch<{ url: string }>(
        "/users/me/billing-portal",
      );
      window.open(url, "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-100">
      <NavHeader />
      <main className="mx-auto max-w-2xl px-6 py-8">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 16 16"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 12L6 8l4-4"
            />
          </svg>
          Back to dashboard
        </Link>

        <h1 className="mb-6 text-xl font-bold text-zinc-900">
          Account settings
        </h1>

        {successMsg && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMsg}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Plan card */}
        <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">
              Current plan
            </h2>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PLAN_COLORS[plan] ?? "bg-zinc-100 text-zinc-600"}`}
            >
              {PLAN_LABELS[plan] ?? plan}
            </span>
          </div>

          {isSubscriber && (
            <div className="space-y-1 text-sm text-zinc-500">
              <div className="flex items-center justify-between">
                <span>Status</span>
                <span
                  className={`font-medium ${
                    isCanceled
                      ? "text-red-600"
                      : isPaused
                        ? "text-amber-600"
                        : "text-emerald-600"
                  }`}
                >
                  {isCanceled ? "Canceled" : isPaused ? "Paused" : "Active"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>{isCanceled ? "Access until" : "Renews on"}</span>
                <span className="font-medium text-zinc-700">
                  {formatDate(user.currentPeriodEnd)}
                </span>
              </div>
            </div>
          )}

          {/* Usage meter (Starter only) */}
          {plan === "starter" && usage && (
            <div className="mt-4 border-t border-zinc-100 pt-4">
              <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-500">
                <span>Books used this month</span>
                <span className="font-semibold text-zinc-700">
                  {usage.booksThisMonth} / {usage.limit}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    usage.booksThisMonth >= (usage.limit ?? 10)
                      ? "bg-red-500"
                      : "bg-indigo-500"
                  }`}
                  style={{
                    width: `${Math.min(100, (usage.booksThisMonth / (usage.limit ?? 10)) * 100)}%`,
                  }}
                />
              </div>
              {usage.currentPeriodEnd && (
                <p className="mt-1.5 text-xs text-zinc-400">
                  Resets on {formatDate(usage.currentPeriodEnd)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {/* Pay-per-book: show upgrade options */}
          {plan === "pay_per_book" && (
            <>
              <button
                type="button"
                onClick={() => handleUpgrade("starter")}
                disabled={actionLoading}
                className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-3.5 text-left shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-50"
              >
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    Upgrade to Starter
                  </p>
                  <p className="text-xs text-zinc-500">
                    10 books per month · $11.99/mo
                  </p>
                </div>
                <span className="text-xs font-semibold text-indigo-600">
                  Upgrade →
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleUpgrade("pro")}
                disabled={actionLoading}
                className="flex w-full items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-3.5 text-left shadow-sm transition-colors hover:bg-indigo-100 disabled:opacity-50"
              >
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    Upgrade to Pro
                  </p>
                  <p className="text-xs text-zinc-500">
                    Unlimited books · Catalog-wide uniqueness · $23.99/mo
                  </p>
                </div>
                <span className="text-xs font-semibold text-indigo-600">
                  Upgrade →
                </span>
              </button>
            </>
          )}

          {/* Starter active: upgrade to Pro */}
          {plan === "starter" && !isCanceled && (
            <button
              type="button"
              onClick={() => handleUpgrade("pro")}
              disabled={actionLoading}
              className="flex w-full items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-3.5 text-left shadow-sm transition-colors hover:bg-indigo-100 disabled:opacity-50"
            >
              <div>
                <p className="text-sm font-semibold text-zinc-900">
                  Upgrade to Pro
                </p>
                <p className="text-xs text-zinc-500">
                  Unlimited books · Catalog-wide uniqueness · $23.99/mo
                </p>
              </div>
              <span className="text-xs font-semibold text-indigo-600">
                Upgrade →
              </span>
            </button>
          )}

          {/* Canceled subscription: reactivate */}
          {isCanceled && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5">
              <p className="mb-1 text-sm font-semibold text-zinc-900">
                Subscription canceled
              </p>
              <p className="mb-3 text-xs text-zinc-500">
                Your access continues until {formatDate(user.currentPeriodEnd)}.
                Reactivate to keep publishing.
              </p>
              <button
                type="button"
                onClick={() => handleUpgrade(plan as "starter" | "pro")}
                disabled={actionLoading}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                Reactivate {PLAN_LABELS[plan]}
              </button>
            </div>
          )}

          {/* Active subscriber: manage billing + cancel */}
          {isSubscriber && !isCanceled && (
            <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={handleBillingPortal}
                  disabled={actionLoading}
                  className="text-sm font-medium text-zinc-600 underline-offset-2 hover:text-zinc-900 disabled:opacity-50"
                >
                  Manage billing & invoices ↗
                </button>
                {!confirmCancel ? (
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(true)}
                    className="text-xs text-zinc-400 hover:text-red-600"
                  >
                    Cancel subscription
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">Are you sure?</span>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={actionLoading}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      Yes, cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmCancel(false)}
                      className="text-xs text-zinc-400 hover:text-zinc-700"
                    >
                      Keep it
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Link to pricing */}
          <p className="pt-1 text-center text-xs text-zinc-400">
            Compare plans on the{" "}
            <Link href="/pricing" className="text-indigo-600 hover:underline">
              pricing page
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
