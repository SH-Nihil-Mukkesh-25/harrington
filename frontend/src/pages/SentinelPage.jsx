import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

const SentinelPage = () => {
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    
    // Resiliency State
    const [roadFrom, setRoadFrom] = useState('');
    const [roadTo, setRoadTo] = useState('');
    
    const scanOptimizations = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/v3/audit/optimization-proposals`);
            setProposals(res.data.proposals || []);
            setMessage(`Scan Complete. Found ${res.data.proposals?.length || 0} proposals.`);
        } catch (err) {
            setMessage('Error scanning: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const executeBatch = async () => {
        if (proposals.length === 0) return;
        setLoading(true);
        
        // Prepare Payload: Flatten proposals into assignments
        const assignments = [];
        proposals.forEach(prop => {
            if (prop.status === 'READY_TO_OPTIMIZE' && prop.parcelIds) {
                prop.parcelIds.forEach(pid => {
                    assignments.push({
                        parcelID: pid,
                        truckID: prop.proposedTruck,
                        priority: 'HIGH' // Defaulting to High for demo
                    });
                });
            }
        });

        try {
            const res = await axios.post(`${API_BASE_URL}/v3/execute-optimization`, { assignments });
            if (res.data.success) {
                setMessage(`Batch Executed! ID: ${res.data.batchId}. Success: ${res.data.results.successCount}`);
                setProposals([]); // Clear executed proposals
            }
        } catch (err) {
            if (err.response && err.response.status === 409) {
                setMessage('❌ CONFLICT: Sentinel Guard blocked a race condition.');
            } else {
                setMessage('Error executing: ' + (err.response?.data?.error || err.message));
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleRoad = async (isClosed) => {
        if (!roadFrom || !roadTo) {
            setMessage('Please specify From and To nodes.');
            return;
        }
        try {
            const res = await axios.post(`${API_BASE_URL}/v3/admin/road-status`, {
                from: roadFrom,
                to: roadTo,
                isClosed
            });
            setMessage(`Road Update: ${res.data.roadUpdate.status}. Affected Trucks: ${res.data.impactAnalysis.length}`);
        } catch (err) {
            setMessage('Road Update Failed: ' + err.message);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ borderBottom: '2px solid #333', paddingBottom: '10px' }}>🛡️ Sentinel Automation Engine</h1>
            
            {message && (
                <div style={{ 
                    padding: '10px', 
                    background: message.includes('Error') || message.includes('CONFLICT') ? '#ffebee' : '#e8f5e9',
                    marginBottom: '20px',
                    borderRadius: '4px'
                }}>
                    {message}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                
                {/* Panel 1: Auto-Mule Optimizer */}
                <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h2>🚀 Auto-Mule Optimizer</h2>
                    <p style={{ color: '#666' }}>
                        Scans pending parcels, identifies spatial clusters, and matches them to available trucks using cost-aware Dijkstra routing.
                    </p>
                    
                    <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                        <button 
                            onClick={scanOptimizations} 
                            disabled={loading}
                            style={{ 
                                padding: '10px 20px', 
                                background: '#007bff', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '4px',
                                marginRight: '10px',
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? 'Processing...' : '🔍 Scan for Optimizations'}
                        </button>

                        <button 
                            onClick={executeBatch} 
                            disabled={loading || proposals.length === 0}
                            style={{ 
                                padding: '10px 20px', 
                                background: proposals.length > 0 ? '#28a745' : '#ccc', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '4px',
                                cursor: proposals.length > 0 ? 'pointer' : 'not-allowed'
                            }}
                        >
                            ⚡ Execute Batch
                        </button>
                    </div>

                    {proposals.length > 0 ? (
                        <div style={{ display: 'grid', gap: '10px' }}>
                            {proposals.map((prop, idx) => (
                                <div key={idx} style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
                                    <div style={{ fontWeight: 'bold', color: '#333' }}>
                                        {prop.destination} Cluster 
                                        <span style={{ fontSize: '0.8em', background: '#e3f2fd', padding: '2px 6px', borderRadius: '10px', marginLeft: '10px' }}>
                                            {prop.type}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.9em', color: '#555', marginTop: '5px' }}>
                                        📦 {prop.parcelCount} Parcels | ⚖️ {prop.totalWeight}kg | 🚛 Truck: {prop.proposedTruck || 'None'}
                                    </div>
                                    <div style={{ fontSize: '0.9em', color: 'green', marginTop: '5px' }}>
                                        💰 Savings: {prop.savings}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ fontStyle: 'italic', color: '#999' }}>No active proposals. Scan to begin.</div>
                    )}
                </div>

                {/* Panel 2: Dynamic Resiliency */}
                <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', alignSelf: 'start' }}>
                    <h2>🚧 Network Resiliency</h2>
                    <p style={{ color: '#666' }}>Simulate road closures to trigger dynamic re-routing.</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                        <select 
                            value={roadFrom} 
                            onChange={e => setRoadFrom(e.target.value)}
                            style={{ padding: '8px' }}
                        >
                            <option value="">-- From Node --</option>
                            <option value="Chennai (Warehouse)">Chennai (Warehouse)</option>
                            <option value="Vellore">Vellore</option>
                            <option value="Trichy">Trichy</option>
                            <option value="Salem">Salem</option>
                            <option value="Madurai">Madurai</option>
                            <option value="Coimbatore">Coimbatore</option>
                            <option value="Tirunelveli">Tirunelveli</option>
                            <option value="Erode">Erode</option>
                        </select>
                        
                        <select 
                            value={roadTo} 
                            onChange={e => setRoadTo(e.target.value)}
                            style={{ padding: '8px' }}
                        >
                            <option value="">-- To Node --</option>
                            <option value="Chennai (Warehouse)">Chennai (Warehouse)</option>
                            <option value="Vellore">Vellore</option>
                            <option value="Trichy">Trichy</option>
                            <option value="Salem">Salem</option>
                            <option value="Madurai">Madurai</option>
                            <option value="Coimbatore">Coimbatore</option>
                            <option value="Tirunelveli">Tirunelveli</option>
                            <option value="Erode">Erode</option>
                        </select>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button 
                                onClick={() => toggleRoad(true)}
                                style={{ flex: 1, padding: '8px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                ⛔ Close Road
                            </button>
                            <button 
                                onClick={() => toggleRoad(false)}
                                style={{ flex: 1, padding: '8px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                ✅ Open Road
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SentinelPage;
