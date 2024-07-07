import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, Popup } from "react-leaflet";
import "leaflet-control-geocoder/dist/Control.Geocoder.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-control-geocoder";
import axios from "axios";
import { getCurrentUser, signOut } from "aws-amplify/auth";
import "leaflet/dist/leaflet.css";
import {
  Button,
  Input,
  Menu,
  Card,
  List,
  notification,
  Space,
  Tag,
} from "antd";
import {
  HeartOutlined,
  SearchOutlined,
  CloseOutlined,
  NodeIndexOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import PlacesAutocomplete, {
  geocodeByAddress,
  getLatLng,
} from "react-places-autocomplete";
import chargerIcon from "../assets/charging-station.png";
import { generateClient } from "aws-amplify/api";
import {
  createClickChargerList,
  createFavouriteChargerList,
  createSearchLoactionList,
} from "../graphql/mutations";

const client = generateClient();
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const appKey = "4ebfd445-0045-418f-85df-85d035140274";
// 设置自定义图标
const customIcon = new L.Icon({
  iconUrl: chargerIcon,
  iconSize: [25, 35],
  iconAnchor: [12, 41],
  popupAnchor: [1, -38],
  shadowSize: [41, 41],
});
const Planner = () => {
  const [loginId, setLoginId] = useState("");
  const currentAuthenticatedUser = async () => {
    try {
      const { signInDetails } = await getCurrentUser();

      console.log(signInDetails);
      setLoginId(signInDetails?.loginId || "");
    } catch (err) {
      setLoginId("");
      console.log(err);
    }
  };
  useEffect(() => {
    currentAuthenticatedUser();
  }, []);
  const createClickChargerItem = async (station) => {
    console.log(station);
    await client.graphql({
      query: createClickChargerList,
      variables: {
        input: {
          addressInfo: JSON.stringify(station.AddressInfo),
          uuid: station.uuid,
        },
      },
    });
  };
  const createFavouriteChargerListItem = async (loginId, station) => {
    console.log(station);
    await client.graphql({
      query: createFavouriteChargerList,
      variables: {
        input: {
          addressInfo: JSON.stringify(station),
          userId: loginId,
        },
      },
    });
  };
  const createSearchLoactionItem = async (station) => {
    console.log(station);
    await client.graphql({
      query: createSearchLoactionList,
      variables: {
        input: {
          addressInfo: JSON.stringify(station),
        },
      },
    });
  };
  // const map = useMap();
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, { message, description }) => {
    api[type]({
      message,
      description,
      duration: 1,
      placement: "top",
    });
  };
  const [showRouterSearch, setShowRouterSearch] = useState(false);
  const [location, setLocation] = useState("");
  const [chargingStations, setChargingStations] = useState([]);

  const [travelData, setTravelData] = useState({
    startPoint: "",
    arrivalPoint: "",
    carAutonomy: 0,
  });

  const [startPointCoordinates, setStartPointCoordinates] = useState({});
  const [arrivalPointCoordinates, setArrivalPointCoordinates] = useState({});
  const [zoom, setZoom] = useState(6);
  const [center, setCenter] = useState([-36.8485, 174.7633]);
  const [travelPath, setTravelPath] = useState(null);
  const [finalTravelPath, setFinalTravelPath] = useState(null);
  const mapRef = useRef();
  const markersLayers = L.layerGroup([]);
const [currentBattery,setCurrentBattery]=useState(0)
  const [configValues,setConfigValues] = useState({
    radiusIncrementBy: 2,
    batteryPercentageUsage: 0.7, // 70%
    minRadius: 2, // 2 km
  })
  useEffect(()=>{
    if(currentBattery>=0&&travelData.carAutonomy>0){
      setConfigValues({...configValues,batteryPercentageUsage:(currentBattery/travelData.carAutonomy).toFixed(1)})
    }
  },[currentBattery,travelData])

  const main = async () => {
    // if (!map) return;
    L.Control.Geocoder.latLng(startPointCoordinates, startPointCoordinates);

    const newTravelPath = buildTravelPathStartToEnd();
    newTravelPath.addTo(mapRef.current);
    newTravelPath.on("routingerror", handleRoutingError);
    newTravelPath.on("routesfound", handleRoutesFound);
    // const form = mapRef.current;
    // form
    //   .validateFields()
    //   .then(async () => {
    //     L.Control.Geocoder.latLng(startPointCoordinates, startPointCoordinates);

    //     const newTravelPath = buildTravelPathStartToEnd();
    //     newTravelPath.addTo(mapRef.current);
    //     newTravelPath.on("routingerror", handleRoutingError);
    //     newTravelPath.on("routesfound", await handleRoutesFound);
    //   })
    //   .catch(() => {
    //     notification.warning({
    //       message: "Info",
    //       description: "Form data not valid",
    //     });
    //   });
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
      //   markersLayers.removeLayer(departureMarker);
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
      true
    );
  };
  useEffect(() => {
    if (travelData.startPoint) {
      geocodeByAddress(travelData.startPoint)
        .then((results) => getLatLng(results[0]))
        .then((latLng) => {
          setAddress("departureAddress", latLng);
        })
        .catch((error) => console.error("Error", error));
    }
    if (travelData.arrivalPoint) {
      geocodeByAddress(travelData.arrivalPoint)
        .then((results) => getLatLng(results[0]))
        .then((latLng) => {
          setAddress("arrivalAddress", latLng);
        })
        .catch((error) => console.error("Error", error));
    }
  }, [travelData]);

  const buildTravelPath = (passThroughPointsArray, onlyOneAlternativeBool) => {
    let arrayArgumentPoints = passThroughPointsArray.map((point) =>
      L.latLng(point[0], point[1])
    );
    console.log("arrayArgumentPoints===", arrayArgumentPoints);
    return L.Routing.control({
      waypoints: arrayArgumentPoints,
      lineOptions: {
        styles: [
          {
            color: "black",
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
    openNotificationWithIcon("error", {
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
          // 定义充电桩的标识
          const chargerMarker = L.marker(chargerCoords, {
            icon: customIcon,
            draggable: false,
          });
          //   定义充电桩的浮动内容
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
            autoPan: true,
            closeOnClick: false,
            autoClose: false,
          });
          chargerMarker.addTo(map);
          allMarkersArray.push(chargerMarker);
        });
        const markersLayerGroup = L.layerGroup(allMarkersArray);

        // markersLayerGroup.addTo(map);
        openNotificationWithIcon("success", {
          message: "Success",
          description: "Charger stations added to map",
        });
      });
    } else {
      openNotificationWithIcon("error", {
        message: "Error",
        description: "Could not find any suitable route with charging stations",
      });
    }
  };
  // 移除默认的缩放控件
  const RemoveZoomControl = () => {
    const map = useMap();
    map.zoomControl.remove();
    return null;
  };

  const searchCharger = () => {
    if (location) {
      geocodeByAddress(location)
        .then((results) => getLatLng(results[0]))
        .then((latLng) => {
          console.log(latLng);
          createSearchLoactionItem({ name: location, latLng: latLng });
          setCenter([latLng.lat, latLng.lng]);
          mapRef.current.setZoom(12);
          const fetchChargingStations = async () => {
            try {
              const response = await axios.get(
                `https://api.openchargemap.io/v3/poi/?output=json&latitude=${latLng.lat}&longitude=${latLng.lng}&distance=30&maxresults=50&key=${appKey}`
              );
              setChargingStations(response.data);
            } catch (error) {
              console.error("Error fetching charging stations:", error);
            }
          };
          fetchChargingStations();
        })
        .catch((error) => console.error("Error", error));
    }
  };
  const getCurrentLocation = () => {
    // 获取当前地理位置
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCenter([latitude, longitude]);
        mapRef.current.setZoom(10);
      },
      (error) => {
        console.error("Error fetching location: ", error);
      }
    );
  };
  useEffect(() => {
    getCurrentLocation();
  }, []);

  return (
    <div style={{ height: "100%", position: "relative", width: "100%" }}>
      {contextHolder}
      {showRouterSearch ? (
        <div
          style={{
            position: "absolute",
            left: 20,
            top: 20,
            zIndex: 100,
            background: "rgba(0,0,0,0.6)",
            borderRadius: 10,
            padding: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ color: "white" }}>
              Please input start point, end point, <br />
              car autonomy and current battery
            </span>
            <CloseOutlined
              style={{ paddingLeft: 18, color: "white", cursor: "pointer" }}
              onClick={() => setShowRouterSearch(false)}
            />
          </div>

          <div
            style={{
              height: 200,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-around",
            }}
          >
            <PlacesAutocomplete
              value={travelData.startPoint}
              onChange={(address, placeId, suggestion) => {
                setTravelData({
                  ...travelData,
                  startPoint: address,
                });
              }}
              onSelect={(address, placeId, suggestion) => {
                console.log("select", suggestion);
                setTravelData({
                  ...travelData,
                  startPoint: suggestion.description,
                });
              }}
            >
              {({
                getInputProps,
                suggestions,
                getSuggestionItemProps,
                loading,
              }) => (
                <div>
                  <Input
                    style={{ width: 240 }}
                    {...getInputProps({
                      placeholder: "Start Point ...",
                      className: "location-search-input",
                    })}
                  />
                  <div className="autocomplete-dropdown-container">
                    {loading && <div>Loading...</div>}
                    {suggestions.map((suggestion, index) => {
                      const className = suggestion.active
                        ? "suggestion-item--active"
                        : "suggestion-item";
                      // inline style for demonstration purpose
                      const style = suggestion.active
                        ? { backgroundColor: "#fafafa", cursor: "pointer" }
                        : { backgroundColor: "#ffffff", cursor: "pointer" };
                      return (
                        <div
                          key={suggestion?.placeId || index}
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
            <PlacesAutocomplete
              value={travelData.arrivalPoint}
              onChange={(address) => {
                setTravelData({
                  ...travelData,
                  arrivalPoint: address,
                });
              }}
              onSelect={(address, placeId, suggestion) => {
                setTravelData({
                  ...travelData,
                  arrivalPoint: suggestion.description,
                });
              }}
            >
              {({
                getInputProps,
                suggestions,
                getSuggestionItemProps,
                loading,
              }) => (
                <div>
                  <Input
                    style={{ width: 240 }}
                    {...getInputProps({
                      placeholder: "End Point ...",
                      className: "location-search-input",
                    })}
                  />
                  <div className="autocomplete-dropdown-container">
                    {loading && <div>Loading...</div>}
                    {suggestions.map((suggestion, index) => {
                      const className = suggestion.active
                        ? "suggestion-item--active"
                        : "suggestion-item";
                      // inline style for demonstration purpose
                      const style = suggestion.active
                        ? { backgroundColor: "#fafafa", cursor: "pointer" }
                        : { backgroundColor: "#ffffff", cursor: "pointer" };
                      return (
                        <div
                          key={suggestion?.placeId || index}
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

            <Input
              style={{ width: 240 }}
              placeholder="Car autonomy (km)"
              type="number"
              value={travelData.carAutonomy}
              onChange={(e) =>
                setTravelData({ ...travelData, carAutonomy: e.target.value })
              }
            />

            <Input
              style={{ width: 240 }}
              placeholder="Current Battery(km)"
              type="number"
              value={currentBattery}
              onChange={(e) =>
                setCurrentBattery(e.target.value)
              }
            />
            <Space>
              <Button icon={<SearchOutlined />} onClick={main}>
                Search
              </Button>
              <Button icon={<CloseOutlined />} onClick={reset}>
                Reset
              </Button>
            </Space>
          </div>
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            left: 20,
            top: 20,
            zIndex: 100,
            display: "flex",
            flexDirection: "row",
            borderRadius: 10,
            padding: 10,
            background: "rgba(0,0,0,0.6)",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <PlacesAutocomplete
            style={{ position: "relative" }}
            value={location}
            onChange={(address, placeId, suggestion) => {
              setLocation(address);
            }}
            onSelect={(address, placeId, suggestion) => {
              console.log("select", suggestion);
              setLocation(suggestion.description);
            }}
          >
            {({
              getInputProps,
              suggestions,
              getSuggestionItemProps,
              loading,
            }) => (
              <div>
                <div>
                  <Input
                    style={{ width: 200 }}
                    {...getInputProps({
                      placeholder: "Search EV charger ...",
                      className: "location-search-input",
                    })}
                  />
                  <SearchOutlined
                    style={{
                      marginLeft: 20,
                      color: "yellow",
                      cursor: "pointer",
                      fontSize: 20,
                    }}
                    onClick={() => searchCharger()}
                  />
                  <NodeIndexOutlined
                    style={{
                      marginLeft: 20,
                      color: "white",
                      cursor: "pointer",
                      fontSize: 20,
                    }}
                    onClick={() => {
                      setShowRouterSearch(true);
                      setChargingStations([]);
                      setLocation("");
                      getCurrentLocation();
                    }}
                  />
                </div>

                <div
                  className="autocomplete-dropdown-container"
                  style={{ borderRadius: 4, marginTop: 4 }}
                >
                  {loading && <div>Loading...</div>}
                  {suggestions.map((suggestion, index) => {
                    const className = suggestion.active
                      ? "suggestion-item--active"
                      : "suggestion-item";
                    // inline style for demonstration purpose
                    const style = suggestion.active
                      ? { backgroundColor: "#fafafa", cursor: "pointer" }
                      : { backgroundColor: "#ffffff", cursor: "pointer" };
                    return (
                      <div
                        key={suggestion?.placeId || index}
                        {...getSuggestionItemProps(suggestion, {
                          className,
                          style,
                        })}
                        style={{
                          padding: "2px 5px",
                          color: "white",
                          cursor: "pointer",
                        }}
                      >
                        <span>{suggestion.description}</span>
                      </div>
                    );
                  })}{" "}
                </div>
              </div>
            )}
          </PlacesAutocomplete>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={zoom}
        style={{
          height: "100%",
          width: "100%",
          position: "relative",
          zIndex: 10,
        }}
        ref={mapRef}
      >
        <TileLayer
          style={{ zIndex: 10 }}
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
        />
        <RemoveZoomControl />
        {chargingStations.map((station, idx) => (
          <Marker
            key={idx}
            position={[
              station.AddressInfo.Latitude,
              station.AddressInfo.Longitude,
            ]}
            icon={customIcon}
            eventHandlers={{
              click: () => createClickChargerItem(station),
            }}
          >
            <Popup>
              <div style={{ maxWidth: "250px" }}>
                <h3>{station.AddressInfo.Title}</h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <EnvironmentOutlined
                    style={{ fontSize: 24, color: "orange" }}
                  />
                  <div style={{ paddingLeft: 10 }}>
                    <div>{station.AddressInfo.AddressLine1}</div>
                    <div>
                      {station.AddressInfo.Town},{" "}
                      {station.AddressInfo.StateOrProvince}{" "}
                      {station.AddressInfo.Postcode}
                    </div>
                  </div>
                  <HeartOutlined
                    style={{ fontSize: 24, color: "red", cursor: "pointer" }}
                    onClick={() => {
                      if (loginId) {
                        createFavouriteChargerListItem(
                          loginId,
                          station.AddressInfo
                        );
                      } else {
                        openNotificationWithIcon("error", {
                          message: "Error",
                          description: "Please login first",
                        });
                      }
                    }}
                  />
                </div>

                <p>
                  Status:{" "}
                  <Tag
                    color={
                      station.StatusType && station.StatusType.IsOperational
                        ? "green"
                        : "red"
                    }
                  >
                    {station.StatusType ? station.StatusType.Title : "unknown"}
                  </Tag>
                </p>
                <div style={{ borderRadius: 4, overflow: "hidden" }}>
                  <div
                    style={{
                      textAlign: "center",
                      padding: 8,
                      fontSize: 16,
                      background: "#99CC99",
                      color: "#006",
                    }}
                  >
                    Price Info:
                  </div>
                  <div
                    style={{
                      textAlign: "center",
                      background: "rgba(150,111,172,0.4)",
                      padding: 8,
                      color: "#903",
                      fontWeight: "bold",
                    }}
                  >
                    {station.UsageCost || "Unknown"}
                  </div>
                </div>

                <div
                  style={{ borderRadius: 4, overflow: "hidden", marginTop: 10 }}
                >
                  <div
                    style={{
                      padding: 5,
                      fontSize: 14,
                      background: "#cf9",
                      color: "green",
                    }}
                  >
                    General Comments
                  </div>
                  <div
                    style={{
                      border: "1px solid #ddd",
                      borderBottomLeftRadius: 4,
                      borderBottomRightRadius: 4,
                      textAlign: "center",
                      padding: 8,
                      color: "#888",
                      fontWeight: "bold",
                    }}
                  >
                    {station.GeneralComments || "No comments available"}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default Planner;
