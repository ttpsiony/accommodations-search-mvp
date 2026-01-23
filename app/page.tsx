"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import AccommodationFilter from "@/components/accommodations/accommodationsFilter";
import AccommodationsResult from "@/components/accommodations/accommodationsResult";
import {
  haversineKm,
  LODGING_TYPE_LABELS,
  LODGING_TYPE_OPTIONS,
  mapPlacesToStays,
  resolveGeoPosition,
  type Stay,
} from "@/helpers/accommodations";
import {
  fetchAccommodationsData,
  fetchFallbackLocation,
  fetchLocationSuggestions,
} from "@/helpers/accommodations/api";
import TextSearchSection from "@/components/accommodations/TextSearchSection";
import MapSearchSection from "@/components/accommodations/MapSearchSection";

export default function Home() {
  const [locationQuery, setLocationQuery] = useState("");
  const [searchCriteria, setSearchCriteria] = useState<{
    center: { lat: number; lng: number } | null;
    radiusKm: number;
    minRating: number;
    selectedTypes: string[];
  }>({
    center: null,
    radiusKm: 3,
    minRating: 0,
    selectedTypes: [],
  });
  const [hasSelectedLocation, setHasSelectedLocation] = useState(false);
  const [stays, setStays] = useState<Stay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const fetchControllerRef = useRef<AbortController | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "granted" | "denied">("idle");
  const [geoDefault, setGeoDefault] = useState<{ lat: number; lng: number } | null>(null);
  const skipNextFetchRef = useRef(false);

  useEffect(() => {
    const loadFallbackLocation = async () => {
      try {
        const data = await fetchFallbackLocation();
        if (!data.location) {
          throw new Error("Fallback location missing");
        }
        const nextCenter = {
          lat: Number(data.location.lat.toFixed(4)),
          lng: Number(data.location.lng.toFixed(4)),
        };
        setGeoDefault(nextCenter);
        setSearchCriteria((prev) => ({ ...prev, center: nextCenter }));
        setGeoStatus("granted");
      } catch {
        setGeoStatus("denied");
      }
    };

    resolveGeoPosition({
      onLoading: () => setGeoStatus("loading"),
      onGranted: (nextCenter) => {
        setGeoDefault(nextCenter);
        setSearchCriteria((prev) => ({ ...prev, center: nextCenter }));
        setGeoStatus("granted");
      },
      onDenied: () => setGeoStatus("denied"),
      onFallback: loadFallbackLocation,
    });
  }, []);

  const nearbyStays = useMemo(() => {
    if (!searchCriteria.center) {
      return [];
    }
    const center = searchCriteria.center
    return stays
      .map((stay) => ({
        ...stay,
        distanceKm: haversineKm(center, { lat: stay.lat, lng: stay.lng }),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [searchCriteria.center, stays]);

  const loadLocationSuggestions = useCallback(
    (query: string) =>
      fetchLocationSuggestions(query, navigator.language || "en"),
    []
  );

  const fetchAccommodations = useCallback(async (
    nextCenter: { lat: number; lng: number } | null,
    nextRadiusKm: number,
    options?: { query?: string; updateCenter?: boolean }
  ) => {
    if (!nextCenter && !options?.query?.trim()) {
      return;
    }
    fetchControllerRef.current?.abort();
    const controller = new AbortController();
    fetchControllerRef.current = controller;

    try {
      setIsLoading(true);
      setFetchError(null);
      const data = await fetchAccommodationsData(
        {
          latitude: nextCenter?.lat,
          longitude: nextCenter?.lng,
          radiusMeters: nextRadiusKm * 1000,
          query: options?.query?.trim() || undefined,
          maxResults: 20,
          minRating: searchCriteria.minRating > 0 ? searchCriteria.minRating : undefined,
          includedTypes:
            searchCriteria.selectedTypes.length > 0
              ? searchCriteria.selectedTypes
              : undefined,
        },
        navigator.language || "en",
        controller.signal
      );
      if (options?.updateCenter && data.center) {
        const nextCenter = {
          lat: Number(data.center.lat.toFixed(4)),
          lng: Number(data.center.lng.toFixed(4)),
        };
        skipNextFetchRef.current = true;
        setSearchCriteria((prev) => ({ ...prev, center: nextCenter }));
        setHasSelectedLocation(true);
      }
      setStays(mapPlacesToStays(data.places, LODGING_TYPE_LABELS));
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return;
      }
      setFetchError("無法取得住宿資訊，請稍後再試。");
      setStays([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchCriteria.minRating, searchCriteria.selectedTypes]);

  const handlePositionChange = (nextCenter: { lat: number; lng: number }) => {
    setSearchCriteria((prev) => ({ ...prev, center: nextCenter }));
    setHasSelectedLocation(true);
  };

  const handleSearchEnter = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    const trimmedQuery = locationQuery.trim();
    if (!trimmedQuery) {
      return;
    }
    fetchAccommodations(null, searchCriteria.radiusKm, {
      query: trimmedQuery,
      updateCenter: true,
    });
  };

  const handleClearFilters = () => {
    setSearchCriteria((prev) => ({
      ...prev,
      minRating: 0,
      selectedTypes: [],
    }));
  };

  const handleMinRatingChange = (nextValue: number) => {
    setSearchCriteria((prev) => ({ ...prev, minRating: nextValue }));
  };

  const handleToggleType = (typeValue: string) => {
    setSearchCriteria((prev) => {
      const next = prev.selectedTypes.includes(typeValue)
        ? prev.selectedTypes.filter((item) => item !== typeValue)
        : [...prev.selectedTypes, typeValue];
      return { ...prev, selectedTypes: next };
    });
  };

  useEffect(() => {
    if (!searchCriteria.center || !hasSelectedLocation) {
      return;
    }
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }
    fetchAccommodations(searchCriteria.center, searchCriteria.radiusKm);
  }, [
    fetchAccommodations,
    searchCriteria.center,
    searchCriteria.radiusKm,
    hasSelectedLocation,
  ]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff0d5,#f6efe3_40%,#f3f7f6_70%,#e7edf0)] px-6 py-10 text-slate-900">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-6">
          <div className="inline-flex w-fit items-center gap-3 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 shadow-sm">
            City Stay Radar
          </div>
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="flex-1 space-y-4">
              <h1 className="text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
                附近的旅遊住宿
              </h1>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <p className="max-w-xl text-base leading-7 text-slate-600">
                  輸入地點或直接在地圖上點選座標，立即篩選附近住宿。
                </p>
                <div className="flex flex-col items-start gap-2 text-sm font-semibold text-slate-600 md:items-end">
                  <div className="flex flex-wrap items-center justify-end gap-3 text-sm text-slate-500">
                    <span>位置</span>
                    <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                      {searchCriteria.center
                        ? `${searchCriteria.center.lat.toFixed(3)}, ${searchCriteria.center.lng.toFixed(3)}`
                        : "尚未取得"}
                    </span>
                    <Button
                      type="button"
                      onClick={() => {
                        if (geoDefault) {
                          handlePositionChange(geoDefault);
                        }
                      }}
                      disabled={geoStatus !== "granted" || !geoDefault}
                      variant="outline"
                      size="sm"
                      className="rounded-full border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition enabled:hover:border-slate-400 enabled:hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      回到我的位置
                    </Button>
                  </div>
                  {geoStatus === "loading" && (
                    <span className="text-xs text-slate-400">
                      正在取得定位授權...
                    </span>
                  )}
                  {geoStatus === "denied" && (
                    <span className="text-xs text-amber-600">
                      請在瀏覽器設定中允許位置權限，以顯示你的所在地。
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-10">
          <section className="space-y-6">
            <TextSearchSection
              locationQuery={locationQuery}
              onLocationQueryChange={setLocationQuery}
              onSearchEnter={handleSearchEnter}
              loadLocationSuggestions={loadLocationSuggestions}
              onSuggestionSelect={(option) => {
                setLocationQuery(option.label);
                if (option.lat !== undefined && option.lng !== undefined) {
                  const nextCenter = { lat: option.lat, lng: option.lng };
                  skipNextFetchRef.current = true;
                  setSearchCriteria((prev) => ({ ...prev, center: nextCenter }));
                  setHasSelectedLocation(true);
                  fetchAccommodations(nextCenter, searchCriteria.radiusKm);
                  return;
                }
                fetchAccommodations(null, searchCriteria.radiusKm, {
                  query: option.label,
                  updateCenter: true,
                });
              }}
              radiusKm={searchCriteria.radiusKm}
              onRadiusChange={(radius) =>
                setSearchCriteria((prev) => ({ ...prev, radiusKm: radius }))
              }
            />
            <MapSearchSection
              center={searchCriteria.center}
              radiusKm={searchCriteria.radiusKm}
              hasSelectedLocation={hasSelectedLocation}
              geoStatus={geoStatus}
              onPositionChange={handlePositionChange}
            />
          </section>

          {hasSelectedLocation ? (
            <section className="space-y-6">
              <AccommodationFilter
                minRating={searchCriteria.minRating}
                selectedTypes={searchCriteria.selectedTypes}
                availableTypes={LODGING_TYPE_OPTIONS}
                isLoading={isLoading}
                onClear={handleClearFilters}
                onMinRatingChange={handleMinRatingChange}
                onToggleType={handleToggleType}
              />
              <AccommodationsResult
                hasSelectedLocation={hasSelectedLocation}
                isLoading={isLoading}
                fetchError={fetchError}
                nearbyStays={nearbyStays}
                radiusKm={searchCriteria.radiusKm}
              />
            </section>
          ) : (
            <section>
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm text-slate-500">
                點擊地圖選擇搜尋中心後，才會顯示住宿清單。
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
