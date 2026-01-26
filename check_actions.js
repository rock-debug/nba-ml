const fs = require('fs');
const readline = require('readline');
const path = require('path');

const CSV_PATH = path.join(__dirname, '../data/shots.csv');

async function checkActionTypes() {
    const actions = {};

    const fileStream = fs.createReadStream(CSV_PATH);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let isHeader = true;
    for await (const line of rl) {
        if (isHeader) {
            console.log('Header:', line.split(',').slice(0, 15).join(' | '));
            isHeader = false;
            continue;
        }

        const cols = line.split(',');
        const actionType = cols[11]; // ACTION_TYPE

        actions[actionType] = (actions[actionType] || 0) + 1;
    }

    console.log('\nAction Types:');
    const sorted = Object.entries(actions).sort((a, b) => b[1] - a[1]);
    sorted.forEach(([action, count]) => {
        console.log(`  ${action}: ${count}`);
    });
}

checkActionTypes();
