"use client";

import GoogleMap from "@/components/googleMap";

type MapSearchSectionProps = {
  center: { lat: number; lng: number } | null;
  radiusKm: number;
  hasSelectedLocation: boolean;
  geoStatus: "idle" | "loading" | "granted" | "denied";
  onPositionChange: (nextCenter: { lat: number; lng: number }) => void;
};

export default function MapSearchSection({
  center,
  radiusKm,
  hasSelectedLocation,
  geoStatus,
  onPositionChange,
}: MapSearchSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.7),rgba(15,23,42,0.06))]" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between text-sm font-semibold text-slate-600">
          <span>互動地圖（點擊設定中心）</span>
          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
            中心：
            {center
              ? `${center.lat.toFixed(3)}, ${center.lng.toFixed(3)}`
              : "尚未取得"}
          </span>
        </div>
        {center ? (
          <GoogleMap
            center={center}
            radiusMeters={radiusKm * 1000}
            onPositionChange={onPositionChange}
            hasSelection={hasSelectedLocation}
            className="h-96 w-full rounded-2xl md:h-136"
          />
        ) : (
          <div className="flex h-96 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 text-sm font-semibold text-slate-500 md:h-136">
            {geoStatus === "denied"
              ? "請允許位置權限以顯示地圖，或重新整理頁面後再試一次。"
              : "請允許位置權限以顯示地圖。"}
          </div>
        )}
      </div>
    </div>
  );
}
