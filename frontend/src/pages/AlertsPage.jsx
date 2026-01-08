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

    const getSeverityStyle = (severity) => {
        switch (severity) {
            case 'SL-1': return { backgroundColor: '#ffcccc', color: '#cc0000' }; // Red
            case 'SL-2': return { backgroundColor: '#ffe5cc', color: '#cc6600' }; // Orange
            case 'SL-3': return { backgroundColor: '#f2f2f2', color: '#666666' }; // Gray
            default: return {};
        }
    };

    return (
        <div>
            <h2>System Alerts</h2>
            <button onClick={fetchAlerts} style={{ marginBottom: '1rem' }}>Refresh Alerts</button>

            <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Severity</th>
                        <th>Message</th>
                        <th>Related Parcel</th>
                        <th>Related Truck</th>
                        <th>Alert ID</th>
                    </tr>
                </thead>
                <tbody>
                    {alerts.slice().reverse().map(alert => (
                        <tr key={alert.alertID} style={getSeverityStyle(alert.severity)}>
                            <td>{new Date(alert.timestamp).toLocaleString()}</td>
                            <td><strong>{alert.severity}</strong></td>
                            <td>{alert.message}</td>
                            <td>{alert.parcelID || '-'}</td>
                            <td>{alert.truckID || '-'}</td>
                            <td style={{ fontSize: '0.8em', color: '#666' }}>{alert.alertID}</td>
                        </tr>
                    ))}
                    {alerts.length === 0 && (
                        <tr>
                            <td colSpan="6" style={{ textAlign: 'center' }}>No alerts recorded</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default AlertsPage;
