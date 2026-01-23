import { NextResponse } from "next/server";
import { API, ApiError } from "@/lib/api";
import { getLanguageCode } from "@/lib/api/utils/getLanguageCode";
import type { AccommodationsRequest } from "@/helpers/accommodations";

const apiKey =
  process.env.GOOGLE_MAPS_API_KEY ??
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const DEFAULT_RADIUS_METERS = 3000;
const DEFAULT_MAX_RESULTS = 20;
const MAX_RESULTS_LIMIT = 20;

const SEARCH_NEARBY_ENDPOINT = "https://places.googleapis.com/v1/places:searchNearby";
const SEARCH_TEXT_ENDPOINT = "https://places.googleapis.com/v1/places:searchText"


const NEARBY_FIELD_MASK =
  "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.types,places.allowsDogs,places.goodForChildren,places.paymentOptions,places.editorialSummary";
const TEXT_SEARCH_FIELD_MASK = "places.location";
const LODGING_TYPES = [
  "bed_and_breakfast",
  "budget_japanese_inn",
  "guest_house",
  "hostel",
  "hotel",
  "inn",
  "japanese_inn",
  "resort_hotel",
];

const createPlacesResponse = (
  places: unknown,
  center: { lat: number; lng: number }
) => {
  return NextResponse.json({ places, center });
}

const textSearchQuery = async (
  query: string,
  languageCode: string,
) => {
  let data: {
    places?: Array<{ location?: { latitude: number; longitude: number } }>;
  };
  try {
    data = await API.post(
      SEARCH_TEXT_ENDPOINT,
      {
        textQuery: query,
        maxResultCount: 1,
        languageCode,
      },
      {
        headers: {
          "X-Goog-Api-Key": apiKey ?? "",
          "X-Goog-FieldMask": TEXT_SEARCH_FIELD_MASK,
        },
      }
    );
  } catch (error) {
    const apiError = error as ApiError;
    return { error: "Google Places text search failed", status: apiError.status ?? 500 };
  }

  const location = data.places?.[0]?.location;
  if (!location) {
    return { error: "No text search results", status: 404 };
  }

  return { location: { lng: location.longitude, lat: location.latitude }, status: 200 };
};

export async function POST(request: Request) {
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing Google Maps API key" },
      { status: 500 }
    );
  }

  let payload: AccommodationsRequest;
  try {
    payload = (await request.json()) as AccommodationsRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    latitude,
    longitude,
    radiusMeters = DEFAULT_RADIUS_METERS,
    query,
    maxResults = DEFAULT_MAX_RESULTS,
    minRating,
    includedTypes,
  } = payload;

  const headers = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": apiKey,
    "X-Goog-FieldMask": NEARBY_FIELD_MASK,
  };
  const languageCode = getLanguageCode(request.headers.get("accept-language"));
  const trimmedQuery = query?.trim();

  let center: { lat: number; lng: number };
  if (trimmedQuery) {
    const textSearchResult = await textSearchQuery(trimmedQuery, languageCode);
    if (textSearchResult.status !== 200 || !textSearchResult.location) {
      return NextResponse.json(
        { error: textSearchResult.error ?? "Text search failed" },
        { status: textSearchResult.status }
      );
    }
    center = textSearchResult.location;
  } else {
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json(
        { error: "latitude and longitude are required" },
        { status: 400 }
      );
    }
    center = { lat: latitude, lng: longitude };
  }

  const appliedTypes =
    includedTypes && includedTypes.length > 0 ? includedTypes : LODGING_TYPES;
  const cappedResults = Math.min(Math.max(maxResults, 1), MAX_RESULTS_LIMIT);

  const body = {
    rankPreference: "DISTANCE",
    maxResultCount: cappedResults,
    includedTypes: appliedTypes,
    languageCode,
    locationRestriction: {
      circle: {
        center: { latitude: center.lat, longitude: center.lng },
        radius: radiusMeters,
      },
    },
  };

  let data: { places?: unknown[] };
  try {
    data = await API.post(SEARCH_NEARBY_ENDPOINT, body, { headers });
  } catch (error) {
    const apiError = error as ApiError;
    const detail =
      typeof apiError.body === "string"
        ? apiError.body
        : (apiError.body as { error?: string })?.error;
    return NextResponse.json(
      { error: "Google Places API request failed", detail },
      { status: apiError.status ?? 500 }
    );
  }
  const places = data.places ?? [];
  const filteredPlaces =
    typeof minRating === "number"
      ? places.filter((place) => {
          const rating = (place as { rating?: number }).rating ?? 0;
          return rating >= minRating;
        })
      : places;

  return createPlacesResponse(filteredPlaces, center);
}
