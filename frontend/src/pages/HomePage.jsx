import { Link } from 'react-router-dom';

const HomePage = () => {
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            {/* Logo / Title */}
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <div style={{
                    fontSize: '5rem',
                    fontWeight: '800',
                    letterSpacing: '-0.05em',
                    background: 'linear-gradient(135deg, #60a5fa, #34d399)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '0.5rem'
                }}>
                    TMMR
                </div>
                <div style={{
                    fontSize: '1.25rem',
                    color: '#94a3b8',
                    fontWeight: '400',
                    letterSpacing: '0.1em'
                }}>
                    Truck · Map · Monitoring · Routing
                </div>
            </div>

            {/* Tagline */}
            <p style={{
                fontSize: '1.1rem',
                color: '#cbd5e1',
                maxWidth: '500px',
                textAlign: 'center',
                lineHeight: '1.6',
                marginBottom: '2.5rem'
            }}>
                AI-powered logistics operations platform for intelligent parcel routing,
                real-time fleet monitoring, and voice-controlled management.
            </p>

            {/* CTA Button */}
            <Link to="/login" style={{
                padding: '1rem 2.5rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#0f172a',
                background: 'linear-gradient(135deg, #60a5fa, #34d399)',
                borderRadius: '9999px',
                textDecoration: 'none',
                boxShadow: '0 4px 15px rgba(96, 165, 250, 0.4)',
                transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
                Get Started →
            </Link>

            {/* Footer */}
            <div style={{
                position: 'absolute',
                bottom: '2rem',
                color: '#64748b',
                fontSize: '0.85rem'
            }}>
                © 2026 TMMR · Built for Smart Logistics
            </div>
        </div>
    );
};

export default HomePage;
