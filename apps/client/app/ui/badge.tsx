const base =
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-zinc-100 text-zinc-600",
  pending: "bg-amber-100 text-amber-700",
  ready: "bg-emerald-100 text-emerald-700",
  expired: "bg-red-100 text-red-600",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending: "Processing",
  ready: "Ready",
  expired: "Expired",
};

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: "bg-sky-100 text-sky-700",
  medium: "bg-violet-100 text-violet-700",
  hard: "bg-orange-100 text-orange-700",
  expert: "bg-rose-100 text-rose-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`${base} ${STATUS_STYLES[status] ?? STATUS_STYLES["draft"]}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  return (
    <span
      className={`${base} capitalize ${DIFFICULTY_STYLES[difficulty] ?? "bg-zinc-100 text-zinc-600"}`}
    >
      {difficulty}
    </span>
  );
}
