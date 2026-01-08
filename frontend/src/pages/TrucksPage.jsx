import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

const TrucksPage = () => {
    const [trucks, setTrucks] = useState([]);
    const [formData, setFormData] = useState({
        truckID: '',
        routeID: '',
        maxCapacity: ''
    });

    useEffect(() => {
        fetchTrucks();
    }, []);

    const fetchTrucks = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/trucks`);
            setTrucks(response.data);
        } catch (error) {
            console.error('Error fetching trucks:', error);
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
                maxCapacity: Number(formData.maxCapacity)
            };
            await axios.post(`${API_BASE_URL}/trucks`, payload);
            setFormData({ truckID: '', routeID: '', maxCapacity: '' });
            fetchTrucks();
        } catch (error) {
            console.error('Error adding truck:', error);
            alert(error.response?.data?.error || 'Failed to add truck');
        }
    };

    return (
        <div>
            <h2>Trucks Fleet</h2>

            <section style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd' }}>
                <h3>Add New Truck</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <input
                        name="truckID"
                        placeholder="Truck ID"
                        value={formData.truckID}
                        onChange={handleChange}
                        required
                    />
                    <input
                        name="routeID"
                        placeholder="Route ID"
                        value={formData.routeID}
                        onChange={handleChange}
                        required
                    />
                    <input
                        name="maxCapacity"
                        type="number"
                        placeholder="Max Capacity"
                        value={formData.maxCapacity}
                        onChange={handleChange}
                        required
                    />
                    <button type="submit" disabled={!formData.truckID || !formData.routeID || !formData.maxCapacity}>
                        Add Truck
                    </button>
                </form>
            </section>

            <section>
                <h3>Existing Trucks</h3>
                <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
                    <thead>
                        <tr>
                            <th>Truck ID</th>
                            <th>Route ID</th>
                            <th>Max Capacity</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trucks.map(t => (
                            <tr key={t.truckID}>
                                <td>{t.truckID}</td>
                                <td>{t.routeID}</td>
                                <td>{t.maxCapacity}</td>
                            </tr>
                        ))}
                        {trucks.length === 0 && (
                            <tr>
                                <td colSpan="3" style={{ textAlign: 'center' }}>No trucks found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>
        </div>
    );
};

export default TrucksPage;
