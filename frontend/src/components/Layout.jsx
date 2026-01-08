import { Link, Outlet } from 'react-router-dom';

const Layout = () => {
    const navStyle = {
        padding: '1rem',
        borderBottom: '1px solid #ddd',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    };

    const ulStyle = {
        display: 'flex',
        listStyle: 'none',
        gap: '1.5rem',
        margin: 0,
        padding: 0
    };

    return (
        <div>
            <nav style={navStyle}>
                <h1 style={{ margin: 0 }}>TMMR</h1>
                <ul style={ulStyle}>
                    <li><Link to="/">Dashboard</Link></li>
                    <li><Link to="/routes">Routes</Link></li>
                    <li><Link to="/trucks">Trucks</Link></li>
                    <li><Link to="/parcels">Parcels</Link></li>
                    <li><Link to="/assignments">Assignments</Link></li>
                    <li><Link to="/alerts">Alerts</Link></li>
                </ul>
            </nav>
            <main style={{ padding: '0 2rem' }}>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
