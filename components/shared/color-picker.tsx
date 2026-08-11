'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/use-language';

const COLORS = [
  { name: 'slate', className: 'bg-slate-500' },
  { name: 'red', className: 'bg-red-500' },
  { name: 'orange', className: 'bg-orange-500' },
  { name: 'amber', className: 'bg-amber-500' },
  { name: 'yellow', className: 'bg-yellow-500' },
  { name: 'lime', className: 'bg-lime-500' },
  { name: 'green', className: 'bg-green-500' },
  { name: 'emerald', className: 'bg-emerald-500' },
  { name: 'teal', className: 'bg-teal-500' },
  { name: 'cyan', className: 'bg-cyan-500' },
  { name: 'sky', className: 'bg-sky-500' },
  { name: 'blue', className: 'bg-blue-500' },
  { name: 'indigo', className: 'bg-indigo-500' },
  { name: 'violet', className: 'bg-violet-500' },
  { name: 'purple', className: 'bg-purple-500' },
  { name: 'fuchsia', className: 'bg-fuchsia-500' },
  { name: 'pink', className: 'bg-pink-500' },
  { name: 'rose', className: 'bg-rose-500' },
];

interface ColorPickerProps {
  value?: string | null;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const { language } = useLanguage();
  return (
    <div className="flex flex-wrap gap-2">
      {COLORS.map((color) => {
        const isSelected = value === color.name;
        return (
          <button
            key={color.name}
            type="button"
            onClick={() => onChange(color.name)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-all hover:scale-110",
              color.className,
              isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "opacity-80 hover:opacity-100"
            )}
            title={color.name}
          >
            {isSelected && <Check className="h-4 w-4 text-white" />}
          </button>
        );
      })}
    </div>
  );
}
