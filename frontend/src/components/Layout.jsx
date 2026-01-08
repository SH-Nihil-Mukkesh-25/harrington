import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

const Layout = ({ user, onLogout }) => {
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

    const [showSeedModal, setShowSeedModal] = useState(false);
    const [seedingStatus, setSeedingStatus] = useState('idle'); // idle, loading, success, error

    const handleSeedConfirm = async () => {
        setSeedingStatus('loading');
        try {
            await axios.post(`${API_BASE_URL}/seed`);
            setSeedingStatus('success');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (err) {
            console.error(err);
            setSeedingStatus('error');
            setTimeout(() => setSeedingStatus('idle'), 3000);
        }
    };

    return (
        <div>
            <nav style={navStyle}>
                <h1 style={{ margin: 0, fontSize: '1.8rem', whiteSpace: 'nowrap' }}>TMMR</h1>

                {/* Navigation Links - Anchored Left */}
                <ul style={ulStyle}>
                    <li><NavLink to="/dashboard" end style={getLinkStyle}>Dashboard</NavLink></li>
                    <li><NavLink to="/dashboard/operations" style={getLinkStyle}>Operations</NavLink></li>
                    <li><NavLink to="/dashboard/assignments" style={getLinkStyle}>Assignments</NavLink></li>
                    <li><NavLink to="/dashboard/map" style={getLinkStyle}>🗺️ Map</NavLink></li>
                    <li><NavLink to="/dashboard/alerts" style={getLinkStyle}>Alerts</NavLink></li>
                    <li><NavLink to="/dashboard/workflows" style={getLinkStyle}>🧩 Workflows</NavLink></li>
                    <li><NavLink to="/dashboard/ops" style={getLinkStyle}>📊 Ops</NavLink></li>
                    <li><NavLink to="/dashboard/settings" style={getLinkStyle}>⚙️ Settings</NavLink></li>
                    <li>
                        <NavLink
                            to="/dashboard/assistant"
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
                            to="/dashboard/sentinel"
                            style={({ isActive }) => ({
                                ...getLinkStyle({ isActive }),
                                borderBottom: isActive ? '2px solid #007bff' : '2px solid transparent'
                            })}
                        >
                            🛡️ Sentinel
                        </NavLink>
                    </li>
                </ul>

                {/* User Info & Actions */}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {user && (
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            👤 {user.username}
                        </span>
                    )}
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        style={{ ...toggleStyle, marginLeft: 0 }}
                        title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {darkMode ? '☀️' : '🌙'}
                    </button>
                    {onLogout && (
                        <button
                            onClick={onLogout}
                            style={{
                                padding: '0.5rem 1rem',
                                fontSize: '0.85rem',
                                backgroundColor: '#dc2626',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            Logout
                        </button>
                    )}
                </div>
            </nav>
            <main style={{
                padding: '0 2rem',
                maxWidth: '1400px',
                margin: '0 auto'
            }}>
                <Outlet />
            </main>

            {/* HACKATHON DEMO BUTTON */}
            <button
                onClick={() => setShowSeedModal(true)}
                title="Load Demo Data (One-Click)"
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '20px',
                    zIndex: 9991, // Behind modal
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: '4px solid white',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                    fontSize: '2rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                🚀
            </button>

            {/* SEED CONFIRMATION MODAL */}
            {showSeedModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div className="card" style={{
                        width: '400px',
                        padding: '2rem',
                        textAlign: 'center',
                        position: 'relative'
                    }}>
                        <h2 style={{ marginTop: 0 }}>⚠️ Load Demo Data?</h2>

                        {seedingStatus === 'idle' && (
                            <>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                                    This will <strong>DELETE all current routes, trucks, and parcels</strong> and load a fresh test set for the demo.
                                    <br /><br />
                                    Are you sure?
                                </p>
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                    <button
                                        onClick={() => setShowSeedModal(false)}
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: 'var(--radius)',
                                            border: '1px solid var(--border-color)',
                                            backgroundColor: 'transparent',
                                            color: 'var(--text-primary)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSeedConfirm}
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: 'var(--radius)',
                                            border: 'none',
                                            backgroundColor: '#28a745',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        🚀 Yes, Load Data
                                    </button>
                                </div>
                            </>
                        )}

                        {seedingStatus === 'loading' && (
                            <div style={{ padding: '2rem 0' }}>
                                <div className="spinner" style={{
                                    border: '4px solid rgba(0,0,0,0.1)',
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    borderLeftColor: '#007bff',
                                    animation: 'spin 1s linear infinite',
                                    margin: '0 auto 1rem auto'
                                }}></div>
                                <p>Resetting System & Loading Data...</p>
                            </div>
                        )}

                        {seedingStatus === 'success' && (
                            <div style={{ padding: '2rem 0', color: '#28a745' }}>
                                <h3 style={{ margin: 0 }}>✅ Done!</h3>
                                <p>Refreshing page...</p>
                            </div>
                        )}

                        {seedingStatus === 'error' && (
                            <div style={{ padding: '1rem 0', color: '#dc3545' }}>
                                <h3>❌ Failed</h3>
                                <p>Could not load demo data. Make sure backend is running.</p>
                                <button
                                    onClick={() => setSeedingStatus('idle')}
                                    style={{
                                        marginTop: '1rem',
                                        padding: '0.5rem 1rem',
                                        background: '#eee',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Try Again
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default Layout;

