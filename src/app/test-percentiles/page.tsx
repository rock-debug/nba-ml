import PlayerPercentiles from '@/components/PlayerPercentiles';

export default function TestPercentilesPage() {
    const testPercentiles = {
        scoring: 97,
        rebounding: 99,
        playmaking: 99,
        efficiency: 92,
        ft_shooting: 68,
        defense_steals: 95,
        defense_blocks: 89
    };

    const testValues = {
        ppg: "26.4",
        rpg: "12.4",
        apg: "9.0",
        fg_pct: "58.3%",
        ft_pct: "81.7%",
        spg: "1.4",
        bpg: "0.9"
    };

    return (
        <main className="min-h-screen p-8">
            <h1 className="text-3xl font-bold mb-4">Test Percentiles (Jokić)</h1>
            <PlayerPercentiles
                percentiles={testPercentiles}
                values={testValues}
            />
        </main>
    );
}
