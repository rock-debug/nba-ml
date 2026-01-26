import fs from 'fs';
import path from 'path';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function getClusters() {
    try {
        const clustersPath = path.join(process.cwd(), 'src/data/player_clusters.json');
        if (!fs.existsSync(clustersPath)) return [];
        const clusters = JSON.parse(fs.readFileSync(clustersPath, 'utf-8'));
        return clusters;
    } catch (e) {
        console.error(e);
        return [];
    }
}

export default function Home() {
    const allPlayers = getClusters();

    // Group by cluster  
    const clusterGroups: Record<number, any[]> = {};
    for (let i = 0; i < 12; i++) {
        clusterGroups[i] = [];
    }

    allPlayers.forEach((p: any) => {
        if (clusterGroups[p.cluster] !== undefined) {
            clusterGroups[p.cluster].push(p);
        }
    });

    const clusterMeta = [
        { id: 0, name: 'Offensive Engine Bigs', color: 'border-purple-500 bg-purple-50', icon: '🎯', textColor: 'text-purple-700' },
        { id: 1, name: 'Traditional Centers', color: 'border-gray-500 bg-gray-50', icon: '🏛️', textColor: 'text-gray-700' },
        { id: 2, name: 'Stretch Bigs', color: 'border-indigo-500 bg-indigo-50', icon: '📏', textColor: 'text-indigo-700' },
        { id: 3, name: 'Rim Runners', color: 'border-red-500 bg-red-50', icon: '🚀', textColor: 'text-red-700' },
        { id: 4, name: 'Corner 3 Specialists', color: 'border-blue-500 bg-blue-50', icon: '📐', textColor: 'text-blue-700' },
        { id: 5, name: 'Volume 3PT Shooters', color: 'border-cyan-500 bg-cyan-50', icon: '🎪', textColor: 'text-cyan-700' },
        { id: 6, name: 'Elite Scorers', color: 'border-green-500 bg-green-50', icon: '⭐', textColor: 'text-green-700' },
        { id: 7, name: 'Mid-Range Scorers', color: 'border-yellow-500 bg-yellow-50', icon: '📊', textColor: 'text-yellow-700' },
        { id: 8, name: 'Playmaking Guards', color: 'border-orange-500 bg-orange-50', icon: '🎭', textColor: 'text-orange-700' },
        { id: 9, name: 'Two-Way Wings', color: 'border-teal-500 bg-teal-50', icon: '🛡️', textColor: 'text-teal-700' },
        { id: 10, name: 'Slashers', color: 'border-pink-500 bg-pink-50', icon: '⚡', textColor: 'text-pink-700' },
        { id: 11, name: 'Role Players', color: 'border-lime-500 bg-lime-50', icon: '🔧', textColor: 'text-lime-700' }
    ];

    return (
        <main className="min-h-screen p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">NBA Player Archetypes</h1>
                <p className="text-gray-600">Players classified by Machine Learning based on shot charts, rebounds, and assists</p>
                <div className="flex gap-4 mt-4">
                    <Link href="/stats" className="text-blue-500 hover:underline">View All Stats →</Link>
                    <Link href="/teams" className="text-blue-500 hover:underline">View Teams →</Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {clusterMeta.map(cluster => {
                    const players = clusterGroups[cluster.id] || [];
                    return (
                        <div key={cluster.id} className={`border-2 rounded-lg p-4 ${cluster.color}`}>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">{cluster.icon}</span>
                                <div>
                                    <h2 className={`text-base font-bold ${cluster.textColor}`}>{cluster.name}</h2>
                                    <p className="text-xs text-gray-600">{players.length} players</p>
                                </div>
                            </div>

                            <div className="space-y-1.5 max-h-72 overflow-y-auto">
                                {players.slice(0, 12).map((player: any, i: number) => (
                                    <Link
                                        key={i}
                                        href={`/player/${encodeURIComponent(player.name)}`}
                                        className="block p-1.5 bg-white rounded hover:bg-gray-50 transition border text-xs"
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium truncate">{player.name}</span>
                                            <span className="text-xs text-gray-500 ml-1">{player.team}</span>
                                        </div>
                                    </Link>
                                ))}
                                {players.length > 12 && (
                                    <p className="text-xs text-gray-500 text-center pt-1">
                                        + {players.length - 12} more
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </main>
    );
}
