import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

const OpsSummaryPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSummary();
    }, []);

    const fetchSummary = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/ops/summary`);
            setData(res.data);
        } catch (err) {
            console.error('Failed to fetch ops summary:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading ops summary...</div>;
    if (!data) return <div style={{ padding: '2rem' }}>Failed to load data.</div>;

    return (
        <div style={{ padding: '2rem' }}>
            <h1>Operations Summary</h1>
            <p style={{ color: '#666', marginBottom: '2rem' }}>Real-time operational insights and incident detection.</p>

            {/* Alert Counts */}
            <section style={sectionStyle}>
                <h2>Alert Counts</h2>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={cardStyle}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{data.totalAlerts}</div>
                        <div style={{ color: '#666' }}>Total Alerts</div>
                    </div>
                    <div style={{ ...cardStyle, borderLeft: '4px solid #dc3545' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc3545' }}>{data.alertsBySeverity['SL-1']}</div>
                        <div>SL-1 (Critical)</div>
                    </div>
                    <div style={{ ...cardStyle, borderLeft: '4px solid #ffc107' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#856404' }}>{data.alertsBySeverity['SL-2']}</div>
                        <div>SL-2 (Warning)</div>
                    </div>
                    <div style={{ ...cardStyle, borderLeft: '4px solid #6c757d' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6c757d' }}>{data.alertsBySeverity['SL-3']}</div>
                        <div>SL-3 (Info)</div>
                    </div>
                </div>
            </section>

            {/* Top Failure Reasons */}
            <section style={sectionStyle}>
                <h2>Top Failure Reasons</h2>
                {data.topFailureReasons.length === 0 ? (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>No failures recorded.</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f0f0f0' }}>
                                <th style={thStyle}>Reason</th>
                                <th style={thStyle}>Count</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.topFailureReasons.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                                    <td style={tdStyle}>{item.reason}</td>
                                    <td style={tdStyle}>{item.count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            {/* Incident Candidates */}
            <section style={sectionStyle}>
                <h2>Incident Candidates</h2>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                    Patterns occurring 3+ times within 10 minutes.
                </p>
                {data.incidentCandidates.length === 0 ? (
                    <p style={{ color: '#28a745', fontStyle: 'italic' }}>✓ No incidents detected.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {data.incidentCandidates.map((incident, idx) => (
                            <div key={idx} style={{ ...cardStyle, borderLeft: '4px solid #dc3545', backgroundColor: '#fff5f5' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{incident.reason}</div>
                                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                    <span style={{ marginRight: '1rem' }}>Count: <strong>{incident.count}</strong></span>
                                    <span>Window: {incident.timeWindowMinutes} min</span>
                                </div>
                                {incident.affectedTrucks?.length > 0 && (
                                    <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: '#555' }}>
                                        Affected Trucks: {incident.affectedTrucks.join(', ')}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

const sectionStyle = { marginBottom: '2rem' };
const cardStyle = { padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px', minWidth: '120px' };
const thStyle = { padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' };
const tdStyle = { padding: '0.75rem', textAlign: 'left' };

export default OpsSummaryPage;
