import { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';

const Layout = () => {
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('tmmr-theme');
        return saved === 'dark';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
        localStorage.setItem('tmmr-theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    const navStyle = {
        padding: '1rem',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'var(--bg-secondary)'
    };

    const ulStyle = {
        display: 'flex',
        listStyle: 'none',
        gap: '1.5rem',
        margin: 0,
        padding: 0,
        alignItems: 'center'
    };

    const toggleStyle = {
        background: 'none',
        border: 'none',
        fontSize: '1.5rem',
        cursor: 'pointer',
        padding: '0.5rem'
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
                    <li><Link to="/workflows">🧩 Workflows</Link></li>
                    <li><Link to="/ops">📊 Ops</Link></li>
                    <li><Link to="/assistant" style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem' }}>🎙️ Assistant</Link></li>
                    <li>
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            style={toggleStyle}
                            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {darkMode ? '☀️' : '🌙'}
                        </button>
                    </li>
                </ul>
            </nav>
            <main style={{ padding: '0 2rem' }}>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;

