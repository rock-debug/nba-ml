const fs = require('fs');
const stats = JSON.parse(fs.readFileSync('src/data/season_stats.json', 'utf-8'));

const counts = {};
stats.forEach(p => {
    counts[p.name] = (counts[p.name] || 0) + 1;
});

const duplicates = Object.entries(counts).filter(([n, c]) => c > 1);
console.log('Players with multiple entries:', duplicates.length);
console.log('Sample duplicates:', duplicates.slice(0, 5));

// Check specifically for Harden
const harden = stats.filter(p => p.name.includes('Harden'));
console.log('Harden Entries:', harden.map(p => p.team));

// Check for 2TM
const tot = stats.filter(p => ['2TM', '3TM', 'TOT'].includes(p.team));
console.log('Aggregate rows found:', tot.length);
