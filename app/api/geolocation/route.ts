import { NextResponse } from "next/server";
import { API, ApiError } from "@/lib/api";

export async function POST() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing Google Maps API key" },
      { status: 500 }
    );
  }

  try {
    const data = await API.post(
      `https://www.googleapis.com/geolocation/v1/geolocate?key=${apiKey}`,
      {}
    );
    return NextResponse.json(data);
  } catch (error) {
    const apiError = error as ApiError;
    return NextResponse.json(
      { error: "Google Geolocation API request failed" },
      { status: apiError.status ?? 500 }
    );
  }
}
