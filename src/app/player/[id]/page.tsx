import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import ShotChart from '@/components/ShotChart';
import PlayerPercentiles from '@/components/PlayerPercentiles';

export const dynamic = 'force-dynamic';

function getPlayerData(nameDecoded: string) {
    const statsPath = path.join(process.cwd(), 'src/data/season_stats.json');
    const shotsPath = path.join(process.cwd(), 'src/data/shots.json');
    const clustersPath = path.join(process.cwd(), 'src/data/player_clusters.json');
    const percentilesPath = path.join(process.cwd(), 'src/data/player_percentiles.json');

    let playerStats = null;
    let playerShots = [];
    let playerCluster = null;
    let playerPercentiles = null;

    try {
        const statsRaw = fs.readFileSync(statsPath, 'utf-8');
        const allStats = JSON.parse(statsRaw);
        playerStats = allStats.find((p: any) => p.name.toLowerCase() === nameDecoded.toLowerCase());

        if (fs.existsSync(clustersPath)) {
            const clustersRaw = fs.readFileSync(clustersPath, 'utf-8');
            const allClusters = JSON.parse(clustersRaw);
            playerCluster = allClusters.find((c: any) => c.name.toLowerCase() === nameDecoded.toLowerCase());
        }

        if (fs.existsSync(percentilesPath)) {
            const percentilesRaw = fs.readFileSync(percentilesPath, 'utf-8');
            const allPercentiles = JSON.parse(percentilesRaw);
            playerPercentiles = allPercentiles.find((p: any) => p.name.toLowerCase() === nameDecoded.toLowerCase());
        }

        if (fs.existsSync(shotsPath)) {
            const shotsRaw = fs.readFileSync(shotsPath, 'utf-8');
            const allShots = JSON.parse(shotsRaw);
            playerShots = allShots.filter((s: any) =>
                s.player === nameDecoded ||
                (nameDecoded.includes(s.player)) ||
                (s.player.includes(nameDecoded.split(' ')[1]))
            );
        }
    } catch (e) {
        console.error(e);
    }

    return { stats: playerStats, shots: playerShots, cluster: playerCluster, percentiles: playerPercentiles };
}

export default function PlayerPage({ params }: { params: { id: string } }) {
    const name = decodeURIComponent(params.id);
    const { stats, shots, cluster, percentiles } = getPlayerData(name);

    if (!stats) return <div className="p-8">Player Not Found: {name}</div>;

    const clusterColors: Record<number, string> = {
        0: 'bg-purple-100 text-purple-800 border-purple-400',
        1: 'bg-gray-100 text-gray-800 border-gray-400',
        2: 'bg-indigo-100 text-indigo-800 border-indigo-400',
        3: 'bg-red-100 text-red-800 border-red-400',
        4: 'bg-blue-100 text-blue-800 border-blue-400',
        5: 'bg-cyan-100 text-cyan-800 border-cyan-400',
        6: 'bg-green-100 text-green-800 border-green-400',
        7: 'bg-yellow-100 text-yellow-800 border-yellow-400',
        8: 'bg-orange-100 text-orange-800 border-orange-400',
        9: 'bg-teal-100 text-teal-800 border-teal-400',
        10: 'bg-pink-100 text-pink-800 border-pink-400',
        11: 'bg-lime-100 text-lime-800 border-lime-400'
    };

    return (
        <main className="min-h-screen p-8 max-w-7xl mx-auto">
            <Link href="/" className="text-blue-500 mb-4 inline-block">← Back to Home</Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Left: Player Details */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-3xl font-bold">{stats.name}</h1>
                        {cluster && (
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${clusterColors[cluster.cluster] || 'bg-gray-100 text-gray-800'}`}>
                                {cluster.archetype}
                            </span>
                        )}
                    </div>
                    <p className="text-xl text-gray-600 mb-6">{stats.team} | {stats.gp} GP</p>

                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-3 bg-gray-50 rounded">
                            <div className="text-sm text-gray-500">PPG</div>
                            <div className="text-2xl font-bold">{stats.ppg}</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded">
                            <div className="text-sm text-gray-500">RPG</div>
                            <div className="text-2xl font-bold">{stats.rpg}</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded">
                            <div className="text-sm text-gray-500">APG</div>
                            <div className="text-2xl font-bold">{stats.apg}</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded">
                            <div className="text-sm text-gray-500">FG%</div>
                            <div className="text-2xl font-bold">{stats.fg_pct}</div>
                        </div>
                    </div>
                </div>

                {/* Right: Percentiles */}
                {percentiles && (
                    <div>
                        <PlayerPercentiles
                            percentiles={percentiles.percentiles}
                            values={percentiles.values}
                            position={percentiles.position}
                        />
                    </div>
                )}
            </div>

            {/* Shot Chart - Full Width Below */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Shot Chart (2023-24)</h2>
                {shots.length > 0 ? (
                    <div className="flex flex-col items-center">
                        <p className="mb-2 text-gray-600">Displaying {shots.length} shots</p>
                        <ShotChart shots={shots} />
                    </div>
                ) : (
                    <p className="text-gray-500">No shot data available</p>
                )}
            </div>
        </main>
    );
}
