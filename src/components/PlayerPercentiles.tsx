'use client';

import { useState } from 'react';

type PercentilesProps = {
    percentiles: {
        league: {
            scoring: number;
            rebounding: number;
            playmaking: number;
            efficiency: number;
            ft_shooting: number;
            defense_steals: number;
            defense_blocks: number;
        };
        position: {
            scoring: number;
            rebounding: number;
            playmaking: number;
            efficiency: number;
            ft_shooting: number;
            defense_steals: number;
            defense_blocks: number;
        };
    };
    values: {
        ppg: string;
        rpg: string;
        apg: string;
        fg_pct: string;
        ft_pct: string;
        spg: string;
        bpg: string;
    };
    position: string;
};

function PercentileBarSVG({ label, percentile, value }: { label: string; percentile: number; value: string }) {
    const getColor = (pct: number) => {
        if (pct >= 80) return '#ef4444';
        if (pct >= 60) return '#fb923c';
        if (pct >= 40) return '#d1d5db';
        if (pct >= 20) return '#93c5fd';
        return '#3b82f6';
    };

    const barColor = getColor(percentile);
    const barWidth = percentile * 4;

    return (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <span className="text-sm text-gray-600">{value}</span>
            </div>
            <div className="relative">
                <svg width="100%" height="32" className="overflow-visible">
                    <rect x="0" y="8" width="400" height="16" fill="#f3f4f6" rx="8" />
                    <rect x="0" y="8" width={barWidth} height="16" fill={barColor} rx="8">
                        <animate attributeName="width" from="0" to={barWidth} dur="0.8s" fill="freeze" />
                    </rect>
                    <circle cx={barWidth} cy="16" r="14" fill="white" stroke="#9ca3af" strokeWidth="2" />
                    <text x={barWidth} y="16" textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="bold" fill="#374151">
                        {percentile}
                    </text>
                </svg>
            </div>
        </div>
    );
}

export default function PlayerPercentiles({ percentiles, values, position }: PercentilesProps) {
    const [compareBy, setCompareBy] = useState<'league' | 'position'>('league');

    const activePercentiles = percentiles[compareBy];

    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Percentile Rankings</h2>

                {/* Toggle */}
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setCompareBy('league')}
                        className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${compareBy === 'league'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        vs NBA
                    </button>
                    <button
                        onClick={() => setCompareBy('position')}
                        className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${compareBy === 'position'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        vs {position}
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-gray-500 mb-6">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
                    <span>POOR</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#d1d5db' }}></div>
                    <span>AVERAGE</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }}></div>
                    <span>ELITE</span>
                </div>
            </div>

            {/* Offense */}
            <div className="mb-6">
                <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-3 pb-2 border-b-2 border-gray-200">
                    <span>🏀</span>
                    <span>Offense</span>
                </h3>
                <PercentileBarSVG label="Points Per Game" percentile={activePercentiles.scoring} value={values.ppg} />
                <PercentileBarSVG label="Assists Per Game" percentile={activePercentiles.playmaking} value={values.apg} />
                <PercentileBarSVG label="Rebounds Per Game" percentile={activePercentiles.rebounding} value={values.rpg} />
            </div>

            {/* Shooting */}
            <div className="mb-6">
                <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-3 pb-2 border-b-2 border-gray-200">
                    <span>🎯</span>
                    <span>Shooting</span>
                </h3>
                <PercentileBarSVG label="Field Goal %" percentile={activePercentiles.efficiency} value={values.fg_pct} />
                <PercentileBarSVG label="Free Throw %" percentile={activePercentiles.ft_shooting} value={values.ft_pct} />
            </div>

            {/* Defense */}
            <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-3 pb-2 border-b-2 border-gray-200">
                    <span>🛡️</span>
                    <span>Defense</span>
                </h3>
                <PercentileBarSVG label="Steals Per Game" percentile={activePercentiles.defense_steals} value={values.spg} />
                <PercentileBarSVG label="Blocks Per Game" percentile={activePercentiles.defense_blocks} value={values.bpg} />
            </div>
        </div>
    );
}
