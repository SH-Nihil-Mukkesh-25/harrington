import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

const WorkflowsPage = () => {
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null);

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const fetchWorkflows = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/workflows`);
            setWorkflows(res.data);
        } catch (err) {
            console.error('Failed to fetch workflows:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = (workflowId) => {
        setExpandedRow(expandedRow === workflowId ? null : workflowId);
    };

    const StatusBadge = ({ status }) => {
        const isSuccess = status === 'COMPLETED' || status === 'SUCCESS';
        return (
            <span style={{
                padding: '0.3rem 0.8rem',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                color: '#fff',
                backgroundColor: isSuccess ? '#28a745' : '#dc3545'
            }}>
                {isSuccess ? 'SUCCESS' : 'FAILED'}
            </span>
        );
    };

    if (loading) {
        return <div style={{ padding: '2rem' }}>Loading workflows...</div>;
    }

    return (
        <div style={{ padding: '2rem' }}>
            <h1>Assignment Workflows</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Inspect assignment workflow executions and their step-by-step status.
            </p>

            {workflows.length === 0 ? (
                <div style={{
                    padding: '3rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    color: 'var(--text-secondary)'
                }}>
                    <p style={{ fontSize: '1.2rem' }}>No workflows executed yet.</p>
                    <p>Assign parcels to trucks to see execution logs here.</p>
                </div>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>Workflow ID</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>Parcel ID</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>Truck ID</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>Status</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {workflows.map(w => (
                            <React.Fragment key={w.workflowId}>
                                <tr
                                    onClick={() => toggleRow(w.workflowId)}
                                    style={{
                                        cursor: 'pointer',
                                        borderBottom: '1px solid var(--border-color)',
                                        backgroundColor: expandedRow === w.workflowId ? 'var(--bg-secondary)' : 'var(--bg-card)',
                                        color: 'var(--text-primary)'
                                    }}
                                >
                                    <td style={{ padding: '0.75rem', textAlign: 'left' }}><code>{w.workflowId}</code></td>
                                    <td style={{ padding: '0.75rem', textAlign: 'left' }}>{w.parcelID || '-'}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'left' }}>{w.truckID || '-'}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'left' }}><StatusBadge status={w.finalStatus} /></td>
                                    <td style={{ padding: '0.75rem', textAlign: 'left' }}>{new Date(w.timestamp).toLocaleString()}</td>
                                </tr>

                                {/* Expanded Row: Step Details */}
                                {expandedRow === w.workflowId && (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)' }}>
                                            <strong>Step Details:</strong>
                                            <table style={{ width: '100%', marginTop: '0.5rem', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                                                        <th style={{ padding: '0.5rem', textAlign: 'left', fontSize: '0.9rem' }}>Step Name</th>
                                                        <th style={{ padding: '0.5rem', textAlign: 'left', fontSize: '0.9rem' }}>Status</th>
                                                        <th style={{ padding: '0.5rem', textAlign: 'left', fontSize: '0.9rem' }}>Reason</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {w.steps?.map((step, idx) => (
                                                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                                                            <td style={{ padding: '0.5rem', textAlign: 'left', fontSize: '0.9rem' }}>{step.stepName}</td>
                                                            <td style={{ padding: '0.5rem', textAlign: 'left', fontSize: '0.9rem' }}>
                                                                <span style={{
                                                                    color: step.status === 'SUCCESS' ? 'var(--severity-success)' : 'var(--severity-critical)',
                                                                    fontWeight: 'bold'
                                                                }}>
                                                                    {step.status}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '0.5rem', textAlign: 'left', fontSize: '0.9rem' }}>{step.reason || '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

const thStyle = { padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' };
const tdStyle = { padding: '0.75rem', textAlign: 'left' };
const innerThStyle = { padding: '0.5rem', textAlign: 'left', fontSize: '0.9rem' };
const innerTdStyle = { padding: '0.5rem', textAlign: 'left', fontSize: '0.9rem' };

export default WorkflowsPage;
