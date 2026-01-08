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
        } catch (error) {
            console.error('Error adding parcel:', error);
            alert(error.response?.data?.error || 'Failed to add parcel');
        }
    };

    return (
        <div>
            <h2>Parcels Inventory</h2>

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
                        placeholder="Weight"
                        value={formData.weight}
                        onChange={handleChange}
                        required
                    />
                    <button type="submit" disabled={!formData.parcelID || !formData.destination || !formData.weight}>
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
                        </tr>
                    </thead>
                    <tbody>
                        {parcels.map(p => (
                            <tr key={p.parcelID}>
                                <td>{p.parcelID}</td>
                                <td>{p.destination}</td>
                                <td>{p.weight}</td>
                            </tr>
                        ))}
                        {parcels.length === 0 && (
                            <tr>
                                <td colSpan="3" style={{ textAlign: 'center' }}>No parcels found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>
        </div>
    );
};

export default ParcelsPage;
