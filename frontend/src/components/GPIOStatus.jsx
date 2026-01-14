import React from 'react';
import { Power, AlertTriangle, Info } from 'lucide-react';

const GPIOStatus = ({ name, value, error, pin }) => {
    // Logic for status colors
    let statusColor = 'bg-yellow-500'; // Default: Signal Free (Yellow)
    let statusText = 'Disconnected / Free';
    let pulseClass = '';

    if (error) {
        statusColor = 'bg-red-500';
        statusText = 'Fault / Error';
    } else if (value === 1) {
        statusColor = 'bg-emerald-500';
        statusText = 'Active / Connected';
        pulseClass = 'animate-pulse';
    }

    return (
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-surface-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-4">
                <div className={`relative flex items-center justify-center w-12 h-12 rounded-xl ${statusColor} bg-opacity-10 text-surface-900 overflow-hidden`}>
                    <div className={`absolute inset-0 ${statusColor} opacity-20 ${pulseClass}`} />
                    <Power size={20} className={error ? 'text-red-600' : value === 1 ? 'text-emerald-600' : 'text-yellow-600'} />
                </div>
                <div>
                    <h4 className="font-bold text-surface-900 group-hover:text-primary-600 transition-colors uppercase tracking-wider text-xs">
                        {name || `GPIO Pin ${pin}`}
                    </h4>
                    <p className="text-[10px] text-surface-400 font-medium">Pin: {pin} • {statusText}</p>
                </div>
            </div>

            <div className={`w-3 h-3 rounded-full ${statusColor} shadow-lg ${pulseClass}`}
                title={error || statusText} />
        </div>
    );
};

export default GPIOStatus;
