import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

const AlertsPage = () => {
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/alerts`);
            setAlerts(response.data);
        } catch (error) {
            console.error('Error fetching alerts:', error);
        }
    };

    const getSeverityBadge = (severity) => {
        let style = {
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            fontWeight: 'bold',
            display: 'inline-block',
            fontSize: '0.85rem'
        };

        switch (severity) {
            case 'SL-1':
                style.backgroundColor = 'var(--severity-critical-bg)';
                style.color = 'var(--severity-critical)';
                style.border = '1px solid var(--severity-critical)';
                return <span style={style}>CRITICAL (SL-1)</span>;
            case 'SL-2':
                style.backgroundColor = 'var(--severity-warning-bg)';
                style.color = 'var(--severity-warning)';
                style.border = '1px solid var(--severity-warning)';
                return <span style={style}>HIGH (SL-2)</span>;
            case 'SL-3':
            default:
                style.backgroundColor = 'var(--severity-info-bg)';
                style.color = 'var(--severity-info)';
                style.border = '1px solid var(--severity-info)';
                return <span style={style}>INFO (SL-3)</span>;
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>System Alerts</h2>
                <button onClick={fetchAlerts} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🔄 Refresh Log
                </button>
            </div>

            <table style={{ width: '100%' }}>
                <thead>
                    <tr>
                        <th style={{ width: '180px' }}>Timestamp</th>
                        <th style={{ width: '140px' }}>Severity</th>
                        <th>Details</th>
                        <th>Source</th>
                    </tr>
                </thead>
                <tbody>
                    {alerts.slice().reverse().map(alert => (
                        <tr key={alert.alertID} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                {new Date(alert.timestamp).toLocaleString()}
                            </td>
                            <td>
                                {getSeverityBadge(alert.severity)}
                            </td>
                            <td>
                                <div style={{ fontWeight: '500' }}>{alert.message}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                    ID: {alert.alertID}
                                </div>
                            </td>
                            <td>
                                {alert.parcelID && (
                                    <div style={{ display: 'inline-block', marginRight: '0.5rem', fontSize: '0.85rem', padding: '2px 6px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
                                        📦 {alert.parcelID}
                                    </div>
                                )}
                                {alert.truckID && (
                                    <div style={{ display: 'inline-block', fontSize: '0.85rem', padding: '2px 6px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
                                        🚛 {alert.truckID}
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                    {alerts.length === 0 && (
                        <tr>
                            <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✅</div>
                                <div>No active system alerts</div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default AlertsPage;
