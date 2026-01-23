"use client";

import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";

type TypeOption = {
  value: string;
  label: string;
};

type AccommodationFilterProps = {
  minRating: number;
  selectedTypes: string[];
  availableTypes: TypeOption[];
  isLoading: boolean;
  onClear: () => void;
  onMinRatingChange: (value: number) => void;
  onToggleType: (value: string) => void;
};

export default function AccommodationFilter({
  minRating,
  selectedTypes,
  availableTypes,
  isLoading,
  onClear,
  onMinRatingChange,
  onToggleType,
}: AccommodationFilterProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          進階篩選
        </h3>
        <Button
          type="button"
          onClick={onClear}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="rounded-full border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition enabled:hover:border-slate-400 enabled:hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          清除篩選
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
          最低評分
          <select
            value={minRating}
            onChange={(event) => {
              const nextValue = Number(event.target.value);
              onMinRatingChange(nextValue);
            }}
            disabled={isLoading}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 shadow-inner focus:border-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value={0}>不限</option>
            <option value={3.5}>3.5 分以上</option>
            <option value={4}>4 分以上</option>
            <option value={4.3}>4.3 分以上</option>
            <option value={4.5}>4.5 分以上</option>
          </select>
        </label>
        <div className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
          住宿類型
          <div className="flex flex-wrap gap-2">
            {availableTypes.map((type) => {
              const isActive = selectedTypes.includes(type.value);
              return (
                <Toggle
                  key={type.value}
                  type="button"
                  pressed={isActive}
                  onClick={() => onToggleType(type.value)}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="rounded-full border-slate-200 px-3 text-xs font-semibold text-slate-600 data-[state=on]:border-slate-900 data-[state=on]:bg-slate-900 data-[state=on]:text-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {type.label}
                </Toggle>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
