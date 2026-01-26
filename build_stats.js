const fs = require('fs');
const path = require('path');
const readline = require('readline');

const PBP_CSV = path.join(__dirname, '../data/pbp_events.csv');
const OUTPUT_JSON = path.join(__dirname, '../src/data/season_stats.json');

async function buildStats() {
    const players = {};
    // Roster: TeamTricode -> { "Jokic": id, "N. Jokic": id, "Nikola Jokic": id }
    const roster = {};

    console.log('Pass 1: Building Roster...');
    let fileStream = fs.createReadStream(PBP_CSV);
    let rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let isHeader = true;
    for await (const line of rl) {
        if (isHeader) { isHeader = false; continue; }

        // 0:gameId... 5:teamTricode ... 6:personId, 7:playerName(Last), 8:playerNameI(Initial. Last)
        const cols = line.split(',');
        const personId = cols[6];
        const lastName = cols[7]; // "Jokić"
        const initName = cols[8]; // "N. Jokić"
        const team = cols[5]; // "DEN"

        if (!personId || personId === '0') continue;

        if (!players[personId]) {
            players[personId] = {
                id: personId,
                // Use Initial Name for display "N. Jokić" usually better than just "Jokić"
                name: initName || lastName,
                team: team,
                games: new Set(),
                pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fga: 0, fgm: 0, fta: 0, ftm: 0
            };
        }

        if (!roster[team]) roster[team] = {};

        // Index by various forms
        if (lastName) roster[team][lastName] = personId; // "Jokić"
        if (initName) roster[team][initName] = personId; // "N. Jokić"

        // Normalize unicode? "Jokić" -> "Jokic"
        if (lastName) roster[team][lastName.normalize("NFD").replace(/[\u0300-\u036f]/g, "")] = personId;
    }

    console.log('Pass 2: Calculating Stats...');
    fileStream = fs.createReadStream(PBP_CSV);
    rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    isHeader = true;
    let count = 0;

    for await (const line of rl) {
        if (isHeader) { isHeader = false; continue; }
        count++;
        if (count % 100000 === 0) process.stdout.write(`Processed ${count} lines...\r`);

        const cols = line.split(',');
        const gameId = cols[0];
        const team = cols[5];
        const personId = cols[6];

        const actionType = cols[19];
        const description = cols[18];
        // shotResult is col 12? Let's check header... 
        // Header: gameId,actionNumber,clock,period,teamId,teamTricode,personId,playerName,playerNameI,xLegacy,yLegacy,shotDistance,shotResult...
        // 12 is shotResult only if indexing starts at 0. Yes.

        if (personId && players[personId]) {
            players[personId].games.add(gameId);
        }
        const p = players[personId];

        // Standard Stats
        if (p && actionType === 'Rebound') p.reb++;
        if (p && description && description.includes('STEAL')) p.stl++;
        if (p && description && description.includes('BLOCK')) p.blk++;

        // Free Throw
        if (p && actionType === 'Free Throw') {
            p.fta++;
            // If not miss
            if (description && !description.startsWith('MISS')) {
                p.ftm++;
                p.pts++;
            }
        }

        // Shot & Assist
        if (actionType === 'Made Shot') {
            if (p) {
                p.fga++;
                p.fgm++;
                p.pts += (description && description.includes('3PT')) ? 3 : 2;
            }

            // Assist Regex: (Russell 1 AST) or (N. Jokic 1 AST)
            // Capture strictly inside parens before " \d+ AST"
            if (description) {
                const astMatch = description.match(/\(([^)]+) \d+ AST\)/);
                if (astMatch) {
                    let astName = astMatch[1].trim();

                    // Lookup
                    if (roster[team]) {
                        let assisterId = roster[team][astName];
                        if (!assisterId) {
                            // Try normalizing name "Jokic"
                            assisterId = roster[team][astName.normalize("NFD").replace(/[\u0300-\u036f]/g, "")];
                        }

                        if (assisterId && players[assisterId]) {
                            players[assisterId].ast++;
                        }
                    }
                }
            }
        } else if (p && actionType === 'Missed Shot') {
            p.fga++;
        }
    }

    const finalStats = Object.values(players).map(p => ({
        name: p.name,
        team: p.team,
        gp: p.games.size,
        pts: p.pts,
        reb: p.reb,
        ast: p.ast,
        stl: p.stl,
        blk: p.blk,
        fg_pct: p.fga > 0 ? (p.fgm / p.fga).toFixed(3) : '.000',
        ft_pct: p.fta > 0 ? (p.ftm / p.fta).toFixed(3) : '.000',
        ppg: (p.pts / (p.games.size || 1)).toFixed(1),
        rpg: (p.reb / (p.games.size || 1)).toFixed(1),
        apg: (p.ast / (p.games.size || 1)).toFixed(1)
    })).filter(p => p.gp > 0);

    // Eliminate tiny sample sizes if desired? No keep all.
    finalStats.sort((a, b) => parseFloat(b.ppg) - parseFloat(a.ppg));

    console.log(`\nWriting stats for ${finalStats.length} players...`);
    // Log check for Haliburton
    const hali = finalStats.find(p => p.name.includes('Haliburton'));
    if (hali) console.log('Check Haliburton:', hali);

    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(finalStats, null, 2));
    console.log('Done!');
}

buildStats();
