import fs from 'fs';
import path from 'path';

// Mock DB helper
const DATA_PATH = path.join(process.cwd(), 'src/data/shots.json');

// Global cache to prevent reloading on every request in dev
declare global {
    var _shotCache: any[] | undefined;
}

function loadData() {
    if (global._shotCache) return global._shotCache;

    try {
        const raw = fs.readFileSync(DATA_PATH, 'utf-8');
        global._shotCache = JSON.parse(raw);
        return global._shotCache;
    } catch (e) {
        console.error("Failed to load shots.json", e);
        return [];
    }
}

const db = {
    prepare: (query: string) => {
        const shots = loadData() || [];

        return {
            get: () => {
                if (query.toLowerCase().includes('count')) return { count: shots.length };
                return null;
            },
            all: () => {
                if (query.includes('GROUP BY player_name')) {
                    const counts: Record<string, number> = {};
                    shots.forEach((s: any) => {
                        counts[s.player] = (counts[s.player] || 0) + 1;
                    });
                    return Object.entries(counts)
                        .map(([player_name, shots]) => ({ player_name, shots }))
                        .sort((a, b) => b.shots - a.shots)
                        .slice(0, 10);
                }
                return shots;
            }
        };
    }
};

export default db;
