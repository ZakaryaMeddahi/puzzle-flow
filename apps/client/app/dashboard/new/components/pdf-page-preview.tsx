"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetchBlob } from "../../../lib/api";
import type { Alignment } from "@kdp/shared/browser";

interface Props {
  pageType: string;
  values: Record<string, string>;
  styles: Record<string, { alignment: Alignment }>;
  font: string;
  trimSize: string;
}

const ASPECT: Record<string, number> = {
  "6x9": 6 / 9,
  "8x10": 8 / 10,
  "8.5x11": 8.5 / 11,
};

const TRIM_LABEL: Record<string, string> = {
  "6x9": '6" × 9"',
  "8x10": '8" × 10"',
  "8.5x11": '8.5" × 11"',
};

export function PdfPagePreview({
  pageType,
  values,
  styles,
  font,
  trimSize,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const blob = await apiFetchBlob("/preview/page", {
          method: "POST",
          body: JSON.stringify({ pageType, values, styles, font, trimSize }),
        });
        if (controller.signal.aborted) return;

        const arrayBuffer = await blob.arrayBuffer();
        if (controller.signal.aborted) return;

        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        if (controller.signal.aborted) {
          pdf.destroy();
          return;
        }

        const page = await pdf.getPage(1);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = window.devicePixelRatio ?? 1;
        const container = canvas.parentElement!;
        const cssWidth = container.clientWidth;
        const viewport = page.getViewport({ scale: 1 });
        const scale = (cssWidth / viewport.width) * dpr;
        const scaled = page.getViewport({ scale });

        canvas.width = scaled.width;
        canvas.height = scaled.height;
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssWidth / (viewport.width / viewport.height)}px`;

        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport: scaled, canvas })
          .promise;
        pdf.destroy();

        if (!controller.signal.aborted) setReady(true);
      } catch {
        // Silently ignore stale/aborted requests
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [pageType, values, styles, font, trimSize]);

  const aspect = ASPECT[trimSize] ?? ASPECT["8.5x11"]!;

  return (
    <div>
      {/* Paper document */}
      <div
        className="relative w-full overflow-hidden bg-white"
        style={{
          aspectRatio: String(aspect),
          boxShadow:
            "0 4px 24px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      >
        <canvas ref={canvasRef} className="block w-full" />

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-600" />
              <p className="text-xs text-zinc-400">Rendering…</p>
            </div>
          </div>
        )}

        {/* Initial placeholder */}
        {!ready && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-50">
            <div className="flex flex-col items-center gap-1.5">
              <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-200" />
              <p className="text-xs text-zinc-400">Preview loading…</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer meta */}
      <div className="mt-3 flex items-center justify-between px-0.5">
        <span className="text-xs text-zinc-600">
          {TRIM_LABEL[trimSize] ?? trimSize}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-zinc-600">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${loading ? "animate-pulse bg-amber-400" : ready ? "bg-emerald-400" : "bg-zinc-600"}`}
          />
          {loading ? "Rendering…" : ready ? "Exact PDF output" : "Waiting…"}
        </span>
      </div>
    </div>
  );
}
