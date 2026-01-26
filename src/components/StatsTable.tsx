'use client';

import { useState } from 'react';
import Link from 'next/link';

type PlayerStats = {
    name: string;
    team: string;
    gp: number;
    ppg: string;
    rpg: string;
    apg: string;
    fg_pct: string;
    ft_pct: string;
    pts: number;
    reb: number;
    ast: number;
    stl: number;
    blk: number;
};

export default function StatsTable({ data }: { data: PlayerStats[] }) {
    const [sortKey, setSortKey] = useState<keyof PlayerStats>('pts');
    const [direction, setDirection] = useState<'asc' | 'desc'>('desc');
    const [search, setSearch] = useState('');

    const sortedData = [...data]
        .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            const valA = parseFloat(a[sortKey] as string) || 0;
            const valB = parseFloat(b[sortKey] as string) || 0;
            return direction === 'asc' ? valA - valB : valB - valA;
        });

    const handleSort = (key: keyof PlayerStats) => {
        if (sortKey === key) {
            setDirection(direction === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setDirection('desc');
        }
    };

    const headers: { key: keyof PlayerStats; label: string }[] = [
        { key: 'name', label: 'Player' },
        { key: 'team', label: 'Team' },
        { key: 'gp', label: 'GP' },
        { key: 'ppg', label: 'PPG' },
        { key: 'rpg', label: 'RPG' },
        { key: 'apg', label: 'APG' },
        { key: 'fg_pct', label: 'FG%' },
        { key: 'stl', label: 'STL' },
        { key: 'blk', label: 'BLK' },
    ];

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
                <input
                    type="text"
                    placeholder="Search player..."
                    className="w-full max-w-xs px-3 py-2 border rounded"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 uppercase text-xs font-semibold text-gray-600">
                        <tr>
                            {headers.map((h) => (
                                <th
                                    key={h.key}
                                    className="px-4 py-3 cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort(h.key)}
                                >
                                    {h.label} {sortKey === h.key && (direction === 'asc' ? '↑' : '↓')}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {sortedData.slice(0, 100).map((player, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">
                                    <Link href={`/player/${encodeURIComponent(player.name)}`} className="text-blue-600 hover:underline">
                                        {player.name}
                                    </Link>
                                </td>
                                <td className="px-4 py-3">{player.team}</td>
                                <td className="px-4 py-3">{player.gp}</td>
                                <td className="px-4 py-3 font-bold">{player.ppg}</td>
                                <td className="px-4 py-3">{player.rpg}</td>
                                <td className="px-4 py-3">{player.apg}</td>
                                <td className="px-4 py-3">{(parseFloat(player.fg_pct) * 100).toFixed(1)}%</td>
                                <td className="px-4 py-3">{player.stl}</td>
                                <td className="px-4 py-3">{player.blk}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="p-4 text-xs text-gray-500 text-center">
                    Showing top 100 matches
                </div>
            </div>
        </div>
    );
}
