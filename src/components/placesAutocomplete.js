import React, { useState } from 'react';

const Index = ({ setSelectedPlace }) =>{
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
    if (!event.target.value) {
      setSuggestions([]);
      return;
    }

    const service = new window.google.maps.places.AutocompleteService();
    service.getPlacePredictions({ input: event.target.value }, (predictions, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        setSuggestions(predictions);
      } else {
        setSuggestions([]);
      }
    });
  };

  const handleSelect = (placeId) => {
    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    service.getDetails({ placeId }, (place, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        setSelectedPlace({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() });
        setInputValue(place.formatted_address);
        setSuggestions([]);
      }
    });
  };

  return (
    <div>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder="Enter a location"
      />
      {suggestions.length > 0 && (
        <ul>
          {suggestions.map((suggestion) => (
            <li key={suggestion.place_id} onClick={() => handleSelect(suggestion.place_id)}>
              {suggestion.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
export default Index