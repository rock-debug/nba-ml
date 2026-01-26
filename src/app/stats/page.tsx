import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import StatsTable from '@/components/StatsTable';

export const dynamic = 'force-dynamic';

function getStats() {
    try {
        const filePath = path.join(process.cwd(), 'src/data/season_stats.json');
        if (!fs.existsSync(filePath)) return [];
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
    } catch (e) {
        return [];
    }
}

export default function StatsPage() {
    const stats = getStats();

    return (
        <main className="min-h-screen p-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <Link href="/" className="text-blue-500 hover:underline mb-2 inline-block">← Back to Dashboard</Link>
                    <h1 className="text-3xl font-bold">Season Stats (2023-24)</h1>
                </div>
                <div className="text-right text-gray-600">
                    <p className="text-sm">Based on PBP Data</p>
                </div>
            </div>

            <StatsTable data={stats} />
        </main>
    );
}
