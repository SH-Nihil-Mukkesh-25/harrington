import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

const RoutesPage = () => {
    const [routes, setRoutes] = useState([]);
    const [formData, setFormData] = useState({
        routeID: '',
        stops: '',
        capacityLimit: ''
    });
    const [deleteConfirm, setDeleteConfirm] = useState(null); // ID of route pending delete
    const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRoutes();
    }, []);

    const fetchRoutes = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/routes`);
            setRoutes(response.data);
        } catch (error) {
            console.error('Error fetching routes:', error);
            showMessage('error', 'Failed to load routes');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                stops: formData.stops.split(',').map(s => s.trim()),
                capacityLimit: typeof formData.capacityLimit === 'string' ? parseFloat(formData.capacityLimit.replace(/kg/gi, '').trim()) : Number(formData.capacityLimit)
            };
            await axios.post(`${API_BASE_URL}/routes`, payload);
            setFormData({ routeID: '', stops: '', capacityLimit: '' });
            fetchRoutes();
            showMessage('success', 'Route added successfully');
        } catch (error) {
            console.error('Error adding route:', error);
            showMessage('error', error.response?.data?.error || 'Failed to add route');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (routeID) => {
        try {
            await axios.delete(`${API_BASE_URL}/routes/${routeID}`);
            setDeleteConfirm(null);
            fetchRoutes();
            showMessage('success', `Route '${routeID}' deleted successfully`);
        } catch (error) {
            setDeleteConfirm(null);
            showMessage('error', error.response?.data?.error || 'Failed to delete route');
        }
    };

    const msgStyle = {
        padding: '1rem',
        marginBottom: '1rem',
        borderRadius: '4px',
        backgroundColor: message?.type === 'success' ? '#d4edda' : '#f8d7da',
        color: message?.type === 'success' ? '#155724' : '#721c24',
        border: `1px solid ${message?.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
    };

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Routes...</div>;
    }

    return (
        <div>
            <h2>Routes Management</h2>

            {message && <div style={msgStyle}>{message.text}</div>}

            <section style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd' }}>
                <h3>Add New Route</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <input
                        name="routeID"
                        placeholder="Route ID"
                        value={formData.routeID}
                        onChange={handleChange}
                        required
                    />
                    <input
                        name="stops"
                        placeholder="Stops (comma separated)"
                        value={formData.stops}
                        onChange={handleChange}
                        required
                    />
                    <input
                        name="capacityLimit"
                        type="number"
                        min="1"
                        placeholder="Route Capacity Limit"
                        value={formData.capacityLimit}
                        onChange={handleChange}
                        required
                    />
                    <button
                        type="submit"
                        disabled={submitting || !formData.routeID || !formData.stops || !formData.capacityLimit || Number(formData.capacityLimit) <= 0}
                        style={{ opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
                    >
                        {submitting ? 'Adding...' : 'Add Route'}
                    </button>
                </form>
            </section>

            <section>
                <h3>Existing Routes</h3>
                <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
                    <thead>
                        <tr>
                            <th>Route ID</th>
                            <th>Stops</th>
                            <th>Route Capacity Limit</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {routes.map(r => (
                            <tr key={r.routeID}>
                                <td>{r.routeID}</td>
                                <td>
                                    {Array.isArray(r.stops)
                                        ? r.stops.join(', ')
                                        : typeof r.stops === 'string' ? r.stops : (JSON.stringify(r.stops) || '-')}
                                </td>
                                <td>{r.capacityLimit}</td>
                                <td>
                                    {deleteConfirm === r.routeID ? (
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.9rem' }}>Delete?</span>
                                            <button
                                                onClick={() => handleDelete(r.routeID)}
                                                style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', cursor: 'pointer' }}
                                            >
                                                Yes
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(null)}
                                                style={{ backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', cursor: 'pointer' }}
                                            >
                                                No
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setDeleteConfirm(r.routeID)}
                                            style={{
                                                cursor: 'pointer',
                                                backgroundColor: '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                padding: '0.4rem 0.8rem',
                                                fontSize: '1rem'
                                            }}
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {routes.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center' }}>No routes found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>
        </div>
    );
};

export default RoutesPage;
