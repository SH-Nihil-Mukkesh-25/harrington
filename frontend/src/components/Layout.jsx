import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

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
        padding: '1rem 2rem', // Increased side padding
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center', // Vertically center
        backgroundColor: 'var(--bg-secondary)',
        gap: '3rem', // Fixed gap between Logo and Links
        position: 'sticky', // Make it stick!
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)' // Subtle shadow for sticky state
    };

    const ulStyle = {
        display: 'flex',
        listStyle: 'none',
        gap: '1.5rem',
        margin: 0,
        padding: 0,
        alignItems: 'center',
        flexWrap: 'wrap'
    };

    const toggleStyle = {
        background: 'none',
        border: 'none',
        fontSize: '1.5rem',
        cursor: 'pointer',
        padding: '0.5rem',
        marginLeft: 'auto' // Push to the far right
    };

    const getLinkStyle = ({ isActive }) => ({
        textDecoration: 'none',
        color: isActive ? '#007bff' : 'inherit',
        fontWeight: isActive ? 'bold' : 'normal',
        borderBottom: isActive ? '2px solid #007bff' : '2px solid transparent',
        paddingBottom: '4px',
        transition: 'all 0.2s ease'
    });

    return (
        <div>
            <nav style={navStyle}>
                <h1 style={{ margin: 0, fontSize: '1.8rem', whiteSpace: 'nowrap' }}>TMMR</h1>

                {/* Navigation Links - Anchored Left */}
                <ul style={ulStyle}>
                    <li><NavLink to="/" style={getLinkStyle}>Dashboard</NavLink></li>
                    <li><NavLink to="/routes" style={getLinkStyle}>Routes</NavLink></li>
                    <li><NavLink to="/trucks" style={getLinkStyle}>Trucks</NavLink></li>
                    <li><NavLink to="/parcels" style={getLinkStyle}>Parcels</NavLink></li>
                    <li><NavLink to="/assignments" style={getLinkStyle}>Assignments</NavLink></li>
                    <li><NavLink to="/map" style={getLinkStyle}>🗺️ Map</NavLink></li>
                    <li><NavLink to="/alerts" style={getLinkStyle}>Alerts</NavLink></li>
                    <li><NavLink to="/workflows" style={getLinkStyle}>🧩 Workflows</NavLink></li>
                    <li><NavLink to="/ops" style={getLinkStyle}>📊 Ops</NavLink></li>
                    <li>
                        <NavLink
                            to="/assistant"
                            style={({ isActive }) => ({
                                ...getLinkStyle({ isActive }),
                                borderLeft: '1px solid var(--border-color)',
                                paddingLeft: '1rem',
                                borderBottom: isActive ? '2px solid #007bff' : '2px solid transparent'
                            })}
                        >
                            🎙️ Assistant
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/sentinel"
                            style={({ isActive }) => ({
                                ...getLinkStyle({ isActive }),
                                color: isActive ? '#dc3545' : '#dc3545', // Red for Sentinel
                                fontWeight: 'bold'
                            })}
                        >
                            🛡️ Sentinel Config
                        </NavLink>
                    </li>
                </ul>

                {/* Dark Mode Toggle - Pushed Right */}
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    style={toggleStyle}
                    title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {darkMode ? '☀️' : '🌙'}
                </button>
            </nav>
            <main style={{ padding: '0 2rem' }}>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;

