const fs = require('fs');
const path = require('path');

const SHOTS_JSON = path.join(__dirname, '../src/data/shots.json');
const shots = JSON.parse(fs.readFileSync(SHOTS_JSON, 'utf-8'));

const zones = {};
shots.forEach(s => {
    zones[s.zone_basic] = (zones[s.zone_basic] || 0) + 1;
});

console.log('Unique Shot Zones:', zones);
