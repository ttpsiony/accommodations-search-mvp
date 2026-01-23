import { NextResponse } from "next/server";
import { API, ApiError } from "@/lib/api";
import { getLanguageCode } from "@/lib/api/utils/getLanguageCode";

type SuggestionsRequest = {
  query?: string;
};

const apiKey =
  process.env.GOOGLE_MAPS_API_KEY ??
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const AUTOCOMPLETE_FIELD_MASK =
  "suggestions.placePrediction.placeId,suggestions.placePrediction.text";
const DETAILS_FIELD_MASK = "location";
const AUTOCOMPLETE_PRIMARY_TYPES = [
  "locality",
  "sublocality",
  "administrative_area_level_1",
  "administrative_area_level_2",
];

export async function POST(request: Request) {
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing Google Maps API key" },
      { status: 500 }
    );
  }

  let payload: SuggestionsRequest;
  try {
    payload = (await request.json()) as SuggestionsRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const query = payload.query?.trim();
  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const languageCode = getLanguageCode(request.headers.get("accept-language"));
  let data: {
    suggestions?: Array<{
      placePrediction?: {
        placeId?: string;
        text?: { text?: string };
      };
    }>;
  };

  try {
    data = await API.post(
      "https://places.googleapis.com/v1/places:autocomplete",
      {
        input: query,
        languageCode,
        includedPrimaryTypes: AUTOCOMPLETE_PRIMARY_TYPES,
      },
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": AUTOCOMPLETE_FIELD_MASK,
        },
      }
    );
  } catch (error) {
    const apiError = error as ApiError;
    const detail =
      typeof apiError.body === "string"
        ? apiError.body
        : (apiError.body as { error?: string })?.error;
    return NextResponse.json(
      { error: "Google Places autocomplete failed", detail },
      { status: apiError.status ?? 500 }
    );
  }

  const suggestions =
    data.suggestions
      ?.map((item) => {
        const prediction = item.placePrediction;
        if (!prediction?.placeId || !prediction.text?.text) {
          return null;
        }
        return { id: prediction.placeId, label: prediction.text.text };
      })
      .filter((item) => item !== null) ?? [];

  const withLocation = await Promise.all(
    suggestions.map(async (item) => {
      try {
        const details = await API.get<{
          location?: { latitude: number; longitude: number };
        }>(`https://places.googleapis.com/v1/places/${item.id}`, {
          headers: {
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": DETAILS_FIELD_MASK,
          },
        });
        if (!details.location) {
          return item;
        }
        return {
          ...item,
          lat: details.location.latitude,
          lng: details.location.longitude,
        };
      } catch {
        return item;
      }
    })
  );

  return NextResponse.json({ suggestions: withLocation });
}
