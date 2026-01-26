const fs = require('fs');
const path = require('path');

const STATS_PATH = path.join(__dirname, '../src/data/season_stats.json');
const OUTPUT_PATH = path.join(__dirname, '../src/data/player_percentiles.json');

function inferPosition(player) {
    const ppg = parseFloat(player.ppg);
    const rpg = parseFloat(player.rpg);
    const apg = parseFloat(player.apg);

    // Simple position inference based on stats
    if (rpg >= 8) return 'C'; // Center
    if (rpg >= 6 && apg < 4) return 'PF'; // Power Forward
    if (apg >= 6) return 'PG'; // Point Guard
    if (apg >= 3.5 && rpg < 5) return 'SG'; // Shooting Guard
    return 'SF'; // Small Forward (default)
}

function calculatePercentile(value, allValues) {
    const lessThan = allValues.filter(v => v < value).length;
    return Math.round((lessThan / allValues.length) * 100);
}

function main() {
    const stats = JSON.parse(fs.readFileSync(STATS_PATH, 'utf-8'));
    const qualified = stats.filter(p => p.gp >= 20);

    // Add positions
    qualified.forEach(p => p.position = inferPosition(p));

    console.log(`Calculating percentiles for ${qualified.length} qualified players...`);

    // Group by position
    const byPosition = {
        'PG': qualified.filter(p => p.position === 'PG'),
        'SG': qualified.filter(p => p.position === 'SG'),
        'SF': qualified.filter(p => p.position === 'SF'),
        'PF': qualified.filter(p => p.position === 'PF'),
        'C': qualified.filter(p => p.position === 'C')
    };

    console.log('Position breakdown:');
    Object.entries(byPosition).forEach(([pos, players]) => {
        console.log(`  ${pos}: ${players.length} players`);
    });

    // Collect values for league-wide percentiles
    const leagueValues = {
        ppg: qualified.map(p => parseFloat(p.ppg)),
        rpg: qualified.map(p => parseFloat(p.rpg)),
        apg: qualified.map(p => parseFloat(p.apg)),
        fg_pct: qualified.map(p => parseFloat(p.fg_pct)),
        ft_pct: qualified.map(p => parseFloat(p.ft_pct)),
        stl: qualified.map(p => p.stl / p.gp),
        blk: qualified.map(p => p.blk / p.gp)
    };

    const results = qualified.map(player => {
        const ppg = parseFloat(player.ppg);
        const rpg = parseFloat(player.rpg);
        const apg = parseFloat(player.apg);
        const fg_pct = parseFloat(player.fg_pct);
        const ft_pct = parseFloat(player.ft_pct);
        const spg = player.stl / player.gp;
        const bpg = player.blk / player.gp;

        // Position-specific values
        const posPlayers = byPosition[player.position];
        const posValues = {
            ppg: posPlayers.map(p => parseFloat(p.ppg)),
            rpg: posPlayers.map(p => parseFloat(p.rpg)),
            apg: posPlayers.map(p => parseFloat(p.apg)),
            fg_pct: posPlayers.map(p => parseFloat(p.fg_pct)),
            ft_pct: posPlayers.map(p => parseFloat(p.ft_pct)),
            stl: posPlayers.map(p => p.stl / p.gp),
            blk: posPlayers.map(p => p.blk / p.gp)
        };

        return {
            name: player.name,
            team: player.team,
            position: player.position,
            percentiles: {
                league: {
                    scoring: calculatePercentile(ppg, leagueValues.ppg),
                    rebounding: calculatePercentile(rpg, leagueValues.rpg),
                    playmaking: calculatePercentile(apg, leagueValues.apg),
                    efficiency: calculatePercentile(fg_pct, leagueValues.fg_pct),
                    ft_shooting: calculatePercentile(ft_pct, leagueValues.ft_pct),
                    defense_steals: calculatePercentile(spg, leagueValues.stl),
                    defense_blocks: calculatePercentile(bpg, leagueValues.blk)
                },
                position: {
                    scoring: calculatePercentile(ppg, posValues.ppg),
                    rebounding: calculatePercentile(rpg, posValues.rpg),
                    playmaking: calculatePercentile(apg, posValues.apg),
                    efficiency: calculatePercentile(fg_pct, posValues.fg_pct),
                    ft_shooting: calculatePercentile(ft_pct, posValues.ft_pct),
                    defense_steals: calculatePercentile(spg, posValues.stl),
                    defense_blocks: calculatePercentile(bpg, posValues.blk)
                }
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
    console.log(`\nSaved percentiles to ${OUTPUT_PATH}`);

    // Show sample
    const sample = results.find(p => p.name.includes('Joki'));
    if (sample) {
        console.log('\nSample (Jokic):');
        console.log(`Position: ${sample.position}`);
        console.log('League percentiles:', sample.percentiles.league);
        console.log('Position percentiles:', sample.percentiles.position);
    }
}

main();
