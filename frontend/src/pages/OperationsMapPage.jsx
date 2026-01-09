import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';
import { MapContainer, TileLayer, Polyline, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Local cache for coordinates (persists during session)
const coordsCache = {};

// Color palette for routes
const ROUTE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];


const OperationsMapPage = () => {
    const [routes, setRoutes] = useState([]);
    const [trucks, setTrucks] = useState([]);
    const [parcels, setParcels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [cityCoords, setCityCoords] = useState(coordsCache); // Local state for coordinates

    // Function to get coordinates for a city (uses cache + state)
    const getCoords = useCallback((city) => {
        if (!city) return null;
        const key = city.toString().trim().toUpperCase();
        if (cityCoords[key]) return [cityCoords[key].lat, cityCoords[key].lng];
        if (coordsCache[key]) return [coordsCache[key].lat, coordsCache[key].lng];
        return null; // Return null if not yet geocoded
    }, [cityCoords]);

    // Fetch coordinates for all cities in routes
    const fetchCoordinates = useCallback(async (routesList) => {
        // Extract all unique cities from routes
        const allCities = new Set();
        routesList.forEach(route => {
            const stops = Array.isArray(route.stops)
                ? route.stops
                : (route.stops || '').split(',').map(s => s.trim());
            stops.forEach(city => {
                const key = city.trim().toUpperCase();
                if (key && !coordsCache[key]) {
                    allCities.add(key);
                }
            });
        });

        if (allCities.size === 0) return;

        try {
            // Use batch geocoding endpoint
            const response = await axios.post(`${API_BASE_URL}/geocode/batch`, {
                cities: Array.from(allCities)
            });

            // Update cache and state
            const newCoords = { ...coordsCache };
            Object.entries(response.data).forEach(([city, coords]) => {
                newCoords[city] = coords;
                coordsCache[city] = coords; // Update global cache
            });
            setCityCoords(newCoords);
        } catch (err) {
            console.error('Error fetching coordinates:', err);
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [routesRes, trucksRes, parcelsRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/routes`),
                    axios.get(`${API_BASE_URL}/trucks`),
                    axios.get(`${API_BASE_URL}/parcels`)
                ]);
                setRoutes(routesRes.data);
                setTrucks(trucksRes.data);
                setParcels(parcelsRes.data);

                // Fetch coordinates for all cities in routes
                await fetchCoordinates(routesRes.data);
            } catch (err) {
                console.error('Error fetching map data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 15000); // Refresh every 15s
        return () => clearInterval(interval);
    }, [fetchCoordinates]);

    // Get assigned parcels for a truck
    const getAssignedParcels = (truckID) => parcels.filter(p => p.assignedTruckID === truckID);

    // Get trucks on a route
    const getTrucksOnRoute = (routeID) => trucks.filter(t => t.routeID === routeID);

    // Calculate truck load
    const getTruckLoad = (truckID) => {
        const assigned = getAssignedParcels(truckID);
        return assigned.reduce((sum, p) => sum + (Number(p.weight) || 0), 0);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗺️</div>
                    <p style={{ color: 'var(--text-secondary)' }}>Loading Operations Map...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 140px)', gap: '1rem' }}>
            {/* LEFT PANEL - Route & Truck Info */}
            <div style={{
                width: '320px',
                flexShrink: 0,
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{
                    padding: '1rem',
                    borderBottom: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)'
                }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>📍 Active Routes</h3>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {routes.length} routes • {trucks.length} trucks • {parcels.filter(p => p.assignedTruckID).length} assigned parcels
                    </p>
                </div>

                <div style={{ flex: 1, overflow: 'auto', padding: '0.5rem' }}>
                    {routes.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                            <p>No routes configured</p>
                            <p style={{ fontSize: '0.85rem' }}>Add routes to see them on the map</p>
                        </div>
                    ) : (
                        routes.map((route, idx) => {
                            const color = ROUTE_COLORS[idx % ROUTE_COLORS.length];
                            const trucksOnRoute = getTrucksOnRoute(route.routeID);
                            const isSelected = selectedRoute === route.routeID;

                            return (
                                <div
                                    key={route.routeID}
                                    onClick={() => setSelectedRoute(isSelected ? null : route.routeID)}
                                    style={{
                                        padding: '0.75rem',
                                        marginBottom: '0.5rem',
                                        borderRadius: '8px',
                                        backgroundColor: isSelected ? 'rgba(59,130,246,0.1)' : 'transparent',
                                        border: `2px solid ${isSelected ? color : 'transparent'}`,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            backgroundColor: color
                                        }}></div>
                                        <strong>{route.routeID}</strong>
                                        <span style={{
                                            marginLeft: 'auto',
                                            fontSize: '0.75rem',
                                            backgroundColor: 'var(--bg-secondary)',
                                            padding: '2px 8px',
                                            borderRadius: '12px'
                                        }}>
                                            {trucksOnRoute.length} 🚚
                                        </span>
                                    </div>
                                    <div style={{
                                        fontSize: '0.85rem',
                                        color: 'var(--text-secondary)',
                                        marginTop: '0.25rem',
                                        paddingLeft: '20px'
                                    }}>
                                        {Array.isArray(route.stops) ? route.stops.join(' → ') : route.stops}
                                    </div>

                                    {/* Trucks Dropdown */}
                                    {isSelected && trucksOnRoute.length > 0 && (
                                        <div style={{
                                            marginTop: '0.75rem',
                                            paddingTop: '0.5rem',
                                            borderTop: '1px dashed var(--border-color)'
                                        }}>
                                            {trucksOnRoute.map(truck => {
                                                const load = getTruckLoad(truck.truckID);
                                                const assignedParcels = getAssignedParcels(truck.truckID);
                                                const utilization = (load / truck.maxCapacity) * 100;

                                                return (
                                                    <div key={truck.truckID} style={{
                                                        padding: '0.5rem',
                                                        marginBottom: '0.25rem',
                                                        backgroundColor: 'var(--bg-secondary)',
                                                        borderRadius: '6px'
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span>🚚 <strong>{truck.truckID}</strong></span>
                                                            <span style={{
                                                                fontSize: '0.75rem',
                                                                color: utilization > 80 ? '#ef4444' : '#10b981'
                                                            }}>
                                                                {load}/{truck.maxCapacity} kg
                                                            </span>
                                                        </div>
                                                        {/* Capacity Bar */}
                                                        <div style={{
                                                            height: '4px',
                                                            backgroundColor: '#e5e7eb',
                                                            borderRadius: '2px',
                                                            marginTop: '4px',
                                                            overflow: 'hidden'
                                                        }}>
                                                            <div style={{
                                                                width: `${Math.min(utilization, 100)}%`,
                                                                height: '100%',
                                                                backgroundColor: utilization > 80 ? '#ef4444' : '#10b981',
                                                                transition: 'width 0.3s'
                                                            }}></div>
                                                        </div>
                                                        {/* Parcels */}
                                                        {assignedParcels.length > 0 && (
                                                            <div style={{
                                                                fontSize: '0.75rem',
                                                                color: 'var(--text-secondary)',
                                                                marginTop: '4px'
                                                            }}>
                                                                📦 {assignedParcels.map(p => p.parcelID).join(', ')}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* RIGHT PANEL - Leaflet Map */}
            <div style={{
                flex: 1,
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <MapContainer
                    center={[20.5, 78.9]}
                    zoom={5}
                    style={{ width: '100%', height: '100%' }}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Render Routes as Polylines */}
                    {routes.map((route, idx) => {
                        const color = ROUTE_COLORS[idx % ROUTE_COLORS.length];
                        const stops = Array.isArray(route.stops)
                            ? route.stops
                            : (route.stops || '').split(',').map(s => s.trim());

                        const positions = stops.map(s => getCoords(s)).filter(Boolean);
                        if (positions.length < 2) return null;

                        const isSelected = selectedRoute === route.routeID;

                        return (
                            <React.Fragment key={route.routeID}>
                                <Polyline
                                    positions={positions}
                                    pathOptions={{
                                        color: color,
                                        weight: isSelected ? 6 : 4,
                                        opacity: isSelected ? 1 : 0.7,
                                        dashArray: isSelected ? '' : ''
                                    }}
                                    eventHandlers={{
                                        click: () => setSelectedRoute(route.routeID)
                                    }}
                                />
                                {/* Stop Markers */}
                                {positions.map((pos, i) => (
                                    <CircleMarker
                                        key={`${route.routeID}-stop-${i}`}
                                        center={pos}
                                        radius={8}
                                        pathOptions={{
                                            fillColor: color,
                                            fillOpacity: 1,
                                            color: 'white',
                                            weight: 2
                                        }}
                                    >
                                        <Popup>
                                            <strong>{stops[i]}</strong><br />
                                            Route: {route.routeID}
                                        </Popup>
                                    </CircleMarker>
                                ))}
                            </React.Fragment>
                        );
                    })}

                    {/* Truck Markers */}
                    {trucks.map(truck => {
                        const route = routes.find(r => r.routeID === truck.routeID);
                        if (!route) return null;

                        const stops = Array.isArray(route.stops)
                            ? route.stops
                            : (route.stops || '').split(',').map(s => s.trim());

                        if (stops.length === 0) return null;

                        const pos = getCoords(stops[0]);
                        if (!pos) return null;

                        // Offset to prevent overlap
                        const offset = [
                            (Math.random() - 0.5) * 0.2,
                            (Math.random() - 0.5) * 0.2
                        ];

                        const load = getTruckLoad(truck.truckID);
                        const assignedParcels = getAssignedParcels(truck.truckID);

                        const truckIcon = L.divIcon({
                            className: 'truck-marker',
                            html: `<div style="
                                background: #3b82f6;
                                color: white;
                                padding: 4px 8px;
                                border-radius: 4px;
                                font-size: 11px;
                                font-weight: bold;
                                white-space: nowrap;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                            ">🚚 ${truck.truckID}</div>`,
                            iconSize: [80, 24],
                            iconAnchor: [40, 12]
                        });

                        return (
                            <Marker
                                key={truck.truckID}
                                position={[pos[0] + offset[0], pos[1] + offset[1]]}
                                icon={truckIcon}
                            >
                                <Popup>
                                    <div style={{ minWidth: '150px' }}>
                                        <strong>🚚 {truck.truckID}</strong>
                                        <hr style={{ margin: '0.5rem 0' }} />
                                        <div>Route: {truck.routeID}</div>
                                        <div>Load: {load}/{truck.maxCapacity} kg</div>
                                        {assignedParcels.length > 0 && (
                                            <div style={{ marginTop: '0.5rem' }}>
                                                <strong>Parcels:</strong>
                                                <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1rem' }}>
                                                    {assignedParcels.map(p => (
                                                        <li key={p.parcelID}>{p.parcelID} → {p.destination} ({p.weight}kg)</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>
            </div>
        </div>
    );
};

export default OperationsMapPage;
