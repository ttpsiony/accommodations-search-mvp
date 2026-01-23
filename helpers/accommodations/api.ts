import { API } from "@/lib/api";
import { type AccommodationsRequest, type PlacesResponse } from "@/helpers/accommodations";
import { type AutocompleteOption } from "@/components/autocomplete";

export const fetchLocationSuggestions = async (
  query: string,
  language: string
): Promise<AutocompleteOption[]> => {
  const data = await API.post<{
    suggestions?: AutocompleteOption[];
  }>(
    "/api/accommodations/suggestions",
    { query },
    {
      headers: {
        "Accept-Language": language,
      },
    }
  );
  return data.suggestions ?? [];
};

export const fetchAccommodationsData = (
  payload: AccommodationsRequest,
  language: string,
  signal?: AbortSignal
) =>
  API.post<PlacesResponse>("/api/accommodations", payload, {
    headers: {
      "Accept-Language": language,
    },
    signal,
  });

export const fetchFallbackLocation = async () => {
  return API.post<{
    location?: { lat: number; lng: number };
  }>("/api/geolocation", {});
};
