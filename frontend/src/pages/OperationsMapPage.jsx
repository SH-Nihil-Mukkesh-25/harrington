import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';
import MapContainer from '../components/MapContainer';
import { Polyline, Marker } from '@react-google-maps/api';

// Mock Coordinates Dictionary
const CITY_COORDS = {
    // Major Indian Cities
    'MUMBAI': { lat: 19.0760, lng: 72.8777 },
    'PUNE': { lat: 18.5204, lng: 73.8567 },
    'BANGALORE': { lat: 12.9716, lng: 77.5946 },
    'DELHI': { lat: 28.7041, lng: 77.1025 },
    'CHENNAI': { lat: 13.0827, lng: 80.2707 },
    'HYDERABAD': { lat: 17.3850, lng: 78.4867 },
    'KOLKATA': { lat: 22.5726, lng: 88.3639 },
    'AHMEDABAD': { lat: 23.0225, lng: 72.5714 },
    'JAIPUR': { lat: 26.9124, lng: 75.7873 },
    'LUCKNOW': { lat: 26.8467, lng: 80.9461 },

    // Abstract Stops (for demo data)
    'A': { lat: 19.0760, lng: 72.8777 }, // Mumbai
    'B': { lat: 18.5204, lng: 73.8567 }, // Pune
    'C': { lat: 12.9716, lng: 77.5946 }, // Bangalore
    'D': { lat: 28.7041, lng: 77.1025 }, // Delhi
    'E': { lat: 13.0827, lng: 80.2707 }, // Chennai

    // Variation: CityA, CityB style
    'CITYA': { lat: 22.5726, lng: 88.3639 }, // Kolkata
    'CITYB': { lat: 20.2961, lng: 85.8245 }, // Bhubaneswar
    'CITYC': { lat: 17.3850, lng: 78.4867 }, // Hyderabad
    'CITYD': { lat: 13.0827, lng: 80.2707 }, // Chennai
};

function getCoordinates(city) {
    if (!city) return null;
    // Normalize: Remove whitespace, uppercase
    const key = city.replace(/\s+/g, '').toUpperCase();

    if (CITY_COORDS[key]) return CITY_COORDS[key];

    // Deterministic fallback for unknown cities
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    const lat = 10 + (Math.abs(hash) % 2000) / 100;
    const lng = 70 + (Math.abs(hash >> 8) % 2000) / 100;
    return { lat, lng };
}

const OperationsMapPage = () => {
    const [routes, setRoutes] = useState([]);
    const [trucks, setTrucks] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Clear error on new attempt
                setError(null);
                const [routesRes, trucksRes, alertsRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/routes`),
                    axios.get(`${API_BASE_URL}/trucks`),
                    axios.get(`${API_BASE_URL}/alerts`)
                ]);
                setRoutes(routesRes.data);
                setTrucks(trucksRes.data);
                setAlerts(alertsRes.data);
            } catch (err) {
                console.error("Error fetching map data:", err);
                setError("Unable to load live data. Please check your connection.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        // Refresh every 30s
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const getRouteColor = (routeID) => {
        // Find trucks on this route
        const trucksOnRoute = trucks.filter(t => t.routeID === routeID).map(t => t.truckID);

        // Check if any critical alert (SL-1) is associated with these trucks
        const hasCriticalAlert = alerts.some(a =>
            a.severity === 'SL-1' &&
            (a.truckID && trucksOnRoute.includes(a.truckID))
        );

        return hasCriticalAlert ? '#FF0000' : '#0000FF';
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading Operations Map...</div>;

    return (
        <div style={{ width: '100%', height: 'calc(100vh - 64px)', position: 'relative' }}>
            {error && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    zIndex: 1000,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                    ⚠️ {error} - Showing cached or empty view
                </div>
            )}
            <MapContainer zoom={4}>
                {/* 1. Render Routes as Polylines */}
                {routes.map(r => {
                    if (!r || !r.stops) return null;

                    // Normalize stops: Handle both Array and String formats
                    let stopList = [];
                    if (Array.isArray(r.stops)) {
                        stopList = r.stops;
                    } else if (typeof r.stops === 'string') {
                        stopList = r.stops.split(',');
                    }

                    const stops = stopList.map(s => getCoordinates(s));
                    const path = stops.filter(Boolean);

                    if (path.length < 2) return null;

                    return (
                        <Polyline
                            key={r.routeID}
                            path={path}
                            options={{
                                strokeColor: getRouteColor(r.routeID),
                                strokeOpacity: 0.8,
                                strokeWeight: 4,
                                clickable: true
                            }}
                        />
                    );
                })}

                {/* 2. Render Trucks as Markers */}
                {trucks.map(t => {
                    // Logic: Place truck at the coordinates of the first stop
                    const route = routes.find(r => r.routeID === t.routeID);
                    if (!route || !route.stops) return null;

                    // Normalize stops for truck positioning too
                    let stopList = [];
                    if (Array.isArray(route.stops)) {
                        stopList = route.stops;
                    } else if (typeof route.stops === 'string') {
                        stopList = route.stops.split(',');
                    }

                    if (stopList.length === 0) return null;

                    const firstStopName = stopList[0];
                    const position = getCoordinates(firstStopName);

                    if (!position) return null;

                    // Check for critical alerts (SL-1)
                    const hasCriticalAlert = alerts.some(a =>
                        a.severity === 'SL-1' && a.truckID === t.truckID
                    );

                    // Marker Color: Red for Alert, Green for Normal
                    const markerUrl = hasCriticalAlert
                        ? "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                        : "http://maps.google.com/mapfiles/ms/icons/green-dot.png";

                    // Offset to avoid full overlap
                    const offsetLat = (Math.random() - 0.5) * 0.1;
                    const offsetLng = (Math.random() - 0.5) * 0.1;

                    return (
                        <Marker
                            key={t.truckID}
                            position={{ lat: position.lat + offsetLat, lng: position.lng + offsetLng }}
                            icon={{
                                url: markerUrl
                            }}
                            label={{
                                text: t.truckID,
                                color: 'black',
                                fontWeight: 'bold',
                                fontSize: '12px',
                                className: 'map-marker-label'
                            }}
                            title={`Truck: ${t.truckID} | Route: ${t.routeID}${hasCriticalAlert ? ' (ALERT)' : ''}`}
                        />
                    );
                })}
            </MapContainer>

            {/* Map Legend Overlay */}
            <div style={{
                position: 'absolute',
                bottom: '30px',
                left: '30px',
                backgroundColor: 'white',
                padding: '1rem',
                borderRadius: '8px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                zIndex: 10,
                minWidth: '200px',
                fontSize: '0.9rem'
            }}>
                <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '5px', fontSize: '1rem' }}>Operation Status</h4>

                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ width: '20px', height: '4px', backgroundColor: '#0000FF', marginRight: '10px' }}></div>
                    <span>Route OK</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ width: '20px', height: '4px', backgroundColor: '#FF0000', marginRight: '10px' }}></div>
                    <span>Route Alert (SL-1)</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <img src="http://maps.google.com/mapfiles/ms/icons/green-dot.png" alt="OK" style={{ width: '20px', marginRight: '10px' }} />
                    <span>Truck OK</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img src="http://maps.google.com/mapfiles/ms/icons/red-dot.png" alt="Alert" style={{ width: '20px', marginRight: '10px' }} />
                    <span>Truck Alert</span>
                </div>
            </div>
        </div>
    );
};

export default OperationsMapPage;
