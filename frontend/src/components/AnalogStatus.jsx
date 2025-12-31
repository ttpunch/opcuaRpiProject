import React from 'react';
import { Activity, AlertTriangle } from 'lucide-react';

const AnalogStatus = ({ name, value, error }) => {
    return (
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-surface-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-4">
                <div className={`relative flex items-center justify-center w-12 h-12 rounded-xl ${error ? 'bg-red-500' : 'bg-blue-500'} bg-opacity-10 text-surface-900 overflow-hidden`}>
                    <div className={`absolute inset-0 ${error ? 'bg-red-500' : 'bg-blue-500'} opacity-20`} />
                    {error ? (
                        <AlertTriangle size={20} className="text-red-600" />
                    ) : (
                        <Activity size={20} className="text-blue-600" />
                    )}
                </div>
                <div>
                    <h4 className="font-bold text-surface-900 group-hover:text-primary-600 transition-colors uppercase tracking-wider text-xs">
                        {name || `Analog Input`}
                    </h4>
                    {error ? (
                        <p className="text-[10px] text-red-500 font-medium truncate max-w-[120px]" title={error}>
                            {error}
                        </p>
                    ) : (
                        <p className="text-[10px] text-surface-400 font-medium">Live Value</p>
                    )}
                </div>
            </div>

            <div className="text-right">
                <span className={`text-xl font-bold font-mono ${error ? 'text-surface-300' : 'text-surface-900'}`}>
                    {typeof value === 'number' ? value.toFixed(3) : '--'}
                </span>
                <span className="text-[10px] text-surface-400 block">Volts</span>
            </div>
        </div>
    );
};

export default AnalogStatus;
