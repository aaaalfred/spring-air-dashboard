"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

export interface AnalyticsHelpContent {
  title: string;
  definition: string;
  formula: string;
  dataSource: string;
  example: string;
  rationale: string;
  notes?: string;
  visual?: ReactNode;
}

export function AnalyticsHelpModal({
  open,
  content,
  onClose,
  returnFocusTo,
}: {
  open: boolean;
  content: AnalyticsHelpContent | null;
  onClose: () => void;
  returnFocusTo: HTMLElement | null;
}) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      returnFocusTo?.focus();
    };
  }, [onClose, open, returnFocusTo]);

  if (!open || !content) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
      <button
        type="button"
        aria-label="Cerrar ayuda analitica"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
        onClick={onClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="analytics-help-title"
        className="relative z-10 max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-6 border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur md:px-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Ayuda analitica</p>
            <h2 id="analytics-help-title" className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {content.title}
            </h2>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-sm font-bold text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
          >
            X
          </button>
        </div>

        <div className="grid gap-6 px-6 py-6 md:grid-cols-2 md:px-8 md:py-8">
          <article className="rounded-[1.5rem] border border-slate-100 bg-slate-50/70 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Que representa</p>
            <p className="mt-3 text-sm leading-7 text-slate-700">{content.definition}</p>
          </article>

          <article className="rounded-[1.5rem] border border-slate-100 bg-slate-50/70 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">De donde sale</p>
            <p className="mt-3 text-sm leading-7 text-slate-700">{content.dataSource}</p>
          </article>

          <article className="rounded-[1.5rem] border border-blue-100 bg-blue-50/70 p-5 md:col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-blue-500">Como se calcula</p>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-800">{content.formula}</p>
          </article>

          {content.visual ? (
            <article className="rounded-[1.5rem] border border-slate-100 bg-white p-5 md:col-span-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Soporte visual</p>
              <div className="mt-4">{content.visual}</div>
            </article>
          ) : null}

          <article className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/70 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-600">Ejemplo actual</p>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-800">{content.example}</p>
          </article>

          <article className="rounded-[1.5rem] border border-amber-100 bg-amber-50/70 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-600">Racional de negocio</p>
            <p className="mt-3 text-sm leading-7 text-slate-800">{content.rationale}</p>
          </article>

          {content.notes ? (
            <article className="rounded-[1.5rem] border border-slate-100 bg-white p-5 md:col-span-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Notas</p>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">{content.notes}</p>
            </article>
          ) : null}
        </div>
      </section>
    </div>
  );
}
