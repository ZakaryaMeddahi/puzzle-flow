import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 text-center">
      {/* Logo */}
      <Link href="/" className="mb-10 flex items-center gap-2.5">
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

      {/* Sudoku grid illustration */}
      <div className="mb-8 select-none">
        <div className="inline-grid grid-cols-3 gap-1 rounded-2xl border-2 border-zinc-300 bg-zinc-200 p-1.5 shadow-inner">
          {[
            ["4", "", ""],
            ["", "0", ""],
            ["", "", "4"],
          ].map((row, r) =>
            row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                className={`flex h-14 w-14 items-center justify-center rounded-lg text-2xl font-black transition-colors ${
                  cell === "0"
                    ? "bg-indigo-100 text-indigo-400"
                    : cell
                      ? "bg-white text-zinc-900"
                      : "bg-white text-zinc-200"
                }`}
              >
                {cell === "0" ? "?" : cell}
              </div>
            )),
          )}
        </div>
      </div>

      {/* Copy */}
      <p className="mb-2 text-6xl font-black tracking-tight text-zinc-900">
        404
      </p>
      <h1 className="mb-3 text-xl font-semibold text-zinc-800">
        This page is missing a clue
      </h1>
      <p className="mb-8 max-w-sm text-sm leading-relaxed text-zinc-500">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Let&apos;s get you back on track.
      </p>

      {/* CTAs */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          Go to homepage
        </Link>
        <Link
          href="/dashboard"
          className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
