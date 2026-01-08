import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Hardcoded test credentials
const TEST_CREDENTIALS = {
    username: 'admin',
    password: 'tmmr2026'
};

const LoginPage = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Simulate network delay
        setTimeout(() => {
            if (username === TEST_CREDENTIALS.username && password === TEST_CREDENTIALS.password) {
                onLogin({ username });
                navigate('/dashboard');
            } else {
                setError('Wrong credentials. Please check username and password.');
            }
            setIsLoading(false);
        }, 500);
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                padding: '2.5rem',
                backgroundColor: '#fff',
                borderRadius: '16px',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)'
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        fontSize: '2.5rem',
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, #1e3a5f, #0f172a)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '0.5rem'
                    }}>
                        TMMR
                    </div>
                    <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
                        Sign in to access the dashboard
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        color: '#dc2626',
                        fontSize: '0.9rem',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        ❌ {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontWeight: '500',
                            color: '#374151',
                            fontSize: '0.9rem'
                        }}>
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                fontSize: '1rem',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontWeight: '500',
                            color: '#374151',
                            fontSize: '0.9rem'
                        }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                fontSize: '1rem',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '0.875rem',
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: '#fff',
                            backgroundColor: isLoading ? '#9ca3af' : '#1e3a5f',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: isLoading ? 'wait' : 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                {/* Test Credentials Info */}
                <div style={{
                    marginTop: '2rem',
                    padding: '1rem',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    fontSize: '0.85rem'
                }}>
                    <div style={{ fontWeight: '600', color: '#166534', marginBottom: '0.5rem' }}>
                        🧪 Test Credentials
                    </div>
                    <div style={{ color: '#15803d', fontFamily: 'monospace' }}>
                        <div>Username: <strong>admin</strong></div>
                        <div>Password: <strong>tmmr2026</strong></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
