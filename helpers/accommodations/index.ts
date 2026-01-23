export type Stay = {
  id: string;
  name: string;
  typeCode: string;
  typeLabel: string;
  rating: number;
  formattedAddress?: string;
  editorialSummary?: string;
  lat: number;
  lng: number;
  tags: string[];
  allowsDogs: boolean;
  goodForChildren: boolean;
  acceptsCashOnly: boolean;
  acceptsCreditCards: boolean;
  acceptsDebitCards: boolean;
  distanceKm: number;
};

export type PlacesResponse = {
  places?: Array<{
    id?: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    location?: { lat: number; lng: number };
    rating?: number;
    types?: string[];
    allowsDogs?: boolean;
    goodForChildren?: boolean;
    paymentOptions?: {
      acceptsCashOnly?: boolean;
      acceptsCreditCards?: boolean;
      acceptsDebitCards?: boolean;
    };
    editorialSummary?: { text?: string };
  }>;
  center?: { lat: number; lng: number };
};

export type AccommodationsRequest = {
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  query?: string;
  maxResults?: number;
  minRating?: number;
  includedTypes?: string[];
};

type Place = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { lat: number; lng: number };
  rating?: number;
  types?: string[];
  allowsDogs?: boolean;
  goodForChildren?: boolean;
  paymentOptions?: {
    acceptsCashOnly?: boolean;
    acceptsCreditCards?: boolean;
    acceptsDebitCards?: boolean;
  };
  editorialSummary?: { text?: string };
};

export const LODGING_TYPE_LABELS: Record<string, string> = {
  bed_and_breakfast: "民宿",
  budget_japanese_inn: "平價日式旅館",
  guest_house: "旅宿",
  hostel: "青年旅館",
  hotel: "飯店",
  inn: "旅館",
  japanese_inn: "日式旅館",
  resort_hotel: "度假飯店",
};

export const LODGING_TYPE_OPTIONS = Object.entries(LODGING_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

const toRad = (value: number) => (value * Math.PI) / 180;

export const haversineKm = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) => {
  const earthRadiusKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
};

export const mapPlacesToStays = (
  places: Place[] | undefined,
  typeLabels: Record<string, string>
): Stay[] => {
  return (
    places
      ?.flatMap((place) => {
        if (!place.location || !place.id) {
          return [];
        }
        const name = place.displayName?.text ?? "未命名住宿";
        const matchedType =
          place.types?.find((type) => type in typeLabels) ?? "hotel";
        const typeLabel = typeLabels[matchedType] ?? "住宿";
        const tagLabels =
          place.types
            ?.filter((type) => type in typeLabels)
            .map((type) => typeLabels[type])
            .slice(0, 3) ?? [];
        return [
          {
            id: place.id,
            name,
            typeCode: matchedType,
            typeLabel,
            rating: place.rating ?? 0,
            formattedAddress: place.formattedAddress ?? undefined,
            editorialSummary: place.editorialSummary?.text ?? undefined,
            lat: place.location.lat,
            lng: place.location.lng,
            tags: tagLabels.length > 0 ? tagLabels : [typeLabel],
            allowsDogs: place.allowsDogs ?? false,
            goodForChildren: place.goodForChildren ?? false,
            acceptsCashOnly: place.paymentOptions?.acceptsCashOnly ?? false,
            acceptsCreditCards: place.paymentOptions?.acceptsCreditCards ?? false,
            acceptsDebitCards: place.paymentOptions?.acceptsDebitCards ?? false,
            distanceKm: 0,
          },
        ];
      })
      .filter((item) => item !== null) ?? []
  );
};

export type GeoCenter = { lat: number; lng: number };

type ResolveGeoPositionOptions = {
  onLoading: () => void;
  onGranted: (center: GeoCenter) => void;
  onDenied: () => void;
  onFallback: () => void | Promise<void>;
};

export const resolveGeoPosition = ({
  onLoading,
  onGranted,
  onDenied,
  onFallback,
}: ResolveGeoPositionOptions) => {
  if (!navigator.geolocation) {
    onDenied();
    return;
  }
  onLoading();
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const nextCenter = {
        lat: Number(position.coords.latitude.toFixed(4)),
        lng: Number(position.coords.longitude.toFixed(4)),
      };
      onGranted(nextCenter);
    },
    (error) => {
      if (error.code === error.PERMISSION_DENIED) {
        void onFallback();
        return;
      }
      onDenied();
    },
    { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
  );
};
