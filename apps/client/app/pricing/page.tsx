import Image from "next/image";
import Link from "next/link";

// ── Data ──────────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: "pay-per-book",
    name: "Pay per book",
    price: "$5.99",
    period: "per book",
    description:
      "Perfect for occasional publishers or trying before you subscribe.",
    highlight: false,
    badge: null,
    cta: "Buy a book",
    features: [
      { text: "1 book", included: true },
      { text: "All trim sizes", included: true },
      { text: "All layouts (1, 2, 4/page)", included: true },
      { text: "Custom front matter", included: true },
      { text: "Book-level uniqueness", included: true },
      { text: "Permanent download", included: true },
      { text: "Email support", included: false },
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: "$11.99",
    period: "per month",
    description: "For publishers building a growing catalog of puzzle books. Better value after just 2 books.",
    highlight: false,
    badge: null,
    cta: "Get started",
    features: [
      { text: "10 books per month", included: true },
      { text: "All trim sizes", included: true },
      { text: "All layouts (1, 2, 4/page)", included: true },
      { text: "Custom front matter", included: true },
      { text: "Book-level uniqueness", included: true },
      { text: "Permanent download", included: true },
      { text: "Email support", included: true },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$23.99",
    period: "per month",
    description:
      "For serious KDP publishers who need catalog-wide uniqueness and scale.",
    highlight: true,
    badge: "Best Value",
    cta: "Get started",
    features: [
      { text: "Unlimited books", included: true },
      { text: "All trim sizes", included: true },
      { text: "All layouts (1, 2, 4/page)", included: true },
      { text: "Custom front matter", included: true },
      { text: "Catalog-wide uniqueness", included: true },
      { text: "Permanent download", included: true },
      { text: "Priority support", included: true },
    ],
  },
];

const COMPARISON_ROWS: { label: string; values: [string, string, string] }[] = [
  { label: "Books", values: ["1 book", "10 / month", "Unlimited"] },
  { label: "Uniqueness", values: ["Book-level", "Book-level", "Catalog-wide"] },
  { label: "Download", values: ["Permanent", "Permanent", "Permanent"] },
  { label: "Trim sizes", values: ["All", "All", "All"] },
  {
    label: "Layouts",
    values: ["1, 2, 4/page", "1, 2, 4/page", "1, 2, 4/page"],
  },
  { label: "Custom front matter", values: ["✓", "✓", "✓"] },
  { label: "Email support", values: ["—", "✓", "✓"] },
  { label: "Priority support", values: ["—", "—", "✓"] },
];

const FAQS = [
  {
    q: "Can I switch plans later?",
    a: "Yes. You can upgrade or downgrade at any time from your account settings. Changes take effect at the start of your next billing cycle.",
  },
  {
    q: "What does uniqueness level mean?",
    a: "Book-level guarantees no duplicate puzzles within a single book. Catalog-wide (Pro) goes further — no puzzle in your account will ever repeat across any of your books, ever.",
  },
  {
    q: "Do my PDFs expire?",
    a: "No. Every PDF you generate is yours to keep and download at any time. There are no expiry dates.",
  },
  {
    q: "Can I use the generated PDF directly on KDP?",
    a: "Yes. Every PDF is generated to KDP's interior file specification — correct trim size, bleed, and margins. Just upload it as the interior file in KDP's book creation flow.",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function CheckIcon({ included }: { included: boolean }) {
  if (included) {
    return (
      <svg
        className="h-4 w-4 shrink-0 text-indigo-500"
        fill="none"
        viewBox="0 0 16 16"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 8l3.5 3.5L13 4"
        />
      </svg>
    );
  }
  return (
    <svg
      className="h-4 w-4 shrink-0 text-zinc-300"
      fill="none"
      viewBox="0 0 16 16"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h8" />
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/puzzle-flow-transparent.png"
              alt="PuzzleFlow"
              width={36}
              height={36}
              className="h-9 w-auto"
            />
            <span className="text-base font-bold">
              <span className="text-zinc-900">Puzzle</span>
              <span className="text-indigo-600">Flow</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/#how-it-works"
              className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
            >
              How it works
            </Link>
            <Link
              href="/#features"
              className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-semibold text-zinc-900"
            >
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              Get started →
            </Link>
          </div>
        </div>
      </header>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <section className="bg-white pb-16 pt-20 text-center">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            <span className="text-xs font-semibold text-indigo-700">
              Transparent pricing
            </span>
          </div>
          <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-zinc-900">
            Simple, honest pricing
          </h1>
          <p className="text-lg text-zinc-500">
            Start with a single book or subscribe for unlimited publishing. No
            hidden fees, no surprise charges.
          </p>
        </div>
      </section>

      {/* ── Free trial banner ───────────────────────────────────────────── */}
      <section className="bg-white pb-6 pt-0">
        <div className="mx-auto max-w-3xl px-6">
          <div className="flex items-center justify-between gap-6 rounded-2xl border border-indigo-100 bg-indigo-50 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-base">
                🎁
              </span>
              <div>
                <p className="text-sm font-semibold text-zinc-900">
                  Try PuzzleFlow free — no credit card required
                </p>
                <p className="text-xs text-zinc-500">
                  Every new account gets one free 10-puzzle sample book, instantly. Watermarked. One-time offer.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              Try free →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Pricing cards ───────────────────────────────────────────────── */}
      <section className="bg-zinc-50 px-6 pb-24 pt-2">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl bg-white p-8 ${
                  plan.highlight
                    ? "shadow-xl ring-2 ring-indigo-500"
                    : "border border-zinc-200 shadow-sm"
                }`}
              >
                {/* Popular badge */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-indigo-600 px-3.5 py-1 text-xs font-bold text-white shadow-sm">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Plan name + description */}
                <div className="mb-6">
                  <p className="mb-1 text-base font-bold text-zinc-900">
                    {plan.name}
                  </p>
                  <p className="text-sm leading-relaxed text-zinc-500">
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-end gap-1.5">
                    <span className="text-5xl font-black tracking-tight text-zinc-900">
                      {plan.price}
                    </span>
                    <span className="mb-1.5 text-sm text-zinc-400">
                      {plan.period}
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href="/dashboard"
                  className={`mb-8 block rounded-xl px-5 py-3 text-center text-sm font-semibold transition-colors ${
                    plan.highlight
                      ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
                      : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {plan.cta} →
                </Link>

                {/* Features */}
                <ul className="mt-auto space-y-3">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-center gap-2.5">
                      <CheckIcon included={f.included} />
                      <span
                        className={`text-sm ${f.included ? "text-zinc-700" : "text-zinc-400"}`}
                      >
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison table (desktop only) ─────────────────────────────── */}
      <section className="hidden bg-white py-24 md:block">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-10 text-center text-2xl font-bold text-zinc-900">
            Compare plans
          </h2>
          <div className="overflow-hidden rounded-2xl border border-zinc-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="px-6 py-4 text-left font-semibold text-zinc-500">
                    Feature
                  </th>
                  {PLANS.map((plan) => (
                    <th
                      key={plan.id}
                      className={`px-6 py-4 text-center font-bold ${plan.highlight ? "text-indigo-600" : "text-zinc-900"}`}
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.label} className="hover:bg-zinc-50/50">
                    <td className="px-6 py-4 font-medium text-zinc-700">
                      {row.label}
                    </td>
                    {row.values.map((val, i) => (
                      <td
                        key={i}
                        className={`px-6 py-4 text-center ${val === "✓" ? "text-indigo-500 font-bold" : val === "—" ? "text-zinc-300" : "text-zinc-600"}`}
                      >
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Price row */}
                <tr className="bg-zinc-50/50">
                  <td className="px-6 py-4 font-semibold text-zinc-900">
                    Price
                  </td>
                  {PLANS.map((plan) => (
                    <td
                      key={plan.id}
                      className={`px-6 py-4 text-center font-bold ${plan.highlight ? "text-indigo-600" : "text-zinc-900"}`}
                    >
                      {plan.price}
                      <span className="text-xs font-normal text-zinc-400">
                        {" "}
                        {plan.period}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="bg-zinc-50 py-24">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="mb-10 text-center text-2xl font-bold text-zinc-900">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <div
                key={faq.q}
                className="rounded-2xl border border-zinc-200 bg-white p-6"
              >
                <p className="mb-2 text-sm font-semibold text-zinc-900">
                  {faq.q}
                </p>
                <p className="text-sm leading-relaxed text-zinc-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section className="bg-indigo-600 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-white">
            Start publishing today
          </h2>
          <p className="mb-8 text-lg text-indigo-200">
            Your first book is one click away.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2.5 rounded-xl bg-white px-8 py-4 text-base font-bold text-indigo-700 shadow-lg transition-all hover:bg-indigo-50 hover:shadow-xl"
          >
            Get started
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 16 16"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8h10M9 4l4 4-4 4"
              />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="bg-zinc-950 py-12 text-zinc-500">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/puzzle-flow-transparent.png"
                alt="PuzzleFlow"
                width={28}
                height={28}
                className="h-7 w-auto opacity-80"
              />
              <span className="text-sm font-bold text-zinc-300">
                <span>Puzzle</span>
                <span className="text-indigo-400">Flow</span>
              </span>
            </Link>
            <div className="flex items-center gap-6 text-xs">
              <Link
                href="/login"
                className="transition-colors hover:text-zinc-300"
              >
                Sign in
              </Link>
              <Link
                href="/dashboard"
                className="transition-colors hover:text-zinc-300"
              >
                Dashboard
              </Link>
              <Link
                href="/pricing"
                className="transition-colors hover:text-zinc-300"
              >
                Pricing
              </Link>
            </div>
            <p className="text-xs">
              © {new Date().getFullYear()} PuzzleFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
