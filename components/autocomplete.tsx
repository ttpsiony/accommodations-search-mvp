"use client";

import { useEffect, useMemo, useRef, useState, type InputHTMLAttributes } from "react";

export type AutocompleteOption = {
  id: string;
  label: string;
  lat?: number;
  lng?: number;
};

type AutocompleteProps = {
  value: string;
  onChange: (nextValue: string) => void;
  onSelect?: (option: AutocompleteOption) => void;
  loadData?: (query: string) => Promise<AutocompleteOption[]>;
  staticData?: AutocompleteOption[];
  placeholder?: string;
  debounceMs?: number;
  minQueryLength?: number;
  className?: string;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
};

const DEFAULT_DEBOUNCE_MS = 500;
const DEFAULT_MIN_QUERY_LENGTH = 2;

export default function Autocomplete({
  value,
  onChange,
  onSelect,
  loadData,
  staticData = [],
  placeholder,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  minQueryLength = DEFAULT_MIN_QUERY_LENGTH,
  className,
  inputProps,
}: AutocompleteProps) {
  const [options, setOptions] = useState<AutocompleteOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const cacheRef = useRef(new Map<string, AutocompleteOption[]>());
  const lastQueryRef = useRef("");
  const debounceRef = useRef<number | null>(null);

  const trimmedValue = value.trim();
  const hasQuery = trimmedValue.length >= minQueryLength;

  const derivedStaticOptions = useMemo(() => {
    const queryLower = trimmedValue.toLowerCase();
    if (!queryLower) {
      return staticData;
    }
    return staticData.filter((option) =>
      option.label.toLowerCase().includes(queryLower)
    );
  }, [staticData, trimmedValue]);

  useEffect(() => {
    if (!loadData) {
      return;
    }
    if (!hasQuery) {
      setOptions([]);
      setIsLoading(false);
      return;
    }

    const cacheKey = trimmedValue.toLowerCase();
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setOptions(cached);
      setIsLoading(false);
      return;
    }

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    setIsLoading(true);

    debounceRef.current = window.setTimeout(async () => {
      if (lastQueryRef.current === cacheKey) {
        return;
      }
      lastQueryRef.current = cacheKey;

      try {
        const nextOptions = await loadData(trimmedValue);
        cacheRef.current.set(cacheKey, nextOptions);
        setOptions(nextOptions);
      } catch {
        setOptions([]);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [debounceMs, hasQuery, loadData, trimmedValue]);

  const { onFocus, onBlur, className: inputClassNameOverride, ...restInputProps } =
    inputProps ?? {};
  const inputClassName = `h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base font-medium text-slate-900 shadow-inner focus:border-slate-400 focus:outline-none ${inputClassNameOverride ?? ""}`.trim();
  const displayedOptions = loadData
    ? options
    : hasQuery
      ? derivedStaticOptions
      : [];

  return (
    <div className={`relative ${className ?? ""}`}>
      <input
        {...restInputProps}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        onFocus={(event) => {
          setIsOpen(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsOpen(false);
          onBlur?.(event);
        }}
        className={inputClassName}
      />
      {isOpen && hasQuery && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 p-2 text-sm shadow-lg">
          {isLoading ? (
            <div className="rounded-xl px-3 py-2 text-slate-500">
              讀取中...
            </div>
          ) : displayedOptions.length === 0 ? (
            <div className="rounded-xl px-3 py-2 text-slate-500">
              沒有符合的結果
            </div>
          ) : (
            displayedOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option.label);
                  onSelect?.(option);
                  setIsOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-slate-700 transition hover:bg-slate-100"
              >
                <span className="font-medium">{option.label}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
