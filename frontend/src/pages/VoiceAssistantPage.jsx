import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

const VoiceAssistantPage = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState([
        { sender: 'ai', text: 'Hello. I am the Zudu Logistics Assistant. How can I help you today?' }
    ]);
    const [lastAction, setLastAction] = useState(null);
    const [pendingAssignment, setPendingAssignment] = useState(null);
    const recognitionRef = useRef(null);

    useEffect(() => {
        // Initialize Speech Recognition
        if ('webkitSpeechRecognition' in window) {
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'en-US';
            recognition.interimResults = false;

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);

            recognition.onresult = (event) => {
                const text = event.results[0][0].transcript;
                handleUserSpeech(text);
            };

            recognitionRef.current = recognition;
        } else {
            setTranscript(prev => [...prev, { sender: 'system', text: 'Error: Web Speech API not supported in this browser.' }]);
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
        }
    };

    const addToTranscript = (sender, text) => {
        setTranscript(prev => [...prev, { sender, text }]);
    };

    const executeAssignment = async (pID, tID) => {
        addToTranscript('ai', `Executing assignment...`);
        try {
            const res = await axios.post(`${API_BASE_URL}/assignParcel`, { parcelID: pID, truckID: tID });
            setLastAction({ tool: 'assignParcel', result: res.data });

            const msg = `Confirmed. Parcel ${pID} has been successfully assigned to Truck ${tID}.`;
            addToTranscript('ai', msg);
            speak(msg);
        } catch (err) {
            console.error(err);
            setLastAction({ tool: 'assignParcel', result: err.response?.data || err.message });

            // Translate error
            const errorMsg = err.response?.data?.error || 'Unknown error occurred.';
            const msg = `Assignment failed. ${errorMsg}`;
            addToTranscript('ai', msg);
            speak(msg);
        }
        setPendingAssignment(null);
    };

    const handleUserSpeech = async (text) => {
        addToTranscript('user', text);
        const lowerText = text.toLowerCase();

        // --- 1. Pending Confirmation Gate ---
        if (pendingAssignment) {
            if (lowerText.includes('yes') || lowerText.includes('confirm') || lowerText.includes('proceed')) {
                await executeAssignment(pendingAssignment.parcelID, pendingAssignment.truckID);
            } else {
                const msg = "Assignment cancelled. What would you like to do next?";
                addToTranscript('ai', msg);
                speak(msg);
                setPendingAssignment(null);
            }
            return;
        }

        // --- 2. System Status ---
        if (lowerText.includes('status') || lowerText.includes('system')) {
            addToTranscript('ai', 'Checking system status...');
            try {
                const res = await axios.get(`${API_BASE_URL}/status`);
                setLastAction({ tool: 'getSystemStatus', result: res.data });

                const { totalRoutes, totalTrucks, activeAlerts } = res.data;
                const responseText = `The system is running with ${totalRoutes} routes and ${totalTrucks} trucks. There are ${activeAlerts} active alerts.`;
                addToTranscript('ai', responseText);
                speak(responseText);
            } catch (err) {
                console.error(err);
                addToTranscript('ai', 'Failed to fetch status.');
            }
            return;
        }

        // --- 3. Alerts ---
        if (lowerText.includes('alert') || lowerText.includes('problem')) {
            addToTranscript('ai', 'Fetching alerts...');
            try {
                const res = await axios.get(`${API_BASE_URL}/alerts`);
                setLastAction({ tool: 'getAlerts', result: res.data });

                const count = res.data.length;
                const critical = res.data.filter(a => a.severity === 'SL-1').length;
                const responseText = `Found ${count} alerts. ${critical} are critical (SL-1).`;
                addToTranscript('ai', responseText);
                speak(responseText);
            } catch (err) {
                console.error(err);
                addToTranscript('ai', 'Failed to fetch alerts.');
            }
            return;
        }

        // --- 4. Assignment Request (Regex) ---
        // Pattern: "Assign parcel [P] to truck [T]"
        // We strip punctuation for better matching (but keep underscores for IDs)
        const cleanText = text.replace(/[.,/#!$%^&*;:{}=\-`~()]/g, "");
        const assignMatch = cleanText.match(/assign parcel\s+(\S+)\s+to truck\s+(\S+)/i);

        if (assignMatch) {
            const [_, pID, tID] = assignMatch;
            const confirmMsg = `Confirm assigning parcel ${pID} to truck ${tID}. Shall I proceed?`;

            setPendingAssignment({ parcelID: pID, truckID: tID });
            addToTranscript('ai', confirmMsg);
            speak(confirmMsg);
            return;
        }

        // --- 5. Fallback ---
        const fallback = "I didn't quite catch that. You can ask for 'System Status', 'Alerts', or say 'Assign parcel X to truck Y'.";
        addToTranscript('ai', fallback);
        speak(fallback);
    };

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '2rem', height: '80vh' }}>

            {/* Left Panel: Conversation */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid #ddd', borderRadius: '8px', padding: '1rem', backgroundColor: '#fff' }}>
                <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Conversation</h2>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
                    {transcript.map((msg, idx) => (
                        <div key={idx} style={{
                            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                            backgroundColor: msg.sender === 'user' ? '#007bff' : '#f0f0f0',
                            color: msg.sender === 'user' ? '#fff' : '#333',
                            padding: '0.8rem 1.2rem',
                            borderRadius: '16px',
                            maxWidth: '70%'
                        }}>
                            <strong>{msg.sender === 'user' ? 'You' : 'Zudu'}:</strong> {msg.text}
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                    <button
                        onClick={toggleListening}
                        style={{
                            padding: '1rem 2rem',
                            borderRadius: '50px',
                            border: 'none',
                            backgroundColor: isListening ? '#dc3545' : '#28a745',
                            color: '#fff',
                            fontSize: '1.2rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {isListening ? '🛑 Stop Listening' : '🎤 Start Listening'}
                    </button>
                </div>

                {/* Debug Input for Testing */}
                <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                    <input
                        type="text"
                        id="debug-voice-input"
                        placeholder="Type voice command..."
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleUserSpeech(e.target.value);
                                e.target.value = '';
                            }
                        }}
                        style={{ width: '100%', padding: '0.5rem' }}
                    />
                    <small style={{ color: '#999' }}>Debug: Type and hit Enter to simulate voice.</small>
                </div>
            </div>

            {/* Right Panel: Action Log */}
            <div style={{ flex: 1, border: '1px solid #ddd', borderRadius: '8px', padding: '1rem', backgroundColor: '#f8f9fa', overflowY: 'auto' }}>
                <h2 style={{ borderBottom: '1px solid #ddd', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Backend Action Log</h2>

                {lastAction ? (
                    <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #ccc' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#6610f2' }}>Tool: {lastAction.tool}</h4>
                        <pre style={{ overflowX: 'auto', fontSize: '0.9rem' }}>
                            {JSON.stringify(lastAction.result, null, 2)}
                        </pre>
                    </div>
                ) : (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>No actions executed yet.</p>
                )}
            </div>

        </div>
    );
};

export default VoiceAssistantPage;
