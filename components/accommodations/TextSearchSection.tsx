"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import Autocomplete, { type AutocompleteOption } from "@/components/autocomplete";

type TextSearchSectionProps = {
  locationQuery: string;
  onLocationQueryChange: (nextValue: string) => void;
  onSearchEnter: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  loadLocationSuggestions: (query: string) => Promise<AutocompleteOption[]>;
  onSuggestionSelect: (option: AutocompleteOption) => void;
  radiusKm: number;
  onRadiusChange: (radius: number) => void;
};

export default function TextSearchSection({
  locationQuery,
  onLocationQueryChange,
  onSearchEnter,
  loadLocationSuggestions,
  onSuggestionSelect,
  radiusKm,
  onRadiusChange,
}: TextSearchSectionProps) {
  const isComposingRef = useRef(false);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <div className="space-y-4">
        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
          搜尋地點
          <Autocomplete
            value={locationQuery}
            onChange={onLocationQueryChange}
            placeholder="輸入地名、景點或地址，按下 Enter 搜尋"
            inputProps={{
              onCompositionStart: () => {
                isComposingRef.current = true;
              },
              onCompositionEnd: () => {
                isComposingRef.current = false;
              },
              onKeyDown: (event) => {
                const nativeEvent = event.nativeEvent as KeyboardEvent;
                if (nativeEvent.isComposing || isComposingRef.current) {
                  return;
                }
                onSearchEnter(event);
              },
            }}
            loadData={loadLocationSuggestions}
            onSelect={onSuggestionSelect}
          />
        </label>
        <div className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
          <span>搜尋半徑</span>
          <div className="flex flex-wrap gap-3">
            {["1", "3", "5", "10"].map((value) => {
              const radius = Number(value);
              const isActive = radius === radiusKm;
              return (
                <Button
                  key={value}
                  type="button"
                  onClick={() => onRadiusChange(radius)}
                  variant="outline"
                  size="sm"
                  className={`rounded-full border px-5 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white/70 text-slate-600 hover:border-slate-400 hover:text-slate-900"
                  }`}
                >
                  {value} 公里
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
