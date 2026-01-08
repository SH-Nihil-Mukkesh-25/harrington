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

    // AI Mode State
    const [aiEnabled, setAiEnabled] = useState(false);
    const [advancedMode, setAdvancedMode] = useState(false);
    const [aiWarning, setAiWarning] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Check AI availability on load
    useEffect(() => {
        const checkAIStatus = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/ai/status`);
                setAiEnabled(res.data.enabled);
            } catch (err) {
                console.error('Failed to check AI status:', err);
                setAiEnabled(false);
            }
        };
        checkAIStatus();
    }, []);

    // Handle toggle click
    const handleAdvancedModeToggle = () => {
        if (!aiEnabled) {
            setAiWarning('Advanced AI is unavailable. API key not configured.');
            setAdvancedMode(false);
            setTimeout(() => setAiWarning(''), 5000);
            return;
        }
        setAdvancedMode(!advancedMode);
        setAiWarning('');
    };

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

    // =============================================
    // BASIC MODE: Static voice command handling
    // =============================================
    const handleBasicMode = async (text) => {
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

    // =============================================
    // ADVANCED MODE: AI Agent with Gemini
    // =============================================
    const handleAIAgentMode = async (text) => {
        addToTranscript('ai', '🤖 Processing with Advanced AI...');

        try {
            const res = await axios.post(`${API_BASE_URL}/ai/agent`, {
                message: text,
                history: transcript.slice(-10) // Send last 10 messages for context
            }, {
                timeout: 30000 // 30 second timeout
            });

            const { response, toolCalls } = res.data;

            // Display AI response
            if (response) {
                addToTranscript('ai', response);
                speak(response);
            }

            // Execute any tool calls returned by the AI
            if (toolCalls && Array.isArray(toolCalls)) {
                for (const toolCall of toolCalls) {
                    await executeToolCall(toolCall);
                }
            }

            setLastAction({ tool: 'aiAgent', result: res.data });
        } catch (err) {
            console.error('AI Agent error:', err);

            // Safe fallback: disable AI mode and switch to basic
            const fallbackMsg = 'AI temporarily unavailable. Switching to basic mode.';
            addToTranscript('ai', `⚠️ ${fallbackMsg}`);
            speak(fallbackMsg);

            // Auto-disable AI toggle (no infinite retries)
            setAdvancedMode(false);

            // Process with basic mode instead
            await handleBasicMode(text);
        }
    };

    // Execute tool calls from AI agent
    const executeToolCall = async (toolCall) => {
        const { name, args } = toolCall;
        addToTranscript('ai', `🔧 Executing: ${name}...`);

        try {
            switch (name) {
                case 'getSystemStatus': {
                    const res = await axios.get(`${API_BASE_URL}/status`);
                    setLastAction({ tool: 'getSystemStatus', result: res.data });
                    const { totalRoutes, totalTrucks, activeAlerts } = res.data;
                    addToTranscript('ai', `📊 Status: ${totalRoutes} routes, ${totalTrucks} trucks, ${activeAlerts} alerts`);
                    break;
                }

                case 'getAlerts': {
                    const res = await axios.get(`${API_BASE_URL}/alerts`);
                    setLastAction({ tool: 'getAlerts', result: res.data });
                    const count = res.data.length;
                    addToTranscript('ai', `🚨 Found ${count} alert(s)`);
                    break;
                }

                case 'listRoutes': {
                    const res = await axios.get(`${API_BASE_URL}/routes`);
                    setLastAction({ tool: 'listRoutes', result: res.data });
                    addToTranscript('ai', `📍 Found ${res.data.length} route(s)`);
                    break;
                }

                case 'listTrucks': {
                    const res = await axios.get(`${API_BASE_URL}/trucks`);
                    setLastAction({ tool: 'listTrucks', result: res.data });
                    addToTranscript('ai', `🚚 Found ${res.data.length} truck(s)`);
                    break;
                }

                case 'listParcels': {
                    const res = await axios.get(`${API_BASE_URL}/parcels`);
                    setLastAction({ tool: 'listParcels', result: res.data });
                    addToTranscript('ai', `📦 Found ${res.data.length} parcel(s)`);
                    break;
                }

                case 'createParcel': {
                    if (args?.parcelID && args?.destination && args?.weight) {
                        const res = await axios.post(`${API_BASE_URL}/parcels`, {
                            parcelID: args.parcelID,
                            destination: args.destination,
                            weight: Number(args.weight)
                        });
                        setLastAction({ tool: 'createParcel', result: res.data });
                        addToTranscript('ai', `✅ Parcel ${args.parcelID} created → ${args.destination} (${args.weight}kg)`);
                    }
                    break;
                }

                case 'createTruck': {
                    if (args?.truckID && args?.routeID && args?.maxCapacity) {
                        const res = await axios.post(`${API_BASE_URL}/trucks`, {
                            truckID: args.truckID,
                            routeID: args.routeID,
                            maxCapacity: Number(args.maxCapacity)
                        });
                        setLastAction({ tool: 'createTruck', result: res.data });
                        addToTranscript('ai', `✅ Truck ${args.truckID} created on route ${args.routeID}`);
                    }
                    break;
                }

                case 'createRoute': {
                    if (args?.routeID && args?.stops && args?.capacityLimit) {
                        const stopsArray = args.stops.split(',').map(s => s.trim());
                        const res = await axios.post(`${API_BASE_URL}/routes`, {
                            routeID: args.routeID,
                            stops: stopsArray,
                            capacityLimit: Number(args.capacityLimit)
                        });
                        setLastAction({ tool: 'createRoute', result: res.data });
                        addToTranscript('ai', `✅ Route ${args.routeID} created: ${stopsArray.join(' → ')}`);
                    }
                    break;
                }

                case 'assignParcel': {
                    if (args?.parcelID && args?.truckID) {
                        await executeAssignment(args.parcelID, args.truckID);
                    }
                    break;
                }

                default:
                    console.log('Unknown tool call:', name);
                    addToTranscript('ai', `⚠️ Unknown action: ${name}`);
            }
        } catch (err) {
            console.error('Tool call failed:', err);
            const errorMsg = err.response?.data?.error || err.message;
            addToTranscript('ai', `❌ ${name} failed: ${errorMsg}`);
            setLastAction({ tool: name, result: { error: errorMsg } });
        }
    };

    // =============================================
    // MAIN HANDLER: Routes to appropriate mode
    // =============================================
    const handleUserSpeech = async (text) => {
        addToTranscript('user', text);
        setIsProcessing(true);

        try {
            if (advancedMode) {
                await handleAIAgentMode(text);
            } else {
                await handleBasicMode(text);
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

            {/* AI Warning Banner */}
            {aiWarning && (
                <div style={{
                    backgroundColor: '#fef3c7',
                    border: '1px solid #f59e0b',
                    color: '#92400e',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    ⚠️ {aiWarning}
                </div>
            )}

            {/* AI Toggle Row */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                marginBottom: '1rem',
                gap: '0.75rem'
            }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Advanced AI Mode (Gemini)
                </span>
                <button
                    onClick={handleAdvancedModeToggle}
                    style={{
                        width: '48px',
                        height: '26px',
                        borderRadius: '13px',
                        border: 'none',
                        backgroundColor: advancedMode ? '#10b981' : '#d1d5db',
                        cursor: aiEnabled ? 'pointer' : 'not-allowed',
                        opacity: aiEnabled ? 1 : 0.5,
                        position: 'relative',
                        transition: 'background-color 0.2s'
                    }}
                    title={aiEnabled ? (advancedMode ? 'Disable Advanced AI' : 'Enable Advanced AI') : 'API key not configured'}
                >
                    <div style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        position: 'absolute',
                        top: '2px',
                        left: advancedMode ? '24px' : '2px',
                        transition: 'left 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }}></div>
                </button>
            </div>

            <div style={{ display: 'flex', gap: '2rem', height: '80vh' }}>

                {/* Left Panel: Conversation */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid #ddd', borderRadius: '8px', padding: '1rem', backgroundColor: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                        <h2 style={{ margin: 0 }}>Conversation</h2>
                        <span style={{
                            fontSize: '0.75rem',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            backgroundColor: advancedMode ? '#dcfce7' : '#f3f4f6',
                            color: advancedMode ? '#166534' : '#6b7280'
                        }}>
                            {advancedMode ? '🤖 Advanced AI Mode' : '📢 Basic Voice Mode'}
                        </span>
                    </div>

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

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #eee', gap: '0.5rem' }}>
                        {/* Processing Indicator */}
                        {isProcessing && (
                            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                ⏳ Processing...
                            </div>
                        )}
                        <button
                            onClick={toggleListening}
                            disabled={isProcessing}
                            style={{
                                padding: '1rem 2rem',
                                borderRadius: '50px',
                                border: 'none',
                                backgroundColor: isProcessing ? '#9ca3af' : (isListening ? '#dc3545' : '#28a745'),
                                color: '#fff',
                                fontSize: '1.2rem',
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                opacity: isProcessing ? 0.7 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            {isProcessing ? '⏳ Processing...' : (isListening ? '🛑 Stop Listening' : '🎤 Start Listening')}
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
        </div>
    );
};

export default VoiceAssistantPage;

