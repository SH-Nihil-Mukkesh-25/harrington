import { Link } from 'react-router-dom';

const SettingsPage = () => {
    const cardStyle = {
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '1.5rem',
        textDecoration: 'none',
        color: 'var(--text-primary)',
        backgroundColor: 'var(--bg-card)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        boxShadow: 'var(--shadow-sm)'
    };

    const sectionStyle = {
        marginBottom: '2rem'
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', color: 'var(--text-primary)' }}>⚙️ Settings</h1>

            <section style={sectionStyle}>
                <h2 style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '1rem' }}>🏗️ Infrastructure Management</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <Link to="/dashboard/routes" style={cardStyle} className="settings-card">
                        <div style={{ fontSize: '2rem' }}>🛣️</div>
                        <div style={{ fontWeight: 'bold' }}>Manage Routes</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Configure delivery paths and stops.</div>
                    </Link>

                    <Link to="/dashboard/trucks" style={cardStyle} className="settings-card">
                        <div style={{ fontSize: '2rem' }}>🚛</div>
                        <div style={{ fontWeight: 'bold' }}>Manage Trucks</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Update fleet and capacities.</div>
                    </Link>

                    <Link to="/dashboard/parcels" style={cardStyle} className="settings-card">
                        <div style={{ fontSize: '2rem' }}>📦</div>
                        <div style={{ fontWeight: 'bold' }}>Parcel Inventory</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>View and modify raw parcel data.</div>
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
