/**
 * ObservationPopup Component
 * Displays details of a selected observation in a centered popup
 * Can show both iNaturalist observations and user-submitted sightings
 */

import React from "react";
import "../observation-popup.css";

function ObservationPopup({ observation, onClose, onDelete, onEdit }) {
  // If no observation is provided, don't render anything
  if (!observation) return null;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        {/* Close button in the top-right corner */}
        <button className="close-button" onClick={onClose}>
          ×
        </button>

        {/* Title showing either species_guess or species name */}
        <h2>
          {observation.species_guess?.trim() ||
            observation.species?.name ||
            "Unknown Firefly"}
        </h2>

        {/* Display the first photo if available */}
        {typeof observation.photos === "string" ? (
          <img
            src={
              observation.photos.startsWith("http")
                ? observation.photos
                : `http://localhost:5555${observation.photos}`
            }
            alt={observation.species?.name || "Firefly observation"}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "http://localhost:5555/static/uploads/fallback.jpg";
            }}
          />
        ) : Array.isArray(observation.photos) && observation.photos[0]?.url ? (
          <img
            src={observation.photos[0].url}
            alt={observation.species_guess || "Firefly observation"}
          />
        ) : null}


        {/* Observation details section */}
        <div className="observation-details">
          {/* Date of observation */}
          <p>
            <strong>Date:</strong> {observation.observed_on}
          </p>

          {/* Location of observation */}
          <p>
            <strong>Location:</strong> {observation.place_guess || "Unknown"}
          </p>

          {/* Optional description/notes */}
          {observation.description && (
            <p>
              <strong>Notes:</strong> {observation.description}
            </p>
          )}

          {/* Action buttons - only show for user's own sightings */}
          {observation.user_id && (
            <>
              <button onClick={() => onEdit(observation.id)}>
                Edit Sighting
              </button>
              <button onClick={() => onDelete(observation.id)}>
                Delete Sighting
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ObservationPopup;
