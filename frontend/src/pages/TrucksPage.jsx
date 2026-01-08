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
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [message, setMessage] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTrucks();
    }, []);

    const fetchTrucks = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/trucks`);
            setTrucks(response.data);
        } catch (error) {
            console.error('Error fetching trucks:', error);
            showMessage('error', 'Failed to load trucks');
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
                maxCapacity: Number(formData.maxCapacity)
            };
            await axios.post(`${API_BASE_URL}/trucks`, payload);
            setFormData({ truckID: '', routeID: '', maxCapacity: '' });
            fetchTrucks();
            showMessage('success', 'Truck added successfully');
        } catch (error) {
            console.error('Error adding truck:', error);
            showMessage('error', error.response?.data?.error || 'Failed to add truck');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (truckID) => {
        try {
            await axios.delete(`${API_BASE_URL}/trucks/${truckID}`);
            setDeleteConfirm(null);
            fetchTrucks();
            showMessage('success', `Truck '${truckID}' deleted successfully`);
        } catch (error) {
            setDeleteConfirm(null);
            showMessage('error', error.response?.data?.error || 'Failed to delete truck');
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
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Trucks...</div>;
    }

    return (
        <div>
            <h2>Trucks Fleet</h2>

            {message && <div style={msgStyle}>{message.text}</div>}

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
                        min="1"
                        placeholder="Truck Max Capacity"
                        value={formData.maxCapacity}
                        onChange={handleChange}
                        required
                    />
                    <button
                        type="submit"
                        disabled={submitting || !formData.truckID || !formData.routeID || !formData.maxCapacity || Number(formData.maxCapacity) <= 0}
                        style={{ opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
                    >
                        {submitting ? 'Adding...' : 'Add Truck'}
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
                            <th>Truck Max Capacity</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trucks.map(t => (
                            <tr key={t.truckID}>
                                <td>{t.truckID}</td>
                                <td>{t.routeID}</td>
                                <td>{t.maxCapacity}</td>
                                <td>
                                    {deleteConfirm === t.truckID ? (
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.9rem' }}>Delete?</span>
                                            <button
                                                onClick={() => handleDelete(t.truckID)}
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
                                            onClick={() => setDeleteConfirm(t.truckID)}
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
                        {trucks.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center' }}>No trucks found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>
        </div>
    );
};

export default TrucksPage;
