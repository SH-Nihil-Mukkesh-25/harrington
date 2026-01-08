import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

const OperationsPage = () => {
    const [parcels, setParcels] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [trucks, setTrucks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('unassigned');
    const [selectedParcel, setSelectedParcel] = useState(null);

    // Assignment State
    const [selectedRouteID, setSelectedRouteID] = useState('');
    const [selectedTruckID, setSelectedTruckID] = useState('');
    const [assigning, setAssigning] = useState(false);
    const [assignMsg, setAssignMsg] = useState(null);

    useEffect(() => {
        fetchAllData();
    }, []);

    // Reset selection state when parcel changes
    useEffect(() => {
        if (selectedParcel) {
            setSelectedRouteID('');
            setSelectedTruckID('');
            setAssignMsg(null);
        }
    }, [selectedParcel]);

    const fetchAllData = async () => {
        try {
            const [parcelsRes, routesRes, trucksRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/parcels`),
                axios.get(`${API_BASE_URL}/routes`),
                axios.get(`${API_BASE_URL}/trucks`)
            ]);
            setParcels(parcelsRes.data);
            setRoutes(routesRes.data);
            setTrucks(trucksRes.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch data:', err);
            setError('Failed to load operations data');
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedParcel || !selectedTruckID) return;
        setAssigning(true);
        try {
            await axios.post(`${API_BASE_URL}/assignParcel`, {
                parcelID: selectedParcel.parcelID,
                truckID: selectedTruckID
            });
            setAssignMsg({ type: 'success', text: 'Assignment confirmed!' });

            // Refresh data
            fetchAllData();

            // Clear selection after short delay
            setTimeout(() => {
                setSelectedParcel(null);
                setAssignMsg(null);
            }, 1500);
        } catch (err) {
            console.error(err);
            setAssignMsg({ type: 'error', text: err.response?.data?.error || 'Assignment failed' });
        } finally {
            setAssigning(false);
        }
    };

    const filteredParcels = parcels.filter(p => {
        if (filter === 'all') return true;
        if (filter === 'assigned') return p.assignedTruckID;
        if (filter === 'unassigned') return !p.assignedTruckID;
        return true;
    });

    // Guided Assignment Logic
    const compatibleRoutes = selectedParcel
        ? routes.filter(r => r.stops.includes(selectedParcel.destination))
        : [];

    const compatibleTrucks = selectedRouteID
        ? trucks.filter(t => t.routeID === selectedRouteID)
        : [];

    // AI Context Utility
    const getCurrentOperationContext = () => {
        return {
            selectedParcel,
            compatibleRoutes,
            compatibleTrucks,
            selectionState: {
                routeID: selectedRouteID,
                truckID: selectedTruckID
            }
        };
    };

    // Expose context for AI Agent
    useEffect(() => {
        window.getCurrentOperationContext = getCurrentOperationContext;
        return () => {
            delete window.getCurrentOperationContext;
        };
    }, [selectedParcel, compatibleRoutes, compatibleTrucks, selectedRouteID, selectedTruckID]);

    if (loading) return <div style={{ padding: '2rem' }}>Loading Operations...</div>;
    if (error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;

    const filterBtnStyle = (active) => ({
        padding: '6px 16px',
        borderRadius: '6px', // Slightly squarer for "systems" feel
        border: active ? '1px solid #2563eb' : '1px solid #e5e7eb',
        backgroundColor: active ? '#2563eb' : '#fff',
        color: active ? '#fff' : '#6b7280',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: '500',
        transition: 'all 0.1s'
    });

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 100px)', gap: '1.5rem', paddingBottom: '1rem' }}>
            {/* Left Panel: Parcels List (Dominant) */}
            <div style={{
                flex: '2', // Takes up 2/3 space
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0', // Removing padding for flush table
                backgroundColor: 'var(--bg-card)',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    borderBottom: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Incoming Parcels</h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setFilter('all')} style={filterBtnStyle(filter === 'all')}>All</button>
                        <button onClick={() => setFilter('unassigned')} style={filterBtnStyle(filter === 'unassigned')}>Unassigned</button>
                        <button onClick={() => setFilter('assigned')} style={filterBtnStyle(filter === 'assigned')}>Assigned</button>
                    </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-card)', zIndex: 10 }}>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <th style={{ padding: '1rem' }}>ID</th>
                            <th style={{ padding: '1rem' }}>Destination</th>
                            <th style={{ padding: '1rem' }}>Weight</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            <th style={{ padding: '1rem' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredParcels.map(parcel => {
                            const isSelected = selectedParcel?.parcelID === parcel.parcelID;
                            return (
                                <tr
                                    key={parcel.parcelID}
                                    onClick={() => setSelectedParcel(parcel)}
                                    style={{
                                        borderBottom: '1px solid var(--border-color)',
                                        backgroundColor: isSelected ? 'var(--bg-secondary)' : 'transparent',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.1s'
                                    }}
                                >
                                    <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                        {parcel.parcelID}
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{parcel.destination}</td>
                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{parcel.weight} kg</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '9999px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            backgroundColor: parcel.assignedTruckID ? '#f3f4f6' : '#eff6ff',
                                            color: parcel.assignedTruckID ? '#4b5563' : '#2563eb', // Gray vs Blue
                                            border: `1px solid ${parcel.assignedTruckID ? '#e5e7eb' : '#bfdbfe'}`
                                        }}>
                                            <span style={{
                                                width: '6px', height: '6px', borderRadius: '50%',
                                                backgroundColor: parcel.assignedTruckID ? '#9ca3af' : '#3b82f6'
                                            }}></span>
                                            {parcel.assignedTruckID ? 'Assigned' : 'Unassigned'}
                                        </span>
                                        {parcel.assignedTruckID && <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px', marginLeft: '4px' }}>🚛 {parcel.assignedTruckID}</div>}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {parcel.assignedTruckID ? (
                                            <span style={{ fontSize: '0.85rem', color: '#d1d5db', cursor: 'default' }}>View</span>
                                        ) : (
                                            <button onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedParcel(parcel);
                                            }} style={{
                                                padding: '6px 12px',
                                                borderRadius: '4px',
                                                border: 'none',
                                                backgroundColor: '#2563eb',
                                                color: '#fff',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                            }}>
                                                Assign
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredParcels.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    {filter === 'unassigned' ? 'Nothing in the queue! 🎉' : 'No parcels found.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Right Panel: Guided Operations (Secondary) */}
            <div style={{
                flex: '1', // 1/3 space
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-card)',
                padding: '0', // Full bleed
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                boxShadow: 'var(--shadow-sm)'
            }}>
                {selectedParcel ? (
                    <>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                            <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                                Parcel Inspector
                            </h2>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                {selectedParcel.parcelID}
                            </div>
                        </div>

                        <div style={{ padding: '1.5rem' }}>
                            {/* Parcel Summary */}
                            <div style={{
                                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem',
                                paddingBottom: '1.5rem', marginBottom: '1.5rem',
                                borderBottom: '1px dash var(--border-color)'
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Destination</div>
                                    <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text-primary)' }}>{selectedParcel.destination}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Weight</div>
                                    <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text-primary)' }}>{selectedParcel.weight} <span style={{ fontSize: '0.8em', fontWeight: 'normal' }}>kg</span></div>
                                </div>
                            </div>

                            {assignMsg && (
                                <div style={{
                                    padding: '0.75rem', marginBottom: '1.5rem', borderRadius: '4px',
                                    backgroundColor: assignMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
                                    color: assignMsg.type === 'success' ? '#166534' : '#991b1b',
                                    border: `1px solid ${assignMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                                    fontSize: '0.9rem'
                                }}>
                                    {assignMsg.type === 'success' ? '✅' : '❌'} {assignMsg.text}
                                </div>
                            )}

                            {!selectedParcel.assignedTruckID ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Assignment Workflow</h3>

                                    {/* Step 1: Select Route */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                            1. Select Route
                                        </label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {compatibleRoutes.length > 0 ? compatibleRoutes.map(route => (
                                                <div
                                                    key={route.routeID}
                                                    onClick={() => {
                                                        setSelectedRouteID(route.routeID);
                                                        setSelectedTruckID(''); // Reset truck on route change
                                                    }}
                                                    style={{
                                                        padding: '12px',
                                                        border: `1px solid ${selectedRouteID === route.routeID ? '#2563eb' : '#e5e7eb'}`,
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        backgroundColor: selectedRouteID === route.routeID ? '#eff6ff' : '#fff',
                                                        transition: 'all 0.1s'
                                                    }}
                                                >
                                                    <div style={{ fontWeight: '600', fontSize: '0.95rem', color: selectedRouteID === route.routeID ? '#1e40af' : '#374151' }}>
                                                        {route.routeID}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' }}>
                                                        Via: {route.stops.join(', ')}
                                                    </div>
                                                </div>
                                            )) : (
                                                <div style={{ padding: '0.75rem', backgroundColor: '#f9fafb', color: '#6b7280', borderRadius: '6px', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                                    No compatible routes found.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Step 2: Select Truck */}
                                    <div style={{ opacity: selectedRouteID ? 1 : 0.4, pointerEvents: selectedRouteID ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: '#374151' }}>
                                            2. Select Truck
                                        </label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                                            {compatibleTrucks.map(truck => {
                                                const currentLoad = truck.currentLoad || 0;
                                                const remaining = truck.maxCapacity - currentLoad;
                                                const canFit = remaining >= selectedParcel.weight;

                                                return (
                                                    <div
                                                        key={truck.truckID}
                                                        onClick={() => canFit && setSelectedTruckID(truck.truckID)}
                                                        style={{
                                                            padding: '12px',
                                                            border: `1px solid ${selectedTruckID === truck.truckID ? '#166534' : canFit ? '#e5e7eb' : '#f3f4f6'}`,
                                                            borderRadius: '6px',
                                                            cursor: canFit ? 'pointer' : 'default',
                                                            backgroundColor: selectedTruckID === truck.truckID ? '#f0fdf4' : canFit ? '#fff' : '#f9fafb',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        <div>
                                                            <div style={{ fontWeight: '600', fontSize: '0.95rem', color: canFit ? '#374151' : '#9ca3af' }}>{truck.truckID}</div>
                                                            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                                                Load: {currentLoad}/{truck.maxCapacity} kg
                                                            </div>
                                                        </div>
                                                        {selectedTruckID === truck.truckID && <div style={{ color: '#166534' }}>Currently Selected</div>}
                                                    </div>
                                                );
                                            })}
                                            {compatibleTrucks.length === 0 && selectedRouteID && (
                                                <div style={{ padding: '0.75rem', backgroundColor: '#f9fafb', color: '#6b7280', borderRadius: '6px', fontSize: '0.9rem' }}>
                                                    No trucks on this route.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Step 3: Confirm */}
                                    <div style={{ opacity: selectedTruckID ? 1 : 0.4, pointerEvents: selectedTruckID ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
                                        <button
                                            onClick={handleAssign}
                                            disabled={assigning}
                                            style={{
                                                width: '100%',
                                                padding: '1rem',
                                                backgroundColor: '#2563eb',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontSize: '1rem',
                                                fontWeight: '600',
                                                cursor: assigning ? 'wait' : 'pointer',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            {assigning ? 'Confirming...' : 'Confirm Assignment'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6b7280' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>✅</div>
                                    <h3 style={{ color: '#111827', margin: '0 0 0.5rem 0' }}>All Set!</h3>
                                    <p style={{ margin: 0 }}>Assigned to <strong>{selectedParcel.assignedTruckID}</strong></p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#9ca3af',
                        textAlign: 'center',
                        flexDirection: 'column',
                        gap: '1rem',
                        padding: '2rem'
                    }}>
                        <div style={{ fontSize: '3rem', opacity: 0.1 }}>📦</div>
                        <div>
                            <h3 style={{ color: '#374151', margin: '0 0 0.5rem 0' }}>No Selection</h3>
                            <p style={{ margin: 0, fontSize: '0.9rem' }}>Select a parcel to view details.</p>
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default OperationsPage;
