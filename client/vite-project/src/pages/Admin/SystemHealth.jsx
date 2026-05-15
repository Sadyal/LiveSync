import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AppContent } from '../../context/AppContext';
import { toast } from 'react-toastify';

export default function SystemHealth() {
    const { backendUrl } = useContext(AppContent);
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchHealth = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`${backendUrl}/api/health/status`, { withCredentials: true });
            setHealth(data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch system health");
            setHealth(err.response?.data || { status: 'ERROR', message: 'Could not connect to health API' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    if (loading && !health) {
        return <div className="p-6 animate-pulse text-gray-500">Diagnosing system health...</div>;
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'HEALTHY': return 'text-green-600 bg-green-100';
            case 'DEGRADED': return 'text-yellow-600 bg-yellow-100';
            case 'CRITICAL': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 mt-8">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">System Health Overview</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(health?.status)}`}>
                    {health?.status || 'UNKNOWN'}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Database Status */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Database</p>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${health?.services?.database?.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <p className="font-bold text-gray-700 capitalize">{health?.services?.database?.status}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Latency: {health?.services?.database?.latency}</p>
                </div>

                {/* Email Status */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Email Service</p>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${health?.services?.email?.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <p className="font-bold text-gray-700 capitalize">{health?.services?.email?.status}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{health?.services?.email?.error || 'All systems go'}</p>
                </div>

                {/* System Resources */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Memory Usage</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                            className={`h-2 rounded-full ${parseFloat(health?.system?.memory_usage?.usage_percent) > 80 ? 'bg-red-500' : 'bg-blue-500'}`} 
                            style={{ width: health?.system?.memory_usage?.usage_percent }}
                        ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 font-medium">{health?.system?.memory_usage?.usage_percent} utilized</p>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                    <p className="text-xs text-gray-400 uppercase">Uptime</p>
                    <p className="text-sm font-bold text-gray-700">{Math.floor(health?.uptime / 60)} mins</p>
                </div>
                <div>
                    <p className="text-xs text-gray-400 uppercase">Environment</p>
                    <p className="text-sm font-bold text-gray-700 capitalize">{health?.environment?.node_env}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-400 uppercase">Platform</p>
                    <p className="text-sm font-bold text-gray-700 capitalize">{health?.system?.platform}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-400 uppercase">Last Sync</p>
                    <p className="text-sm font-bold text-gray-700">{new Date(health?.timestamp).toLocaleTimeString()}</p>
                </div>
            </div>

            <button 
                onClick={fetchHealth}
                className="mt-6 w-full py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition text-sm font-medium"
            >
                Run Manual Diagnosis
            </button>
        </div>
    );
}
