const https = require('https');
const fs = require('fs');
const path = require('path');

// Scrape positions from Basketball Reference
function fetchPositions() {
    return new Promise((resolve, reject) => {
        const url = 'https://www.basketball-reference.com/leagues/NBA_2024_per_game.html';

        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                const positions = {};

                // Parse HTML to extract player names and positions
                // Look for table rows with player data
                const playerRegex = /<tr[^>]*>.*?<td[^>]*data-stat="player"[^>]*><a[^>]*>([^<]+)<\/a>.*?<td[^>]*data-stat="pos"[^>]*>([^<]+)<\/td>/gs;

                let match;
                while ((match = playerRegex.exec(data)) !== null) {
                    const name = match[1].trim();
                    const pos = match[2].trim();
                    positions[name] = pos;
                }

                console.log(`Scraped positions for ${Object.keys(positions).length} players`);
                resolve(positions);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

async function main() {
    try {
        console.log('Fetching player positions from Basketball Reference...');
        const positions = await fetchPositions();

        // Load existing stats
        const statsPath = path.join(__dirname, '../src/data/season_stats.json');
        const stats = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));

        // Match positions to stats using fuzzy name matching
        let matched = 0;
        stats.forEach(player => {
            // Try exact match first
            if (positions[player.name]) {
                player.position = positions[player.name];
                matched++;
                return;
            }

            // Try without first initial
            const nameWithoutInitial = player.name.split('. ')[1] || player.name;
            for (const [fullName, pos] of Object.entries(positions)) {
                if (fullName.includes(nameWithoutInitial) || nameWithoutInitial.includes(fullName.split(' ').pop())) {
                    player.position = pos;
                    matched++;
                    break;
                }
            }

            // Default to SF if not found
            if (!player.position) {
                player.position = 'SF';
            }
        });

        console.log(`Matched ${matched} out of ${stats.length} players`);

        // Save updated stats
        fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
        console.log('Updated season_stats.json with positions');

        // Show sample
        const sample = stats.slice(0, 5);
        console.log('\nSample:');
        sample.forEach(p => console.log(`  ${p.name} (${p.team}): ${p.position}`));

    } catch (err) {
        console.error('Error:', err.message);
    }
}

main();
