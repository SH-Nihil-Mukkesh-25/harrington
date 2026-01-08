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

    useEffect(() => {
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

        fetchStats();
    }, []);

    const cardStyle = {
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '1.5rem',
        margin: '1rem',
        minWidth: '200px',
        textAlign: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        backgroundColor: '#fff'
    };

    const containerStyle = {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '1rem',
        padding: '2rem'
    };

    return (
        <div>
            <h2 style={{ textAlign: 'center' }}>Dashboard</h2>
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
        </div>
    );
};

export default DashboardPage;
