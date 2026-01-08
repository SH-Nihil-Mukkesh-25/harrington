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

    useEffect(() => {
        fetchRoutes();
    }, []);

    const fetchRoutes = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/routes`);
            setRoutes(response.data);
        } catch (error) {
            console.error('Error fetching routes:', error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                stops: formData.stops.split(',').map(s => s.trim()), // Convert string to array
                capacityLimit: Number(formData.capacityLimit)
            };
            await axios.post(`${API_BASE_URL}/routes`, payload);
            setFormData({ routeID: '', stops: '', capacityLimit: '' });
            fetchRoutes();
        } catch (error) {
            console.error('Error adding route:', error);
            alert(error.response?.data?.error || 'Failed to add route');
        }
    };

    return (
        <div>
            <h2>Routes Management</h2>

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
                        placeholder="Capacity Limit"
                        value={formData.capacityLimit}
                        onChange={handleChange}
                        required
                    />
                    <button type="submit" disabled={!formData.routeID || !formData.stops || !formData.capacityLimit}>
                        Add Route
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
                            <th>Capacity Limit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {routes.map(r => (
                            <tr key={r.routeID}>
                                <td>{r.routeID}</td>
                                <td>{Array.isArray(r.stops) ? r.stops.join(', ') : r.stops}</td>
                                <td>{r.capacityLimit}</td>
                            </tr>
                        ))}
                        {routes.length === 0 && (
                            <tr>
                                <td colSpan="3" style={{ textAlign: 'center' }}>No routes found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>
        </div>
    );
};

export default RoutesPage;
