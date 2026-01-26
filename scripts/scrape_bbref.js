const fs = require('fs');
const path = require('path');

const URL = 'https://www.basketball-reference.com/leagues/NBA_2024_per_game.html';
const OUTPUT_JSON = path.join(__dirname, '../src/data/season_stats.json');

async function scrape() {
    console.log(`Fetching ${URL}...`);
    try {
        const res = await fetch(URL, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const html = await res.text();

        const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/);
        if (!tbodyMatch) return;

        const tbody = tbodyMatch[1];
        const rows = tbody.match(/<tr[\s\S]*?<\/tr>/g);

        if (!rows) return;

        const players = [];

        const getStat = (rowHtml, statName) => {
            // match data-stat="statName" ... >content</td>
            const regex = new RegExp(`data-stat="${statName}"[^>]*>(.*?)<\/td>`, 's');
            const match = rowHtml.match(regex);
            if (!match) return null;
            let content = match[1];
            // Strip tags: <a ...>Joel Embiid</a> -> Joel Embiid
            content = content.replace(/<[^>]+>/g, '');
            return content.trim();
        };

        for (const row of rows) {
            if (row.includes('class="thead"')) continue;

            // Correct keys based on debug
            const name = getStat(row, 'name_display');
            const team = getStat(row, 'team_name_abbr');
            const gp = parseInt(getStat(row, 'games') || '0');
            const ppg = getStat(row, 'pts_per_g');
            const rpg = getStat(row, 'trb_per_g');
            const apg = getStat(row, 'ast_per_g');
            const stl = getStat(row, 'stl_per_g');
            const blk = getStat(row, 'blk_per_g');
            const fg_pct = getStat(row, 'fg_pct') || '.000';
            const ft_pct = getStat(row, 'ft_pct') || '.000';

            // Filter out aggregate rows as requested
            if (['2TM', '3TM', '4TM', 'TOT'].includes(team)) continue;

            if (name) {
                players.push({
                    name, team, gp, ppg, rpg, apg,
                    stl, blk, fg_pct, ft_pct,
                    // Approximation for sorting totals
                    pts: Math.round(parseFloat(ppg) * gp),
                    reb: Math.round(parseFloat(rpg) * gp),
                    ast: Math.round(parseFloat(apg) * gp)
                });
            }
        }

        console.log(`Parsed ${players.length} players.`);

        // De-duplicate? Some players traded have "TOT" row and team rows. 
        // BBRef usually puts TOT (Team="TOT") for combined. We should prefer TOT if exists?
        // Or just keep all. If we keep all, we might have duplicate names. 
        // Let's filter to keep only TOT if multiple entries exist, or just keep them all for now.
        // Actually, distinct entries for different teams is fine, but for the leaderboard we usually want the TOT row.
        // Let's prioritize TOT.

        const seen = new Set();
        const uniquePlayers = [];

        // Sort to prioritize TOT (Total) rows if we encounter them? 
        // Actually BBRef lists TOT first usually? Or distinct rows?
        // Let's just dump all 

        fs.writeFileSync(OUTPUT_JSON, JSON.stringify(players, null, 2));
        console.log('Done!');

    } catch (e) {
        console.error(e);
    }
}
scrape();
