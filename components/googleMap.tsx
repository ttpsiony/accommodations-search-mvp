"use client";

import { useEffect, useRef, useState } from "react";
import type { MapCameraChangedEvent, MapMouseEvent } from "@vis.gl/react-google-maps";
import { APIProvider, Map, Marker, useMap } from "@vis.gl/react-google-maps";

type GoogleMapProps = {
  center: google.maps.LatLngLiteral;
  zoom?: number;
  radiusMeters?: number;
  onPositionChange?: (position: google.maps.LatLngLiteral) => void;
  hasSelection?: boolean;
  className?: string;
  apiKey?: string;
  mapId?: string;
};

const toLatLngLiteral = (
  latLng:
    | google.maps.LatLng
    | google.maps.LatLngLiteral
    | null
    | undefined
): google.maps.LatLngLiteral | null => {
  if (!latLng) {
    return null;
  }
  if (typeof latLng.lat === "function" && typeof latLng.lng === "function") {
    return { lat: latLng.lat(), lng: latLng.lng() };
  }
    if (typeof latLng.lat === "number" && typeof latLng.lng === "number") {
    return { lat: latLng.lat, lng: latLng.lng };
  }
  return null;
};

export default function GoogleMap({
  center,
  zoom = 13,
  radiusMeters = 3000,
  onPositionChange,
  hasSelection = false,
  className = "h-full w-full rounded-3xl",
  apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,
}: GoogleMapProps) {
  const [markerPosition, setMarkerPosition] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [mapCenter, setMapCenter] = useState(center);
  const [mapZoom, setMapZoom] = useState(zoom);
  const lastClickCenterRef = useRef<google.maps.LatLngLiteral | null>(null);

  useEffect(() => {
    setMapCenter(center);
    if (hasSelection) {
      setMarkerPosition(center);
    }
    const lastClick = lastClickCenterRef.current;
    const isFromClick =
      lastClick &&
      lastClick.lat === center.lat &&
      lastClick.lng === center.lng;
    if (!isFromClick) {
      setMapZoom(zoom);
    }
  }, [center, hasSelection, zoom]);

  useEffect(() => {
    setMapZoom(zoom);
  }, [zoom]);

  if (!apiKey) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <span className="text-sm text-slate-500">
          Missing Google Maps API key.
        </span>
      </div>
    );
  }

  const handleMapClick = (event: MapMouseEvent) => {
    const next = toLatLngLiteral(event.detail?.latLng);
    if (next) {
      lastClickCenterRef.current = next;
      setMarkerPosition(next);
      onPositionChange?.(next);
    }
    if (mapZoom > zoom) {
      setMapZoom(zoom);
    }
  };

  const handleCameraChanged = (event: MapCameraChangedEvent) => {
    setMapCenter(event.detail.center);
    setMapZoom(event.detail.zoom);
  };

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        className={className}
        center={mapCenter}
        zoom={mapZoom}
        mapId={mapId}
        disableDefaultUI={false}
        scrollwheel
        zoomControl
        mapTypeControl={false}
        fullscreenControl={false}
        gestureHandling="greedy"
        onClick={handleMapClick}
        onCameraChanged={handleCameraChanged}
      >
        {markerPosition ? (
          <>
            <Marker position={markerPosition} />
            <SearchRadiusCircle
              center={markerPosition}
              radiusMeters={radiusMeters}
            />
          </>
        ) : null}
      </Map>
    </APIProvider>
  );
}

type SearchRadiusCircleProps = {
  center: google.maps.LatLngLiteral;
  radiusMeters: number;
};

function SearchRadiusCircle({ center, radiusMeters }: SearchRadiusCircleProps) {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map) {
      return;
    }

    if (!circleRef.current) {
      circleRef.current = new google.maps.Circle({
        map,
        strokeColor: "#1f2933",
        strokeOpacity: 0.4,
        strokeWeight: 2,
        fillColor: "#f59e0b",
        fillOpacity: 0.12,
      });
    }

    circleRef.current.setOptions({ center, radius: radiusMeters });

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
    };
  }, [map, center, radiusMeters]);

  return null;
}
