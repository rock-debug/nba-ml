const fs = require('fs');
const path = require('path');

const STATS_PATH = path.join(__dirname, '../src/data/season_stats.json');
const OUTPUT_PATH = path.join(__dirname, '../src/data/player_percentiles.json');

function calculatePercentile(value, allValues) {
    // Count how many values are less than this value
    const lessThan = allValues.filter(v => v < value).length;
    return Math.round((lessThan / allValues.length) * 100);
}

function main() {
    const stats = JSON.parse(fs.readFileSync(STATS_PATH, 'utf-8'));

    // Filter players with min 20 games
    const qualified = stats.filter(p => p.gp >= 20);

    console.log(`Calculating percentiles for ${qualified.length} qualified players...`);

    // Collect all values for each stat
    const statValues = {
        ppg: qualified.map(p => parseFloat(p.ppg)),
        rpg: qualified.map(p => parseFloat(p.rpg)),
        apg: qualified.map(p => parseFloat(p.apg)),
        fg_pct: qualified.map(p => parseFloat(p.fg_pct)),
        ft_pct: qualified.map(p => parseFloat(p.ft_pct)),
        stl: qualified.map(p => p.stl / p.gp), // steals per game
        blk: qualified.map(p => p.blk / p.gp)  // blocks per game
    };

    // Calculate percentiles for each player
    const results = qualified.map(player => {
        const ppg = parseFloat(player.ppg);
        const rpg = parseFloat(player.rpg);
        const apg = parseFloat(player.apg);
        const fg_pct = parseFloat(player.fg_pct);
        const ft_pct = parseFloat(player.ft_pct);
        const spg = player.stl / player.gp;
        const bpg = player.blk / player.gp;

        return {
            name: player.name,
            team: player.team,
            percentiles: {
                scoring: calculatePercentile(ppg, statValues.ppg),
                rebounding: calculatePercentile(rpg, statValues.rpg),
                playmaking: calculatePercentile(apg, statValues.apg),
                efficiency: calculatePercentile(fg_pct, statValues.fg_pct),
                ft_shooting: calculatePercentile(ft_pct, statValues.ft_pct),
                defense_steals: calculatePercentile(spg, statValues.stl),
                defense_blocks: calculatePercentile(bpg, statValues.blk)
            },
            values: {
                ppg: ppg.toFixed(1),
                rpg: rpg.toFixed(1),
                apg: apg.toFixed(1),
                fg_pct: (fg_pct * 100).toFixed(1) + '%',
                ft_pct: (ft_pct * 100).toFixed(1) + '%',
                spg: spg.toFixed(1),
                bpg: bpg.toFixed(1)
            }
        };
    });

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
    console.log(`Saved percentiles to ${OUTPUT_PATH}`);

    // Show a sample
    const sample = results.find(p => p.name.includes('Joki'));
    if (sample) {
        console.log('\nSample (Jokic):');
        console.log(JSON.stringify(sample, null, 2));
    }
}

main();
