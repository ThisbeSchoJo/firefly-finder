/**
 * Sighting Component
 * This component displays a map centered on the user's location and shows nearby firefly sightings
 * from both the user's submissions and iNaturalist observations.
 */

import React, { useState, useEffect } from "react";
// Custom hook to fetch iNaturalist data
import { useFireflyInaturalistData } from "../hooks/useInaturalistData";
// Local components
import "../sighting.css";
import Map from "./Map";
import ObservationPopup from "./ObservationPopup";
import AddSightingForm from "./AddSightingForm";
import EditSightingForm from "./EditSightingForm";

function Sighting({ user }) {
  // State for managing user's location and related UI states
  const [userLocation, setUserLocation] = useState(null); // Stores the user's current coordinates
  const [locationError, setLocationError] = useState(null); // Stores any geolocation errors
  const [isLoadingLocation, setIsLoadingLocation] = useState(true); // Tracks geolocation loading state
  // Selected sighting states
  const [selectedObservation, setSelectedObservation] = useState(null); // Stores the currently selected observation for the popup
  const [selectedUserSighting, setSelectedUserSighting] = useState(null); // Stores the currently selected user sighting
  // Form states
  const [showAddSightingForm, setShowAddSightingForm] = useState(false); // Controls visibility of the add sighting form
  const [showEditSightingForm, setShowEditSightingForm] = useState(false); // Controls visibility of the edit sighting form
  // Sightings states
  const [sightings, setSightings] = useState([]); // Stores the user's sightings

  /**
   * useEffect hook to get the user's location when the component mounts
   * Uses the browser's geolocation API to request the user's current position
   */
  useEffect(() => {
    // Check if the browser supports geolocation
    if (navigator.geolocation) {
      // Get the user's current position
      navigator.geolocation.getCurrentPosition(
        // Success callback
        (position) => {
          // Extract latitude and longitude from the position object
          const { latitude, longitude } = position.coords;
          // Update the userLocation state with the current coordinates
          setUserLocation({ lat: latitude, lng: longitude });
          // Set the loading state to false because we have the user's location
          setIsLoadingLocation(false);
        }
      );
    } else {
      // Set the error message and set loading state to false because we don't have the user's location
      setLocationError("Geolocation is not supported by your browser");
      setIsLoadingLocation(false);
    }
  }, []);

  // Set the map center to the user's location or default to (0,0) if not available
  const mapCenter = userLocation || { lat: 0, lng: 0 };

  /**
   * Fetch iNaturalist data using the custom hook
   * Passes the user's location to get observations near them
   * Default radius is set to 10 kilometers
   */
  const { data } = useFireflyInaturalistData({
    lat: userLocation?.lat,
    lng: userLocation?.lng,
    radius: 80,
  });

  // Fetch user sightings
  useEffect(() => {
    fetch("http://localhost:5555/sightings", {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => setSightings(data))
      .catch((error) => {
        console.error("Error fetching user sightings:", error);
      });
  }, []);

  /**
   * Prepare markers from iNaturalist data
   * Parses the location string into latitude and longitude coordinates
   * Creates marker objects with position, title, and ID
   */
  const inaturalistMarkers =
    // Map over the observations and create markers
    // optional chaining operator - if data or results are null/undefined, return an empty array (don't throw an error)
    data?.results?.map((observation) => {
      // Only process observations with a valid location
      if (!observation.location || !observation.location.includes(",")) {
        return null;
      }
      // Extract latitude and longitude from the location string
      const [lat, lng] = observation.location
        // Split the location string into an array of coordinates and parse each coordinate as a float
        .split(",")
        .map((coord) => parseFloat(coord.trim()));
      return {
        // Create a marker object with position, title, and ID
        position: {
          lat,
          lng,
        },
        title: String(observation.species_guess) || "Unknown Firefly",
        id: observation.id,
        observation: observation, // Store the full observation data for the popup
      };
    }) || [];

  const userSightings =
    // Map over the user's sightings and create markers
    sightings?.map((sighting) => {
      // Only process sightings with a valid location
      if (
        typeof sighting.latitude !== "number" ||
        typeof sighting.longitude !== "number"
      ) {
        return null;
      }
      return {
        position: { lat: sighting.latitude, lng: sighting.longitude },
        title: sighting.species?.name || "Unknown Firefly",
        id: sighting.id,
        sighting: sighting, // Store the full sighting data for the popup
      };
    }) || [];

  const allMarkers = [...inaturalistMarkers, ...userSightings];

  // Show loading state while getting user's location
  if (isLoadingLocation) {
    return <div className="loading">Getting your location...</div>;
  }

  // Show error state if geolocation failed
  if (locationError) {
    return <div className="error">Error: {locationError}</div>;
  }

  /**
   * Function to handle clicking a marker
   * Sets the appropriate state based on whether it's an iNaturalist observation or user sighting
   */
  const handleMarkerClick = (marker) => {
    if (marker.observation) {
      setSelectedObservation(marker.observation);
    } else if (marker.sighting) {
      setSelectedUserSighting(marker.sighting);
    }
  };

  /**
   * Function to handle closing the popup
   * Resets both selected observation and user sighting states
   */
  function handleClosePopup() {
    setSelectedObservation(null);
    setSelectedUserSighting(null);
  }

  /**
   * Function to handle adding a sighting
   * Shows the add sighting form and resets other states
   */
  function handleAddSighting() {
    setShowAddSightingForm(true);
    setShowEditSightingForm(false);
    setSelectedUserSighting(null);
    setSelectedObservation(null);
  }

  /**
   * Function to handle submitting a new sighting
   * Makes a POST request to create a new sighting
   * Updates the sightings state with the new sighting
   */
  async function handleSubmitNewSighting(formData) {
    try {
      const response = await fetch("http://localhost:5555/sightings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create sighting");
      }

      const newSighting = await response.json();
      setSightings([...sightings, newSighting]);
      setShowAddSightingForm(false);
    } catch (error) {
      console.error("Error creating sighting:", error);
      alert(error.message);
    }
  }

  /**
   * Function to handle submitting an edited sighting
   * Makes a PATCH request to update the sighting
   * Updates the sightings state with the edited sighting
   */
  async function handleSubmitEditSighting(formData) {
    try {
      const response = await fetch(
        `http://localhost:5555/sightings/${formData.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            species_id: formData.species_id,
            place_guess: formData.place_guess,
            observed_on: formData.observed_on,
            description: formData.description,
            photos: formData.photos,
            latitude: formData.latitude,
            longitude: formData.longitude,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update sighting");
      }

      const updatedSighting = await response.json();
      setSightings(
        sightings.map((s) =>
          s.id === updatedSighting.id ? updatedSighting : s
        )
      );
      setShowEditSightingForm(false);
      setSelectedUserSighting(null);
    } catch (error) {
      console.error("Error updating sighting:", error);
      alert(error.message);
    }
  }

  /**
   * Function to handle editing a sighting
   * Shows the edit form and populates it with the selected sighting's data
   */
  function handleEditSighting(id) {
    const sightingToEdit = sightings.find((s) => s.id === id);
    if (!sightingToEdit) {
      console.error("Sighting not found");
      return;
    }
    // fetchUserSightings();
    setSelectedUserSighting(sightingToEdit);
    setShowAddSightingForm(false);
    setShowEditSightingForm(true);
    setSelectedObservation(null);
  }

  /**
   * Function to handle deleting a sighting
   * Makes a DELETE request to remove the sighting
   * Updates the sightings state by removing the deleted sighting
   */
  async function handleDeleteSighting(id) {
    try {
      const response = await fetch(`http://localhost:5555/sightings/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete sighting");
      }

      setSelectedUserSighting(null);
      setSightings(sightings.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Error deleting sighting:", error);
      alert(error.message);
    }
  }

  return (
    <div className="sighting-container">
      <h1>Glow Sighting</h1>

      {/* Map container with user's location and iNaturalist markers */}
      <div className="map-container">
        <Map
          center={mapCenter}
          markers={allMarkers}
          zoom={10}
          onMarkerClick={handleMarkerClick}
        />
      </div>

      {/* Action buttons */}
      <div className="action-buttons">
        <button onClick={handleAddSighting}>Add Sighting</button>
      </div>

      {/* Add Sighting Form */}
      {showAddSightingForm && (
        <AddSightingForm
          userLocation={userLocation}
          onSubmit={handleSubmitNewSighting}
          onCancel={() => setShowAddSightingForm(false)}
        />
      )}
      {/* Edit Sighting Form */}
      {showEditSightingForm && (
        <EditSightingForm
          sighting={selectedUserSighting} // Pass the sighting to edit if one is selected
          onSubmit={handleSubmitEditSighting}
          onCancel={() => setShowEditSightingForm(false)}
        />
      )}

      {/* Observation popup */}
      {(selectedObservation || selectedUserSighting) && (
        <ObservationPopup
          observation={selectedObservation || selectedUserSighting}
          onClose={handleClosePopup}
          onDelete={handleDeleteSighting}
          onEdit={handleEditSighting}
        />
      )}
    </div>
  );
}

export default Sighting;
