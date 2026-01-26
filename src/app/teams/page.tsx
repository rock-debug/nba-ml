import fs from 'fs';
import path from 'path';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function getTeams() {
    try {
        const statsPath = path.join(process.cwd(), 'src/data/season_stats.json');
        if (!fs.existsSync(statsPath)) return [];
        const stats = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));

        // Extract unique teams
        // item.team is abbreviation like "LAL", "DEN"
        const teams = new Set(stats.map((p: any) => p.team).filter((t: string) => t && t !== 'TOT'));
        return Array.from(teams).sort();
    } catch (e) {
        console.error(e);
        return [];
    }
}

export default function TeamsPage() {
    const teams = getTeams();

    return (
        <main className="min-h-screen p-8 max-w-6xl mx-auto">
            <Link href="/" className="text-blue-500 mb-4 inline-block">← Back to Dashboard</Link>
            <h1 className="text-3xl font-bold mb-8">NBA Teams</h1>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {teams.map(team => (
                    <Link key={team} href={`/team/${team}`} className="block">
                        <div className="bg-white p-6 rounded-lg shadow hover:bg-gray-50 border transition flex flex-col items-center">
                            <span className="text-2xl font-bold text-gray-800">{team}</span>
                            <span className="text-gray-500 text-sm mt-2">View Roster & Charts →</span>
                        </div>
                    </Link>
                ))}
            </div>
        </main>
    );
}
