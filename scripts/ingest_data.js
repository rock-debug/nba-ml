const fs = require('fs');
const path = require('path');
const readline = require('readline');

const SHOTS_CSV = path.join(__dirname, '../data/shots.csv');
const OUTPUT_JSON = path.join(__dirname, '../src/data/shots.json');
const OUTPUT_DIR = path.dirname(OUTPUT_JSON);

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function convertCsvToJson() {
    const fileStream = fs.createReadStream(SHOTS_CSV);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let isHeader = true;
    const shots = [];
    let count = 0;

    console.log('Reading CSV...');
    for await (const line of rl) {
        if (isHeader) {
            isHeader = false;
            continue;
        }

        const cols = line.split(',');
        if (cols.length < 24) continue;

        // Minimal fields to keep file size down
        // 4:PLAYER_NAME, 17:LOC_X, 18:LOC_Y, 20:SHOT_MADE_FLAG, 12:SHOT_TYPE
        try {
            const shot = {
                player: cols[4],
                team: cols[6],
                x: parseInt(cols[17]),
                y: parseInt(cols[18]),
                made: cols[20] === '1',
                type: cols[12],
                zone_basic: cols[13],
                zone_area: cols[14],
                action_type: cols[11]
            };
            shots.push(shot);
            count++;
            if (count % 10000 === 0) process.stdout.write(`Processed ${count}...\r`);
        } catch (e) {
            // ignore
        }
    }

    console.log(`\nWriting ${count} shots to JSON...`);
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(shots));
    console.log('Done!');
}

convertCsvToJson();
