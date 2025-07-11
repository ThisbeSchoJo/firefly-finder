/**
 * Map Component
 * A Google Maps component that displays firefly sightings and allows location selection
 * Supports markers for both iNaturalist observations and user sightings
 * Handles map clicks for setting new sighting locations
 */

import React from "react";
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";
import "../map.css";

// The "marker" library is required for marker functionality
const libraries = ["marker"];

function Map({ center, markers = [], zoom = 10, onMarkerClick, onMapClick }) {
  // Load the Google Maps API
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  if (!isLoaded) {
    return <div>Loading maps...</div>;
  }

  return (
    <div className="map-container">
      <GoogleMap
        // Set the map container style to take full width and height of the parent div
        mapContainerStyle={{ width: "100%", height: "100%" }}
        // Set the initial center and zoom level of the map
        center={center}
        zoom={zoom}
        // Disable map type and street view controls because doesn't make sense for this app
        options={{
          mapTypeControl: false,
          streetViewControl: false,
        }}
        onClick={(e) => {
          const coords = {
            lat: e.latLng.lat(),
            lng: e.latLng.lng(),
          };
          onMapClick?.(coords);
        }}
      >
        {/* Render markers for each observation */}
        {markers
          .filter(
            (marker) =>
              marker &&
              marker.position &&
              typeof marker.position.lat === "number" &&
              typeof marker.position.lng === "number"
          )
          .map((marker, index) => (
            <Marker
              key={index}
              position={marker.position}
              title={marker.title || "Unknown"}
              onClick={() => onMarkerClick?.(marker)}
            />
          ))}
      </GoogleMap>
    </div>
  );
}

export default Map;
