import React, { useEffect, useState, useRef } from "react";
import { Button, Form, Input, Select, Space } from "antd";
import {
  MapContainer,
  TileLayer,
  useMap,
  LMap,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import { useLoadScript } from "@react-google-maps/api";
import { Col, Row } from "antd";
import PlacesAutocomplete from "../components/placesAutocomplete";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-control-geocoder";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-control-geocoder/dist/Control.Geocoder.css";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});
const customIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
const libraries = ["places", "directions"];
const API_KEY = "4ebfd445-0045-418f-85df-85d035140274";
const Index = () => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyCxhujXInUyYwI6dtVWFnj6KholRlz8WVc", // Add your Google Maps API key
    libraries,
  });
  const [zoom, setZoom] = useState(11);
  const [center, setCenter] = useState(
    L.latLng({ lat: -36.8485, lng: 174.7633 })
  );
  // 起始点
  const [startPointCoordinates, setStartPointCoordinates] = useState({});
  // 终点
  const [endPointCoordinates, setEndPointCoordinates] = useState({});
  const [start, setStart] = useState([]);
  const [end, setEnd] = useState([]);
  const [stations, setStations] = useState([]);
  const [route, setRoute] = useState([]);
  const [range, setRange] = useState(10);
  const [chargeStations, setChargeStations] = useState([]);
  const maxRange = 30; // Max range on full charge in km
  const currentRange = 15; // Current range in km

  const [travelPath, setTravelPath] = useState(null);
  const [finalTravelPath, setFinalTravelPath] = useState(null);
  const [configValues, setConfigValues] = useState({
    radiusIncrementBy: 2,
    batteryPercentageUsage: 0.7, //70%
    minRadius: 2, // 2 km
  });
  const [markersLayers, setMarkersLayers] = useState([]);

  
  const fetchChargingStations = async (start, end) => {
    const response = await axios.get(`https://api.openchargemap.io/v3/poi/`, {
      params: {
        key: API_KEY,
        latitude: (start[0] + end[0]) / 2,
        longitude: (start[1] + end[1]) / 2,
        distance: 50, // This value should be adjusted according to your needs
        maxresults: 10,
      },
    });
    return response.data;
  };
  const calculateRoute = (start, end, stations, range) => {
    // Implement your routing algorithm here
    // This is a placeholder implementation
    let route = [start];
    let remainingRange = range;

    for (let i = 0; i < stations.length; i++) {
      const station = stations[i];
      const distanceToStation =
        L.latLng(start).distanceTo(
          L.latLng(station.AddressInfo.Latitude, station.AddressInfo.Longitude)
        ) / 1000;
      if (distanceToStation <= remainingRange) {
        route.push([
          station.AddressInfo.Latitude,
          station.AddressInfo.Longitude,
        ]);
        remainingRange -= distanceToStation;
        start = [station.AddressInfo.Latitude, station.AddressInfo.Longitude];
      } else {
        break;
      }
    }

    route.push(end);
    return route;
  };
  // 填入起点站
  useEffect(() => {
    const currentMarkersLayers = markersLayers;
    let startPointCheck = currentMarkersLayers.some((item) => {
      if (item.popupText === "Start") {
        return true;
      }
    });

    if (startPointCheck) {
      if (startPointCoordinates?.lat) {
        currentMarkersLayers[0] = {
          position: [startPointCoordinates?.lat, startPointCoordinates?.lng],
          popupText: "Start",
        };
        // 重新定义起始点
        setStart([startPointCoordinates?.lat, startPointCoordinates?.lng]);
      }
    } else {
      if (startPointCoordinates?.lat) {
        currentMarkersLayers.push({
          position: [startPointCoordinates?.lat, startPointCoordinates?.lng],
          popupText: "Start",
        });
        // 重新定义起始点
        setStart([startPointCoordinates?.lat, startPointCoordinates?.lng]);
      }
    }
    setMarkersLayers([...currentMarkersLayers]);
  }, [startPointCoordinates]);
  // 填入终点站
  useEffect(() => {
    const currentMarkersLayers = markersLayers;
    let endPointCheck = currentMarkersLayers.some((item) => {
      if (item.popupText === "End") {
        return true;
      }
    });
    if (endPointCheck) {
      if (endPointCoordinates?.lat) {
        currentMarkersLayers[currentMarkersLayers.length - 1] = {
          position: [endPointCoordinates?.lat, endPointCoordinates?.lng],
          popupText: "End",
        };
        // 重新定义终点
        setEnd([endPointCoordinates?.lat, endPointCoordinates?.lng]);
      }
    } else {
      if (endPointCoordinates?.lat) {
        currentMarkersLayers.push({
          position: [endPointCoordinates?.lat, endPointCoordinates?.lng],
          popupText: "End",
        });
        // 重新定义终点
        setEnd([endPointCoordinates?.lat, endPointCoordinates?.lng]);
      }
    }
    setMarkersLayers([...currentMarkersLayers]);
  }, [endPointCoordinates]);

  // useEffect(() => {
  //   if (start.length && end.length) {
  //     const getStationsAndCalculateRoute = async () => {
  //       const stations = await fetchChargingStations(start, end);
  //       setStations(stations);
  //       const route = calculateRoute(start, end, stations, range);
  //       setRoute(route);
  //     };

  //     getStationsAndCalculateRoute();
  //   }
  // }, [start, end, range]);
  // 当新的起始点start和新的终点end更新时触发查找充电桩
  useEffect(() => {
    if (start.length && end.length) {
      // Fetch charge stations within the bounding box
      const fetchChargeStations = async () => {
        const response = await axios.get(`https://api.openchargemap.io/v3/poi/`, {
          params: {
            key: API_KEY,
            latitude: (start[0] + end[0]) / 2,
            longitude: (start[1] + end[1]) / 2,
            distance: 50, // This value should be adjusted according to your needs
            maxresults: 10,
            boundingbox:[(`${Math.min(start[0], end[0])},${Math.min(
              start[1],
              end[1]
            )}`),(`${Math.max(start[0], end[0])},${Math.max(start[1], end[1])}`)]
          },
        });
      
        setChargeStations(response.data);
      };

      fetchChargeStations();
    }
  }, [start, end]);
  // 当充电桩定义好以后触发规划路线
  useEffect(() => {
    // Plan the route
    const planRoute = async () => {
      const waypoints = [];
      let currentPos = start;
      let remainingRange = currentRange;
      let routePath = [];

      for (const station of chargeStations) {
        const stationPos = [station.AddressInfo.Latitude, station.AddressInfo.Longitude];
        const distanceToStation = getDistance(currentPos, stationPos);

        if (distanceToStation <= remainingRange) {
          waypoints.push(stationPos);
          const directions = await getDirections(currentPos, stationPos);
          routePath = [...routePath, ...directions];
          currentPos = stationPos;
          remainingRange = maxRange; // Assume full charge after reaching the station
        }
      }

      const distanceToEnd = getDistance(currentPos, end);
      if (distanceToEnd <= remainingRange) {
        const directions = await getDirections(currentPos, end);
        routePath = [...routePath, ...directions];
      }

      setRoute(routePath);
    };

    if (chargeStations.length > 0) {
      planRoute();
    }
  }, [chargeStations]);

  const getDistance = (pos1, pos2) => {
    const [lat1, lng1] = pos1;
    const [lat2, lng2] = pos2;
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const getDirections = async (origin, destination) => {
    const directionsService = new window.google.maps.DirectionsService();
    const result = await directionsService.route({
      origin: new window.google.maps.LatLng(origin[0], origin[1]),
      destination: new window.google.maps.LatLng(
        destination[0],
        destination[1]
      ),
      travelMode: window.google.maps.TravelMode.DRIVING,
    });
    return result.routes[0].overview_path.map((point) => [
      point.lat(),
      point.lng(),
    ]);
  };



  const layout = {
    labelCol: {
      span: 16,
      offset: 10,
    },
    wrapperCol: {
      span: 20,
      offset: 2,
    },
  };
  const tailLayout = {
    wrapperCol: {
      offset: 6,
      span: 16,
    },
  };

  const [form] = Form.useForm();

  const onFinish = (values) => {
    console.log(values);
  };
  const onReset = () => {
    form.resetFields();
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };
  if (!isLoaded) return <div>Loading...</div>;
  return (
    <div style={{ display: "flex", flexDirection: "row", height: "85vh" }}>
      <Col xs={24} sm={8} md={6}>
        <Form
          {...layout}
          form={form}
          layout="vertical"
          name="control-hooks"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          style={{
            maxWidth: 600,
          }}
        >
          <Form.Item
            name="startPoint"
            label="Your location"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <PlacesAutocomplete setSelectedPlace={setStartPointCoordinates} />
          </Form.Item>
          <Form.Item
            name="endPoint"
            label="Destination"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <PlacesAutocomplete setSelectedPlace={setEndPointCoordinates} />
          </Form.Item>

          {/* <Form.Item
            name="Car Autonomy"
            label="Car Autonomy"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="Current battery status"
            label="Current battery status"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Input />
          </Form.Item> */}
          <Form.Item {...tailLayout}>
            <Space>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
              <Button htmlType="button" onClick={onReset}>
                Reset
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Col>
      <Col xs={24} sm={16} md={18}>
        <MapContainer
          style={{ height: "85vh", width: "100wh" }}
          center={center}
          zoom={zoom}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {startPointCoordinates?.lat ? (
            <Marker
              position={[startPointCoordinates.lat, startPointCoordinates.lng]}
            >
              <Popup>{"Start"}</Popup>
            </Marker>
          ) : null}

          {endPointCoordinates?.lat ? (
            <Marker
              position={[endPointCoordinates.lat, endPointCoordinates.lng]}
            >
              <Popup>{"End"}</Popup>
            </Marker>
          ) : null}
          {/* {stations.map((item) => (
            <Marker
              icon={customIcon}
              key={item.ID}
              position={[
                item.AddressInfo.Latitude,
                item.AddressInfo.Longitude,
              ]}
            >
              <Popup>{item.AddressInfo.Title}</Popup>
            </Marker>
          ))} */}
          {chargeStations.map((station) => (
            <Marker
              key={station.ID}
              position={[
                station.AddressInfo.Latitude,
                station.AddressInfo.Longitude,
              ]}
            >
              <Popup>{station.AddressInfo.Title}</Popup>
            </Marker>
          ))}
          <Polyline positions={route} color="blue" />
          {route.length > 0 && <Polyline positions={route} color="blue" />}
        </MapContainer>
      </Col>
    </div>
  );
};
export default Index;
