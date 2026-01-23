"use client";

import AccommodationList from "@/components/accommodations/accommodationList";
import type { Stay } from "@/helpers/accommodations";

type AccommodationsResultProps = {
  hasSelectedLocation: boolean;
  isLoading: boolean;
  fetchError: string | null;
  nearbyStays: Stay[];
  radiusKm: number;
};

export default function AccommodationsResult({
  hasSelectedLocation,
  isLoading,
  fetchError,
  nearbyStays,
  radiusKm,
}: AccommodationsResultProps) {
  if (!hasSelectedLocation) {
    return (
      <section>
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm text-slate-500">
          點擊地圖選擇搜尋中心後，才會顯示住宿清單。
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">搜尋結果</h2>
          <span className="text-sm font-semibold text-slate-500">
            {nearbyStays.length} 筆
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          半徑 {radiusKm} 公里內的住宿清單（依距離排序，最多 20 筆）。
        </p>
      </div>

      <div className="relative">
        {fetchError ? (
          <div className="rounded-3xl border border-dashed border-rose-200 bg-rose-50/60 p-6 text-center text-sm text-rose-600">
            {fetchError}
          </div>
        ) : (
          <AccommodationList stays={nearbyStays} />
        )}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-white/70 text-sm font-semibold text-slate-600">
            正在載入附近住宿...
          </div>
        )}
      </div>
    </section>
  );
}
