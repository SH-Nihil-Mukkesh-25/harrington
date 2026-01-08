import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

const ParcelsPage = () => {
    const [parcels, setParcels] = useState([]);
    const [formData, setFormData] = useState({
        parcelID: '',
        destination: '',
        weight: ''
    });
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchParcels();
    }, []);

    const fetchParcels = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/parcels`);
            setParcels(response.data);
        } catch (error) {
            console.error('Error fetching parcels:', error);
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
        try {
            const payload = {
                ...formData,
                weight: Number(formData.weight)
            };
            await axios.post(`${API_BASE_URL}/parcels`, payload);
            setFormData({ parcelID: '', destination: '', weight: '' });
            fetchParcels();
            showMessage('success', 'Parcel added successfully');
        } catch (error) {
            console.error('Error adding parcel:', error);
            showMessage('error', error.response?.data?.error || 'Failed to add parcel');
        }
    };

    const handleDelete = async (parcelID) => {
        try {
            await axios.delete(`${API_BASE_URL}/parcels/${parcelID}`);
            setDeleteConfirm(null);
            fetchParcels();
            showMessage('success', `Parcel '${parcelID}' deleted successfully`);
        } catch (error) {
            setDeleteConfirm(null);
            showMessage('error', error.response?.data?.error || 'Failed to delete parcel');
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

    return (
        <div>
            <h2>Parcels Inventory</h2>

            {message && <div style={msgStyle}>{message.text}</div>}

            <section style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd' }}>
                <h3>Add New Parcel</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <input
                        name="parcelID"
                        placeholder="Parcel ID"
                        value={formData.parcelID}
                        onChange={handleChange}
                        required
                    />
                    <input
                        name="destination"
                        placeholder="Destination"
                        value={formData.destination}
                        onChange={handleChange}
                        required
                    />
                    <input
                        name="weight"
                        type="number"
                        min="1"
                        placeholder="Weight"
                        value={formData.weight}
                        onChange={handleChange}
                        required
                    />
                    <button type="submit" disabled={!formData.parcelID || !formData.destination || !formData.weight || Number(formData.weight) <= 0}>
                        Add Parcel
                    </button>
                </form>
            </section>

            <section>
                <h3>Existing Parcels</h3>
                <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
                    <thead>
                        <tr>
                            <th>Parcel ID</th>
                            <th>Destination</th>
                            <th>Weight</th>
                            <th>Assigned</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {parcels.map(p => (
                            <tr key={p.parcelID}>
                                <td>{p.parcelID}</td>
                                <td>{p.destination}</td>
                                <td>{p.weight}</td>
                                <td>{p.assignedTruckId || '-'}</td>
                                <td>
                                    {p.assignedTruckId ? (
                                        <span style={{ color: '#999', fontSize: '0.9rem' }}>Assigned</span>
                                    ) : deleteConfirm === p.parcelID ? (
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.9rem' }}>Delete?</span>
                                            <button
                                                onClick={() => handleDelete(p.parcelID)}
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
                                            onClick={() => setDeleteConfirm(p.parcelID)}
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
                        {parcels.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center' }}>No parcels found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>
        </div>
    );
};

export default ParcelsPage;
