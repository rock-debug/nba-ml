const fs = require('fs');
const path = require('path');
const readline = require('readline');

const PBP_CSV = path.join(__dirname, '../data/pbp_events.csv');

async function analyze() {
    const fileStream = fs.createReadStream(PBP_CSV);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let isHeader = true;
    for await (const line of rl) {
        if (isHeader) {
            console.log('HEADER:', line);
            isHeader = false;
            continue;
        }

        if (line.includes('BLOCK')) {
            console.log('BLOCK LINE:', line);
            break;
        }
    }
}

analyze();
