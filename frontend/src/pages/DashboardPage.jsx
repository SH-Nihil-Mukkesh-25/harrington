import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
    const [stats, setStats] = useState({
        routes: 0,
        trucks: 0,
        parcels: 0,
        alerts: 0
    });
    const [resetConfirm, setResetConfirm] = useState(false);
    const [message, setMessage] = useState(null);

    const fetchStats = async () => {
        try {
            const [routesRes, trucksRes, parcelsRes, alertsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/routes`),
                axios.get(`${API_BASE_URL}/trucks`),
                axios.get(`${API_BASE_URL}/parcels`),
                axios.get(`${API_BASE_URL}/alerts`)
            ]);

            setStats({
                routes: routesRes.data.length,
                trucks: trucksRes.data.length,
                parcels: parcelsRes.data.length,
                alerts: alertsRes.data.length
            });
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    const handleReset = async () => {
        try {
            await axios.post(`${API_BASE_URL}/reset`);
            setResetConfirm(false);
            fetchStats();
            showMessage('success', '✅ System reset successful - all data cleared');
        } catch (error) {
            setResetConfirm(false);
            showMessage('error', 'Failed to reset system: ' + (error.response?.data?.error || error.message));
        }
    };

    const cardStyle = {
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '1.5rem',
        margin: '1rem',
        minWidth: '200px',
        textAlign: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        backgroundColor: 'var(--bg-card)'
    };

    const containerStyle = {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '1rem',
        padding: '2rem'
    };

    const msgStyle = {
        padding: '1rem',
        marginBottom: '1rem',
        borderRadius: '4px',
        backgroundColor: message?.type === 'success' ? '#d4edda' : '#f8d7da',
        color: message?.type === 'success' ? '#155724' : '#721c24',
        border: `1px solid ${message?.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
        textAlign: 'center'
    };

    return (
        <div>
            <h2 style={{ textAlign: 'center' }}>Dashboard</h2>

            {message && <div style={msgStyle}>{message.text}</div>}

            <div style={containerStyle}>
                <div style={cardStyle}>
                    <h3>Routes</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.routes}</p>
                    <Link to="/routes">Manage Routes</Link>
                </div>
                <div style={cardStyle}>
                    <h3>Trucks</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.trucks}</p>
                    <Link to="/trucks">Manage Trucks</Link>
                </div>
                <div style={cardStyle}>
                    <h3>Parcels</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.parcels}</p>
                    <Link to="/parcels">Manage Parcels</Link>
                </div>
                <div style={{ ...cardStyle, border: '1px solid #ffa500' }}>
                    <h3>System Alerts</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: stats.alerts > 0 ? 'red' : 'green' }}>{stats.alerts}</p>
                    <Link to="/alerts">View Alerts</Link>
                </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <Link to="/assignments" style={{
                    padding: '1rem 2rem',
                    borderRadius: '4px',
                    background: '#007bff',
                    color: 'white',
                    textDecoration: 'none',
                    fontWeight: 'bold'
                }}>
                    Go to Assignments
                </Link>
            </div>

            {/* DEV/DEMO Reset Button */}
            <div style={{
                textAlign: 'center',
                marginTop: '3rem',
                paddingTop: '2rem',
                borderTop: '1px dashed var(--border-color)'
            }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    🛠️ DEV / DEMO ONLY
                </p>
                {resetConfirm ? (
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center' }}>
                        <span style={{ color: '#dc3545', fontWeight: 'bold' }}>⚠️ Delete ALL data?</span>
                        <button
                            onClick={handleReset}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '4px',
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Yes, Reset
                        </button>
                        <button
                            onClick={() => setResetConfirm(false)}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '4px',
                                background: '#6c757d',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setResetConfirm(true)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '4px',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        🔄 Reset System (Dev)
                    </button>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;
