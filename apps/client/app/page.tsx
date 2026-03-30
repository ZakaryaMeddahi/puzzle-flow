import Image from "next/image";
import Link from "next/link";

// ── Feature cards ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    title: "Global Uniqueness Engine",
    desc: "Every puzzle is cryptographically hashed. No duplicate within your book, across your catalog, or across the entire platform — ever.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 01.83 12.62a12 12 0 005.57 9.38A11.955 11.955 0 0112 23.25a11.955 11.955 0 015.6-1.25 12 12 0 005.57-9.38 11.955 11.955 0 01-2.768-6.62A11.959 11.959 0 0115 2.714" />
      </svg>
    ),
  },
  {
    title: "KDP-Ready PDF Output",
    desc: "Correct trim sizes (6×9, 8×10, 8.5×11), proper bleed, and KDP-compliant margins. Upload straight to KDP without any adjustments.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    title: "Custom Front Matter",
    desc: "Add a branded title page, copyright page, and How-to-Play page. Edit every field live with an exact PDF preview before you commit.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    ),
  },
  {
    title: "Multiple Layouts",
    desc: "Choose 1, 2, or 4 puzzles per page. Mix progressive difficulty (Easy → Expert) or pick a single level. Full control over the reading experience.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    title: "Live PDF Preview",
    desc: "See the exact PDF output as you type — fonts, alignment, logo placement. What you see is exactly what KDP will print.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: "Instant Download",
    desc: "Puzzles are pre-generated in the background. Your PDF is ready in seconds — not minutes. Publish more books, faster.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
  },
];

const STEPS = [
  {
    number: "01",
    title: "Configure your book",
    desc: "Set the title, trim size, difficulty, number of puzzles, layout, and duplicate-protection level. Takes under two minutes.",
    img: "/setup-step-page.png",
    alt: "Book setup configuration screen",
  },
  {
    number: "02",
    title: "Customize front matter",
    desc: "Design your title page, add copyright text, and preview every page exactly as it will appear in the final PDF — live, in real time.",
    img: "/title-step-page.png",
    alt: "Title page editor with live PDF preview",
  },
  {
    number: "03",
    title: "Download & publish",
    desc: "Your print-ready PDF downloads instantly. Open KDP, upload the interior file, set your price, and you're live.",
    img: "/puzzle-page.jpg",
    alt: "Sample puzzle page output",
  },
];

const SAMPLE_PAGES = [
  { img: "/title-page.jpg",     label: "Title Page",    desc: "Branded with your logo and subtitle" },
  { img: "/puzzle-page.jpg",    label: "Puzzle Pages",  desc: "Clean grids, 1–4 per page" },
  { img: "/answer-page.jpg",    label: "Answer Key",    desc: "Auto-generated, compact layout" },
  { img: "/how-to-play-page.jpg", label: "How to Play", desc: "Clear instructions for readers" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased">

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/puzzle-flow-logo.png" alt="PuzzleFlow" width={36} height={36} className="h-9 w-auto" />
            <span className="text-base font-bold">
              <span className="text-zinc-900">Puzzle</span><span className="text-indigo-600">Flow</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#how-it-works" className="text-sm text-zinc-500 transition-colors hover:text-zinc-900">How it works</a>
            <a href="#features" className="text-sm text-zinc-500 transition-colors hover:text-zinc-900">Features</a>
            <a href="#sample" className="text-sm text-zinc-500 transition-colors hover:text-zinc-900">Sample output</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900">
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

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="overflow-hidden bg-white pb-20 pt-16 lg:pb-28 lg:pt-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">

            {/* Left: copy */}
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3.5 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                <span className="text-xs font-semibold text-indigo-700">Built for KDP Publishers</span>
              </div>
              <h1 className="mb-5 text-5xl font-extrabold leading-[1.1] tracking-tight text-zinc-900 lg:text-6xl">
                Sudoku Books,<br />
                <span className="text-indigo-600">Published in Minutes</span>
              </h1>
              <p className="mb-8 text-lg leading-relaxed text-zinc-500">
                Generate unique, print-ready Sudoku puzzle books with custom front matter,
                multiple layouts, and a global no-duplicate guarantee. Upload straight to KDP and start selling.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200"
                >
                  Create your first book
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                </Link>
                <a
                  href="#sample"
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-6 py-3.5 text-base font-medium text-zinc-700 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50"
                >
                  View sample PDF
                </a>
              </div>
            </div>

            {/* Right: stacked PDF pages */}
            <div className="relative mx-auto h-[460px] w-full max-w-[380px]">
              {/* Back page — slowest float, widest offset */}
              <div className="hero-page-back absolute inset-0">
                <div className="absolute inset-0 overflow-hidden rounded-xl shadow-lg"
                  style={{ transform: "rotate(5deg) translateX(24px) translateY(8px)" }}>
                  <Image src="/answer-page.jpg" alt="Answer key page" fill className="object-cover object-top" />
                </div>
              </div>
              {/* Middle page — medium float */}
              <div className="hero-page-mid absolute inset-0">
                <div className="absolute inset-0 overflow-hidden rounded-xl shadow-xl"
                  style={{ transform: "rotate(2deg) translateX(10px) translateY(2px)" }}>
                  <Image src="/title-page.jpg" alt="Title page" fill className="object-cover object-top" />
                </div>
              </div>
              {/* Front page — fastest float */}
              <div className="hero-page-front absolute inset-0">
                <div className="absolute inset-0 overflow-hidden rounded-xl shadow-2xl">
                  <Image src="/puzzle-page.jpg" alt="Puzzle page" fill className="object-cover object-top" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust strip ───────────────────────────────────────────────────── */}
      <div className="border-y border-zinc-100 bg-zinc-50">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {[
              "KDP-compliant margins & trim sizes",
              "Global no-duplicate guarantee",
              "Instant PDF download",
              "Live page preview",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0 text-indigo-500" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l3.5 3.5L13 4" />
                </svg>
                <span className="text-sm font-medium text-zinc-600">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600">How it works</p>
            <h2 className="text-4xl font-bold tracking-tight text-zinc-900">
              From zero to published in three steps
            </h2>
          </div>

          <div className="space-y-20">
            {STEPS.map((step, i) => (
              <div
                key={step.number}
                className={`grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16 ${i % 2 === 1 ? "lg:flex-row-reverse" : ""}`}
              >
                {/* Text side */}
                <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                  <p className="mb-3 text-5xl font-black text-zinc-100">{step.number}</p>
                  <h3 className="mb-3 text-2xl font-bold text-zinc-900">{step.title}</h3>
                  <p className="text-base leading-relaxed text-zinc-500">{step.desc}</p>
                </div>
                {/* Screenshot side */}
                <div className={`overflow-hidden rounded-2xl border border-zinc-200 shadow-xl ${i % 2 === 1 ? "lg:order-1" : ""}`}>
                  <Image
                    src={step.img}
                    alt={step.alt}
                    width={800}
                    height={520}
                    className="w-full object-cover object-top"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sample output ─────────────────────────────────────────────────── */}
      <section id="sample" className="bg-zinc-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600">Real output</p>
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-zinc-900">
              This is exactly what you&apos;ll publish
            </h2>
            <p className="mx-auto max-w-xl text-base text-zinc-500">
              Every page is generated fresh and rendered as a true PDF — not a template screenshot.
              What you see here is what KDP will print.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {SAMPLE_PAGES.map((page) => (
              <div key={page.label} className="group flex flex-col">
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow group-hover:shadow-lg">
                  <Image
                    src={page.img}
                    alt={page.label}
                    width={400}
                    height={520}
                    className="w-full object-cover object-top"
                  />
                </div>
                <div className="mt-3 px-1">
                  <p className="text-sm font-semibold text-zinc-900">{page.label}</p>
                  <p className="text-xs text-zinc-500">{page.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section id="features" className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600">Features</p>
            <h2 className="text-4xl font-bold tracking-tight text-zinc-900">
              Everything a KDP publisher needs
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-6 transition-shadow hover:shadow-md">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  {f.icon}
                </div>
                <h3 className="mb-2 text-base font-semibold text-zinc-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Uniqueness engine ─────────────────────────────────────────────── */}
      <section className="bg-zinc-950 py-24 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-400">Uniqueness engine</p>
            <h2 className="mb-4 text-4xl font-bold tracking-tight">
              No puzzle will ever repeat — guaranteed
            </h2>
            <p className="mx-auto max-w-xl text-base text-zinc-400">
              PuzzleFlow cryptographically hashes every generated puzzle and checks it against
              three layers of protection before it enters your book.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              {
                tier: "Book",
                color: "bg-indigo-500",
                ring: "ring-indigo-500/30",
                title: "No duplicates within your book",
                desc: "Every puzzle in a single book is unique. Readers never see the same puzzle twice.",
              },
              {
                tier: "User",
                color: "bg-indigo-400",
                ring: "ring-indigo-400/30",
                title: "No duplicates across your catalog",
                desc: "Publish 10 books? Every puzzle is still unique across your entire catalog. Guaranteed.",
              },
              {
                tier: "Global",
                color: "bg-indigo-300",
                ring: "ring-indigo-300/30",
                title: "No duplicates across the platform",
                desc: "Our global registry ensures no two publishers ever receive the same puzzle.",
              },
            ].map((item) => (
              <div key={item.tier} className={`rounded-2xl bg-white/5 p-6 ring-1 ${item.ring}`}>
                <div className={`mb-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-bold text-white ${item.color}`}>
                  {item.tier} level
                </div>
                <h3 className="mb-2 text-base font-semibold text-white">{item.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="bg-indigo-600 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-white">
            Ready to publish your first book?
          </h2>
          <p className="mb-8 text-lg text-indigo-200">
            Join KDP publishers who generate unique, professional Sudoku books in minutes.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2.5 rounded-xl bg-white px-8 py-4 text-base font-bold text-indigo-700 shadow-lg transition-all hover:bg-indigo-50 hover:shadow-xl"
          >
            Get started — it&apos;s free
            <svg className="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="bg-zinc-950 py-12 text-zinc-500">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/puzzle-flow-logo.png" alt="PuzzleFlow" width={28} height={28} className="h-7 w-auto opacity-80" />
              <span className="text-sm font-bold text-zinc-300">
                <span>Puzzle</span><span className="text-indigo-400">Flow</span>
              </span>
            </Link>
            <div className="flex items-center gap-6 text-xs">
              <Link href="/login" className="transition-colors hover:text-zinc-300">Sign in</Link>
              <Link href="/dashboard" className="transition-colors hover:text-zinc-300">Dashboard</Link>
              <a href="#features" className="transition-colors hover:text-zinc-300">Features</a>
            </div>
            <p className="text-xs">© {new Date().getFullYear()} PuzzleFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
