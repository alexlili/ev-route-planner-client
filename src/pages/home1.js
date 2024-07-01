import React, { useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-control-geocoder/dist/Control.Geocoder.css";
import { Button, Form, Input, Menu, Row, Col, notification,Space } from "antd";
import { SearchOutlined, CloseOutlined } from "@ant-design/icons";
import PlacesAutocomplete from "react-places-autocomplete";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const appKey = "4ebfd445-0045-418f-85df-85d035140274";
const appName = "ev-route-planner";

const Planner = () => {
  const [travelData, setTravelData] = useState({
    startPoint: null,
    arrivalPoint: null,
    carAutonomy: null,
  });
  const [startPointCoordinates, setStartPointCoordinates] = useState({});
  const [arrivalPointCoordinates, setArrivalPointCoordinates] = useState({});
  const [zoom, setZoom] = useState(6);
  const [center, setCenter] = useState([-36.8485, 174.7633]);
  const [travelPath, setTravelPath] = useState(null);
  const [finalTravelPath, setFinalTravelPath] = useState(null);
  const mapRef = useRef();
  const markersLayers = L.layerGroup([]);

  const configValues = {
    radiusIncrementBy: 2,
    batteryPercentageUsage: 0.7, // 70%
    minRadius: 2, // 2 km
  };

  const main = async () => {
    const form = mapRef.current;
    form
      .validateFields()
      .then(async () => {
        L.Control.Geocoder.latLng(startPointCoordinates, startPointCoordinates);

        const newTravelPath = buildTravelPathStartToEnd();
        newTravelPath.addTo(mapRef.current);
        newTravelPath.on("routingerror", handleRoutingError);
        newTravelPath.on("routesfound", await handleRoutesFound);
      })
      .catch(() => {
        notification.warning({
          message: "Info",
          description: "Form data not valid",
        });
      });
  };

  const reset = () => {
    window.location.reload();
  };

  const setAddress = (addressPoint, latlng) => {
    setZoom(mapRef.current.getZoom());
    if (addressPoint === "departureAddress") {
      setStartPointCoordinates(latlng);
      const departureMarker = L.marker(latlng, { draggable: false }).addTo(
        mapRef.current
      );
      departureMarker
        .bindPopup("Departure: " + travelData.startPoint, {
          closeOnClick: false,
          autoClose: false,
        })
        .openPopup();
      markersLayers.addLayer(departureMarker);
    } else {
      setArrivalPointCoordinates(latlng);
      const arrivalMarker = L.marker(latlng, { draggable: false }).addTo(
        mapRef.current
      );
      arrivalMarker
        .bindPopup("Arrival: " + travelData.arrivalPoint, {
          closeOnClick: false,
          autoClose: false,
        })
        .openPopup();
      markersLayers.addLayer(arrivalMarker);
    }
  };

  const buildTravelPathStartToEnd = () => {
    return buildTravelPath(
      [
        [startPointCoordinates.lat, startPointCoordinates.lng],
        [arrivalPointCoordinates.lat, arrivalPointCoordinates.lng],
      ],
      false
    );
  };

  const buildTravelPath = (passThroughPointsArray, onlyOneAlternativeBool) => {
    let arrayArgumentPoints = passThroughPointsArray.map((point) =>
      L.latLng(point[0], point[1])
    );
    return L.Routing.control({
      waypoints: arrayArgumentPoints,
      lineOptions: {
        styles: [
          {
            color: "white",
            opacity: onlyOneAlternativeBool ? 1 : 0,
            weight: 7,
          },
          { color: "red", opacity: onlyOneAlternativeBool ? 1 : 0, weight: 4 },
        ],
      },
      routeWhileDragging: false,
      addWaypoints: false,
      show: onlyOneAlternativeBool,
      draggableWaypoints: false,
      showAlternatives: onlyOneAlternativeBool,
    });
  };

  const handleRoutingError = (e) => {
    notification.error({
      message: "Error",
      description: e.error.message,
    });
    mapRef.current.removeControl(travelPath);
  };

  const handleRoutesFound = async (e) => {
    const routes = e.routes;
    const calculationResults = await getPathChargerCoordinates(routes);
    displayResults(calculationResults, mapRef.current);
  };

  const getPathChargerCoordinates = async (routes) => {
    let itineraryFoundBool = false;
    let searchIterations = 0;
    let finalChargersData = [];
    while (searchIterations < routes.length && !itineraryFoundBool) {
      const thisRoute = routes[searchIterations];
      const thisRoutesDistance = thisRoute.summary.totalDistance;
      const thisRoutesAutonomyDistanceRatio =
        (travelData.carAutonomy * configValues.batteryPercentageUsage) /
        (thisRoutesDistance / 1000);

      if (thisRoutesAutonomyDistanceRatio >= 1) {
        itineraryFoundBool = true;
        return [itineraryFoundBool, []];
      }

      const numberOfStops = Math.ceil(1 / thisRoutesAutonomyDistanceRatio) - 1;
      const segmentDistances =
        calculateDistancesFromRouteCoordinates(thisRoute);
      const stopCircleCenterPoints = getStopCircleCenterPoints(
        thisRoute,
        segmentDistances
      );
      finalChargersData = await obtainChargersForThisRoute(
        numberOfStops,
        stopCircleCenterPoints
      );
      if (finalChargersData.length === numberOfStops) {
        itineraryFoundBool = true;
        break;
      }
      searchIterations++;
    }
    return [itineraryFoundBool, finalChargersData];
  };

  const getChargerData = async (urlForApiRequestArg) => {
    const response = await axios.get(urlForApiRequestArg);
    return response.data;
  };

  const obtainChargersForThisRoute = async (
    numberOfStopsArg,
    stopCircleCenterPointsArg
  ) => {
    const maxRadius =
      travelData.carAutonomy * ((1 - configValues.batteryPercentageUsage) / 2);
    let radius = configValues.minRadius;
    let thisPointsIndex = 0;
    let finalChargersData = [];
    while (thisPointsIndex < numberOfStopsArg && radius <= maxRadius) {
      let innerChargersData = [];
      let urlForApiRequest = buildURL(
        stopCircleCenterPointsArg[thisPointsIndex],
        radius
      );
      innerChargersData = await getChargerData(urlForApiRequest);

      if (!innerChargersData || innerChargersData.length === 0) {
        radius *= configValues.radiusIncrementBy;
        continue;
      }

      const distancesFromStopPoint = innerChargersData.map((charger) =>
        getDistanceFromLatLonInKm(
          stopCircleCenterPointsArg[thisPointsIndex][0],
          stopCircleCenterPointsArg[thisPointsIndex][1],
          charger.AddressInfo.Latitude,
          charger.AddressInfo.Longitude
        )
      );

      const minDistanceIndex = distancesFromStopPoint.indexOf(
        Math.min(...distancesFromStopPoint)
      );
      finalChargersData.push(innerChargersData[minDistanceIndex]);
      radius = configValues.minRadius;
      thisPointsIndex++;
    }
    return finalChargersData;
  };

  const getDistanceFromLatLonInKm = (latA, lngA, latB, lngB) => {
    const R = 6371;
    const dLat = (latB - latA) * (Math.PI / 180);
    const dLon = (lngB - lngA) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(latA * (Math.PI / 180)) *
        Math.cos(latB * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateDistancesFromRouteCoordinates = (thisRouteArg) => {
    return thisRouteArg.coordinates
      .slice(1)
      .map((coord, index) =>
        getDistanceFromLatLonInKm(
          thisRouteArg.coordinates[index].lat,
          thisRouteArg.coordinates[index].lng,
          coord.lat,
          coord.lng
        )
      );
  };

  const getStopCircleCenterPoints = (thisRouteArg, segmentDistancesArg) => {
    const stopCircleCenterPointsResult = [];
    let distanceDriven = 0;
    let leftOver = 0;
    let distanceDifference = 0;
    let lastPartRatio = 0;

    for (let i = 0; i < segmentDistancesArg.length; i++) {
      if (
        distanceDriven + segmentDistancesArg[i] <
        travelData.carAutonomy * configValues.batteryPercentageUsage
      ) {
        distanceDriven += segmentDistancesArg[i];
      } else {
        distanceDifference =
          travelData.carAutonomy * configValues.batteryPercentageUsage -
          distanceDriven;
        lastPartRatio = distanceDifference / segmentDistancesArg[i];
        const latOfInsidePoint =
          thisRouteArg.coordinates[i].lat +
          (thisRouteArg.coordinates[i + 1].lat -
            thisRouteArg.coordinates[i].lat) *
            lastPartRatio;
        const lngOfInsidePoint =
          thisRouteArg.coordinates[i].lng +
          (thisRouteArg.coordinates[i + 1].lng -
            thisRouteArg.coordinates[i].lng) *
            lastPartRatio;
        stopCircleCenterPointsResult.push([latOfInsidePoint, lngOfInsidePoint]);
        leftOver = segmentDistancesArg[i] - distanceDifference;
        distanceDriven = leftOver;
      }
    }
    return stopCircleCenterPointsResult;
  };

  const buildURL = (stopCircleCenterPoint, radius) => {
    return `https://api.openchargemap.io/v3/poi/?output=json&latitude=${stopCircleCenterPoint[0]}&longitude=${stopCircleCenterPoint[1]}&distance=${radius}&maxresults=10&compact=true&verbose=false&key=${appKey}`;
  };

  const displayResults = (calculationResults, map) => {
    const [itineraryFoundBool, finalChargersData] = calculationResults;
    if (itineraryFoundBool) {
      const finalTravelPath = buildTravelPathStartToEnd();
      finalTravelPath.addTo(map);
      finalTravelPath.on("routesfound", () => {
        const allMarkersArray = [];
        finalChargersData.forEach((charger) => {
          const chargerCoords = [
            charger.AddressInfo.Latitude,
            charger.AddressInfo.Longitude,
          ];
          const chargerMarker = L.marker(chargerCoords, { draggable: false });
          const popupContent = `<strong>Station: </strong> ${
            charger.AddressInfo.Title
          }<br>
            <strong>Address: </strong> ${charger.AddressInfo.AddressLine1}<br>
            <strong>Distance: </strong> ${getDistanceFromLatLonInKm(
              charger.AddressInfo.Latitude,
              charger.AddressInfo.Longitude,
              startPointCoordinates.lat,
              startPointCoordinates.lng
            ).toFixed(2)} km`;
          chargerMarker.bindPopup(popupContent, {
            closeOnClick: false,
            autoClose: false,
          });
          chargerMarker.addTo(map);
          allMarkersArray.push(chargerMarker);
        });
        const markersLayerGroup = L.layerGroup(allMarkersArray);
        markersLayerGroup.addTo(map);
        map.fitBounds(markersLayerGroup.getBounds());
        notification.success({
          message: "Success",
          description: "Charger stations added to map",
        });
      });
    } else {
      notification.error({
        message: "Error",
        description: "Could not find any suitable route with charging stations",
      });
    }
  };

  return (
    <div>
      <Row gutter={16}>
        <Col span={8}>
          <Form layout="vertical" ref={mapRef}>
            <Form.Item
              label="Starting point"
              name="startPoint"
              rules={[
                { required: true, message: "Starting point is required" },
              ]}
            >
              <PlacesAutocomplete
                value={travelData.startPoint}
                onChange={(address) =>
                  setTravelData({ ...travelData, startPoint: address })
                }
                onSelect={(address) =>
                  setTravelData({ ...travelData, startPoint: address })
                }
              >
                {({
                  getInputProps,
                  suggestions,
                  getSuggestionItemProps,
                  loading,
                }) => (
                  <div>
                    <input
                      {...getInputProps({
                        placeholder: "Search Places ...",
                        className: "location-search-input",
                      })}
                    />
                    <div className="autocomplete-dropdown-container">
                      {loading && <div>Loading...</div>}
                      {suggestions.map((suggestion,index) => {
                        console.log(suggestion)
                        const className = suggestion.active
                          ? "suggestion-item--active"
                          : "suggestion-item";
                        // inline style for demonstration purpose
                        const style = suggestion.active
                          ? { backgroundColor: "#fafafa", cursor: "pointer" }
                          : { backgroundColor: "#ffffff", cursor: "pointer" };
                        return (
                          <div key={index}
                            {...getSuggestionItemProps(suggestion, {
                              className,
                              style,
                            })}
                          >
                            <span>{suggestion.description}</span>
                          </div>
                        );
                      })}{" "}
                    </div>
                  </div>
                )}
              </PlacesAutocomplete>
            </Form.Item>
            <Form.Item
              label="Arrival point"
              name="arrivalPoint"
              rules={[{ required: true, message: "Arrival point is required" }]}
            >
              <PlacesAutocomplete
                value={travelData.arrivalPoint}
                onChange={(address) =>
                  setTravelData({ ...travelData, arrivalPoint: address })
                }
                onSelect={(address) =>
                  setTravelData({ ...travelData, arrivalPoint: address })
                }
              >
                {({
                  getInputProps,
                  suggestions,
                  getSuggestionItemProps,
                  loading,
                }) => (
                  <div>
                    <input
                      {...getInputProps({
                        placeholder: "Search Places ...",
                        className: "location-search-input",
                      })}
                    />
                    <div className="autocomplete-dropdown-container">
                      {loading && <div>Loading...</div>}
                      {suggestions.map((suggestion,index) => {
                        const className = suggestion.active
                          ? "suggestion-item--active"
                          : "suggestion-item";
                        // inline style for demonstration purpose
                        const style = suggestion.active
                          ? { backgroundColor: "#fafafa", cursor: "pointer" }
                          : { backgroundColor: "#ffffff", cursor: "pointer" };
                        return (
                          <div key={index}
                            {...getSuggestionItemProps(suggestion, {
                              className,
                              style,
                            })}
                          >
                            <span>{suggestion.description}</span>
                          </div>
                        );
                      })}{" "}
                    </div>
                  </div>
                )}
              </PlacesAutocomplete>
            </Form.Item>
            <Form.Item
              label="Car autonomy (km)"
              name="carAutonomy"
              rules={[{ required: true, message: "Car autonomy is required" }]}
            >
              <Input
                type="number"
                value={travelData.carAutonomy}
                onChange={(e) =>
                  setTravelData({ ...travelData, carAutonomy: e.target.value })
                }
              />
            </Form.Item>
            <Form.Item>
            <Space>
              <Button icon={<SearchOutlined />} onClick={main}>
              Search
              </Button>
              <Button icon={<CloseOutlined />} onClick={reset}>
                Reset
              </Button>
            </Space>
          </Form.Item>
          </Form>
        </Col>
        <Col span={16}>
          <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: "500px", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          </MapContainer>
        </Col>
      </Row>
    </div>
  );
};

export default Planner;
