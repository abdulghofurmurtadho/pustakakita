import React from 'react';

export type BadgeVariant = 'neutral' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'slate';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: 'bg-parchment-100 text-slate-700 border-parchment-300',
  emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  rose: 'bg-rose-50 text-rose-800 border-rose-200',
  indigo: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  slate: 'bg-slate-100 text-slate-800 border-slate-200',
};

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-tight ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
