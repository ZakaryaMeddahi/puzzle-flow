"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetchBlob } from "../../../lib/api";
import type { Alignment } from "@kdp/shared/browser";

interface Props {
  pageType: string;
  values:   Record<string, string>;
  styles:   Record<string, { alignment: Alignment }>;
  font:     string;
  trimSize: string;
}

const ASPECT: Record<string, number> = {
  "6x9":    6 / 9,
  "8x10":   8 / 10,
  "8.5x11": 8.5 / 11,
};

export function PdfPagePreview({ pageType, values, styles, font, trimSize }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady]     = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const blob        = await apiFetchBlob("/preview/page", {
          method: "POST",
          body:   JSON.stringify({ pageType, values, styles, font, trimSize }),
        });
        if (controller.signal.aborted) return;

        const arrayBuffer = await blob.arrayBuffer();
        if (controller.signal.aborted) return;

        // Lazy-load pdfjs only in the browser
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const pdf  = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        if (controller.signal.aborted) { pdf.destroy(); return; }

        const page     = await pdf.getPage(1);
        const canvas   = canvasRef.current;
        if (!canvas) return;

        // Scale to fill the canvas container at device pixel ratio
        const dpr       = window.devicePixelRatio ?? 1;
        const container = canvas.parentElement!;
        const cssWidth  = container.clientWidth;
        const viewport  = page.getViewport({ scale: 1 });
        const scale     = (cssWidth / viewport.width) * dpr;
        const scaled    = page.getViewport({ scale });

        canvas.width             = scaled.width;
        canvas.height            = scaled.height;
        canvas.style.width       = `${cssWidth}px`;
        canvas.style.height      = `${cssWidth / (viewport.width / viewport.height)}px`;

        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport: scaled, canvas }).promise;
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
    <div
      className="relative w-full overflow-hidden rounded border border-zinc-200 bg-white shadow-sm"
      style={{ aspectRatio: String(aspect) }}
    >
      <canvas ref={canvasRef} className="block w-full" />

      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-indigo-500" />
        </div>
      )}

      {/* Placeholder before first render */}
      {!ready && !loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xs text-zinc-400">Preview loading…</p>
        </div>
      )}
    </div>
  );
}
