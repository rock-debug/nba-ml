import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import ShotChart from '@/components/ShotChart';
import StatsTable from '@/components/StatsTable';

// Mapping Abbr -> Full Name (approximate for matching shots data)
const TEAM_MAP: Record<string, string> = {
    "ATL": "Atlanta Hawks",
    "BOS": "Boston Celtics",
    "BKN": "Brooklyn Nets",
    "CHA": "Charlotte Hornets",
    "CHO": "Charlotte Hornets", // BBRef uses CHO
    "CHI": "Chicago Bulls",
    "CLE": "Cleveland Cavaliers",
    "DAL": "Dallas Mavericks",
    "DEN": "Denver Nuggets",
    "DET": "Detroit Pistons",
    "GSW": "Golden State Warriors",
    "HOU": "Houston Rockets",
    "IND": "Indiana Pacers",
    "LAC": "LA Clippers",
    "LAL": "Los Angeles Lakers",
    "MEM": "Memphis Grizzlies",
    "MIA": "Miami Heat",
    "MIL": "Milwaukee Bucks",
    "MIN": "Minnesota Timberwolves",
    "NOP": "New Orleans Pelicans",
    "NYK": "New York Knicks",
    "OKC": "Oklahoma City Thunder",
    "ORL": "Orlando Magic",
    "PHI": "Philadelphia 76ers",
    "PHX": "Phoenix Suns",
    "PHO": "Phoenix Suns",
    "POR": "Portland Trail Blazers",
    "SAC": "Sacramento Kings",
    "SAS": "San Antonio Spurs",
    "TOR": "Toronto Raptors",
    "UTA": "Utah Jazz",
    "WAS": "Washington Wizards"
};

export const dynamic = 'force-dynamic';

function getTeamData(teamAbbr: string) {
    const statsPath = path.join(process.cwd(), 'src/data/season_stats.json');
    const shotsPath = path.join(process.cwd(), 'src/data/shots.json');

    let roster = [];
    let teamShots = [];

    // 1. Get Roster
    if (fs.existsSync(statsPath)) {
        const stats = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
        roster = stats.filter((p: any) => p.team === teamAbbr);
    }

    // 2. Get Shots
    if (fs.existsSync(shotsPath)) {
        const shots = JSON.parse(fs.readFileSync(shotsPath, 'utf-8'));
        const fullName = TEAM_MAP[teamAbbr];
        if (fullName) {
            // Filter by Full Team Name
            teamShots = shots.filter((s: any) => s.team === fullName);
        } else {
            // Fallback: try to match by player names in roster?
            // Or maybe the shot data has abbr? No, checked csv it was full name.
            // If manual map fail, charts might be empty.
            // Debug: filter by checking if s.team includes abbr? (Unreliable)
        }
    }

    return { roster, teamShots };
}

export default function TeamPage({ params }: { params: { id: string } }) {
    const teamAbbr = params.id.toUpperCase();
    const { roster, teamShots } = getTeamData(teamAbbr);

    const fullTeamName = TEAM_MAP[teamAbbr] || teamAbbr;

    // Aggregate Team Stats
    const totalPts = roster.reduce((acc, p: any) => acc + (p.pts || 0), 0);
    // Estimate from per game? No, roster has 'pts' field from scraper which is PPG*GP.
    // Actually scraper output: pts: Math.round(parseFloat(ppg) * gp)

    return (
        <main className="min-h-screen p-8 max-w-6xl mx-auto">
            <Link href="/teams" className="text-blue-500 mb-4 inline-block">← Back to Teams</Link>

            <div className="bg-white p-8 rounded-lg shadow mb-8 border-t-4 border-blue-600">
                <h1 className="text-4xl font-bold mb-2">{fullTeamName}</h1>
                <p className="text-gray-500 text-lg">Season 2023-24</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="p-4 bg-gray-50 rounded text-center">
                        <div className="text-sm text-gray-500 uppercase">Players</div>
                        <div className="text-3xl font-bold">{roster.length}</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded text-center">
                        <div className="text-sm text-gray-500 uppercase">Total Shots (Charted)</div>
                        <div className="text-3xl font-bold">{teamShots.length.toLocaleString()}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Roster Column */}
                <div>
                    <h2 className="text-2xl font-bold mb-4">Roster & Stats</h2>
                    <StatsTable data={roster} />
                </div>

                {/* Shot Chart Column */}
                <div>
                    <h2 className="text-2xl font-bold mb-4">Team Shot Chart</h2>
                    <div className="bg-white p-4 rounded-lg shadow">
                        {teamShots.length > 0 ? (
                            <div className="flex flex-col items-center">
                                <ShotChart shots={teamShots} />
                                <p className="text-xs text-gray-400 mt-2">Showing all recorded shots for {fullTeamName}</p>
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-50 rounded">
                                No shot data available for {fullTeamName}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
