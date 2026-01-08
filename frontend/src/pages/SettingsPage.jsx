import { Link } from 'react-router-dom';

const SettingsPage = () => {
    const cardStyle = {
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '1.5rem',
        textDecoration: 'none',
        color: 'inherit',
        backgroundColor: '#fff',
        transition: 'transform 0.2s, box-shadow 0.2s',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
    };

    const sectionStyle = {
        marginBottom: '2rem'
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>⚙️ Settings</h1>

            <section style={sectionStyle}>
                <h2 style={{ color: '#555', fontSize: '1.2rem', marginBottom: '1rem' }}>🏗️ Infrastructure Management</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <Link to="/routes" style={cardStyle} className="settings-card">
                        <div style={{ fontSize: '2rem' }}>🛣️</div>
                        <div style={{ fontWeight: 'bold' }}>Manage Routes</div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>Configure delivery paths and stops.</div>
                    </Link>

                    <Link to="/trucks" style={cardStyle} className="settings-card">
                        <div style={{ fontSize: '2rem' }}>🚛</div>
                        <div style={{ fontWeight: 'bold' }}>Manage Trucks</div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>Update fleet and capacities.</div>
                    </Link>

                    <Link to="/parcels" style={cardStyle} className="settings-card">
                        <div style={{ fontSize: '2rem' }}>📦</div>
                        <div style={{ fontWeight: 'bold' }}>Parcel Inventory</div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>View and modify raw parcel data.</div>
                    </Link>
                </div>
            </section>

            <style>{`
                .settings-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    border-color: #007bff !important;
                }
            `}</style>
        </div>
    );
};

export default SettingsPage;
