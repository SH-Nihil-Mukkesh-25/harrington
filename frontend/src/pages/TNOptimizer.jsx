import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

function TNOptimizer() {
    const [auditData, setAuditData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAudit();
    }, []);

    const fetchAudit = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/tn-optimizer/audit`);
            setAuditData(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch audit data", err);
            setError("Could not load optimization audit.");
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-white">Loading Sentinel Engine...</div>;
    if (error) return <div className="p-8 text-red-500">{error}</div>;

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-6 font-sans">
            <header className="mb-8 border-b border-slate-700 pb-4">
                <h1 className="text-3xl font-bold text-emerald-400 tracking-tight">
                    TAMIL NADU SENTINEL OPTIMIZER <span className="text-sm font-normal text-slate-400 ml-2">(Audit Mode)</span>
                </h1>
                <p className="text-slate-400 mt-2">
                    Build2Break Hackathon Edition • <span className="text-yellow-400">Phase 1: Audit Only</span>
                </p>
            </header>

            {auditData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-lg">
                        <div className="text-slate-400 text-sm uppercase tracking-wider">Pending Parcels</div>
                        <div className="text-4xl font-bold text-white mt-1">{auditData.parcelCount}</div>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-lg">
                        <div className="text-slate-400 text-sm uppercase tracking-wider">Potential Savings</div>
                        <div className="text-4xl font-bold text-emerald-400 mt-1">₹{auditData.totalSavings.toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-lg">
                        <div className="text-slate-400 text-sm uppercase tracking-wider">System Status</div>
                        <div className="text-xl font-bold text-yellow-400 mt-2">AUDIT ACTIVE</div>
                        <div className="text-xs text-slate-500 mt-1">No automated dispatch allowed</div>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                <h2 className="text-xl font-semibold text-slate-200">Optimization Recommendations</h2>
                
                {auditData?.recommendations?.map((rec, idx) => (
                    <div key={idx} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-md">
                        <div className="p-4 bg-slate-800/50 border-b border-slate-700 flex justify-between items-center">
                            <span className="font-mono text-emerald-400 font-bold">OPTIMIZATION #{idx + 1}</span>
                            {rec.savings.amount > 0 && (
                                <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-sm font-medium border border-emerald-500/20">
                                    Saves ₹{rec.savings.amount.toLocaleString()}
                                </span>
                            )}
                        </div>
                        
                        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-slate-400 uppercase text-xs font-bold mb-3 tracking-wider">Cluster Details</h3>
                                <div className="space-y-2">
                                    {rec.parcels.map(p => (
                                        <div key={p.id} className="flex justify-between items-center bg-slate-900/50 p-3 rounded border border-slate-700/50">
                                            <div className="flex items-center gap-3">
                                                <span className="text-slate-300 font-mono text-sm">{p.id}</span>
                                                <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300">{p.destination}</span>
                                            </div>
                                            <span className="text-slate-500 text-sm">{p.weight} kg</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between text-sm">
                                    <span className="text-slate-400">Total Weight:</span>
                                    <span className="text-white font-medium">{rec.parcels.reduce((s, p) => s + p.weight, 0)} kg</span>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-slate-400 uppercase text-xs font-bold mb-3 tracking-wider">Recommended Logistics</h3>
                                
                                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50 space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1">🚚</div>
                                        <div>
                                            <div className="text-white font-medium">Metric: Best Fit Vehicle</div>
                                            <div className="text-emerald-400 font-mono text-lg">{rec.recommendedTruck.id} <span className="text-sm text-slate-400">({rec.recommendedTruck.type})</span></div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1">🛣️</div>
                                        <div>
                                            <div className="text-white font-medium">Optimized Route (Dijkstra)</div>
                                            <div className="text-slate-300 text-sm mt-1">
                                                {rec.route.path.join(' → ')}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">Total Distance: {rec.route.totalDistance} km</div>
                                        </div>
                                    </div>

                                    {rec.savings.amount > 0 && (
                                        <div className="flex items-start gap-4">
                                            <div className="mt-1">💰</div>
                                            <div>
                                                <div className="text-white font-medium">Sentinel Analysis</div>
                                                <div className="text-emerald-300 text-sm italic">"{rec.savings.details}"</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 flex gap-3">
                                    <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors shadow-lg shadow-emerald-900/20">
                                        PREVIEW ROUTE
                                    </button>
                                    <button className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded text-sm font-medium transition-colors">
                                        CONFIRM CLUSTER
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <footer className="mt-12 text-center text-slate-600 text-xs py-8 border-t border-slate-800">
                SENTINEL V1.0 • POWERED BY TAMIL NADU LOGISTICS GRAPH • BUILD2BREAK 2026
            </footer>
        </div>
    );
}

export default TNOptimizer;
