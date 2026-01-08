import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

const AssignmentsPage = () => {
    const [parcels, setParcels] = useState([]);
    const [trucks, setTrucks] = useState([]);
    const [selectedParcel, setSelectedParcel] = useState('');
    const [selectedTruck, setSelectedTruck] = useState('');
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [parcelsRes, trucksRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/parcels`),
                axios.get(`${API_BASE_URL}/trucks`)
            ]);
            setParcels(parcelsRes.data);
            setTrucks(trucksRes.data);
        } catch (err) {
            console.error('Error fetching data:', err);
        }
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        setMessage(null);
        setError(null);

        if (!selectedParcel || !selectedTruck) {
            setError("Please select both a parcel and a truck.");
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/assignParcel`, {
                parcelID: selectedParcel,
                truckID: selectedTruck
            });
            setMessage(response.data.message || 'Assignment successful!');
            fetchData(); // Refresh data to update lists (though local state update might be cleaner, this ensures sync)
            setSelectedParcel('');
            setSelectedTruck('');
        } catch (err) {
            console.error('Assignment failed:', err);
            setError(err.response?.data?.error || 'Assignment failed');
        }
    };

    const assignedParcels = parcels.filter(p => p.assignedTruckId);
    const availableParcels = parcels.filter(p => !p.assignedTruckId);

    return (
        <div>
            <h2>Assignments</h2>

            <section style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd' }}>
                <h3>Assign Parcel to Truck</h3>
                {message && <div style={{ color: 'green', marginBottom: '1rem' }}>{message}</div>}
                {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

                <form onSubmit={handleAssign} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>

                    <label>
                        Select Parcel:
                        <select
                            value={selectedParcel}
                            onChange={(e) => setSelectedParcel(e.target.value)}
                            style={{ marginLeft: '1rem', width: '100%' }}
                        >
                            <option value="">-- Choose Parcel --</option>
                            {availableParcels.map(p => (
                                <option key={p.parcelID} value={p.parcelID}>
                                    {p.parcelID} (Dest: {p.destination}, W: {p.weight})
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Select Truck:
                        <select
                            value={selectedTruck}
                            onChange={(e) => setSelectedTruck(e.target.value)}
                            style={{ marginLeft: '1rem', width: '100%' }}
                        >
                            <option value="">-- Choose Truck --</option>
                            {trucks.map(t => (
                                <option key={t.truckID} value={t.truckID}>
                                    {t.truckID} (Route: {t.routeID}, Cap: {t.maxCapacity})
                                </option>
                            ))}
                        </select>
                    </label>

                    <button type="submit" style={{ padding: '0.5rem', cursor: 'pointer' }} disabled={!selectedParcel || !selectedTruck}>
                        Assign
                    </button>
                </form>
            </section>

            <section>
                <h3>Current Assignments</h3>
                <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
                    <thead>
                        <tr>
                            <th>Parcel ID</th>
                            <th>Destination</th>
                            <th>Weight</th>
                            <th>Assigned Truck</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assignedParcels.map(p => (
                            <tr key={p.parcelID}>
                                <td>{p.parcelID}</td>
                                <td>{p.destination}</td>
                                <td>{p.weight}</td>
                                <td>{p.assignedTruckId}</td>
                            </tr>
                        ))}
                        {assignedParcels.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center' }}>No assigned parcels</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>
        </div>
    );
};

export default AssignmentsPage;
