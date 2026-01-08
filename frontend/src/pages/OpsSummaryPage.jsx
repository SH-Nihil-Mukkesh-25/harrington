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
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Real-time operational insights and incident detection.</p>

            {/* Alert Counts */}
            <section style={sectionStyle}>
                <h2>Alert Counts</h2>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ padding: '1rem', backgroundColor: 'var(--bg-card)', borderRadius: '8px', minWidth: '120px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{data.totalAlerts}</div>
                        <div style={{ color: 'var(--text-secondary)' }}>Total Alerts</div>
                    </div>
                    <div style={{ padding: '1rem', backgroundColor: 'var(--bg-card)', borderRadius: '8px', minWidth: '120px', borderLeft: '4px solid var(--severity-critical)', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--severity-critical)' }}>{data.alertsBySeverity['SL-1']}</div>
                        <div>SL-1 (Critical)</div>
                    </div>
                    <div style={{ padding: '1rem', backgroundColor: 'var(--bg-card)', borderRadius: '8px', minWidth: '120px', borderLeft: '4px solid var(--severity-warning)', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--severity-warning-text)' }}>{data.alertsBySeverity['SL-2']}</div>
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
                    <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No failures recorded.</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>Reason</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>Count</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.topFailureReasons.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                                    <td style={{ padding: '0.75rem', textAlign: 'left' }}>{item.reason}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'left' }}>{item.count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            {/* Incident Candidates */}
            <section style={sectionStyle}>
                <h2>Incident Candidates</h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Patterns occurring 3+ times within 10 minutes.
                </p>
                {data.incidentCandidates.length === 0 ? (
                    <p style={{ color: 'var(--severity-success)', fontStyle: 'italic' }}>✓ No incidents detected.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {data.incidentCandidates.map((incident, idx) => (
                            <div key={idx} style={{ padding: '1rem', backgroundColor: 'var(--severity-critical-bg)', borderRadius: '8px', minWidth: '120px', borderLeft: '4px solid var(--severity-critical)', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{incident.reason}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    <span style={{ marginRight: '1rem' }}>Count: <strong>{incident.count}</strong></span>
                                    <span>Window: {incident.timeWindowMinutes} min</span>
                                </div>
                                {incident.affectedTrucks?.length > 0 && (
                                    <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
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
