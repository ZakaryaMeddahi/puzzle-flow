import { forwardRef } from "react";

const inputBase =
  "w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 " +
  "placeholder-zinc-400 outline-none transition " +
  "focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const textareaBase =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm leading-relaxed text-zinc-900 " +
  "placeholder-zinc-400 outline-none transition resize-none " +
  "focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className = "", ...props }, ref) => (
  <input ref={ref} className={`${inputBase} ${className}`} {...props} />
));
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = "", rows = 6, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={rows}
    className={`${textareaBase} ${className}`}
    {...props}
  />
));
Textarea.displayName = "Textarea";
