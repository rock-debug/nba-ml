import json
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from collections import defaultdict

# Load data
with open('src/data/shots.json', 'r', encoding='utf-8') as f:
    shots = json.load(f)

with open('src/data/season_stats.json', 'r', encoding='utf-8') as f:
    stats = json.load(f)

print("Building player shot profiles...")

# Build player features
player_shots = defaultdict(lambda: {
    'Restricted Area': 0,
    'In The Paint (Non-RA)': 0,
    'Mid-Range': 0,
    'Above the Break 3': 0,
    'Left Corner 3': 0,
    'Right Corner 3': 0,
    'total': 0,
    'made': 0,
    'threes': 0,
    'twos': 0,
    # Action types
    'drives': 0,      # Driving Layup, Driving Dunk, etc.
    'post_ups': 0,    # Hook shots, Turnaround, Fadeaway
    'step_backs': 0,  # Step Back
    'pullups': 0      # Pullup Jump Shot
})

# Count shots by zone and action for each player
for shot in shots:
    player = shot['player']
    zone = shot['zone_basic']
    action = shot.get('action_type', '')
    
    player_shots[player]['total'] += 1
    if shot['made']:
        player_shots[player]['made'] += 1
    
    if zone in player_shots[player]:
        player_shots[player][zone] += 1
    
    if '3PT' in shot['type']:
        player_shots[player]['threes'] += 1
    else:
        player_shots[player]['twos'] += 1
    
    # Classify action types
    action_lower = action.lower()
    if 'driving' in action_lower:
        player_shots[player]['drives'] += 1
    elif 'hook' in action_lower or 'turnaround' in action_lower or 'fadeaway' in action_lower:
        player_shots[player]['post_ups'] += 1
    elif 'step back' in action_lower:
        player_shots[player]['step_backs'] += 1
    elif 'pullup' in action_lower or 'pull-up' in action_lower:
        player_shots[player]['pullups'] += 1

print(f"Processed shots for {len(player_shots)} players")

# Create feature vectors (percentages only)
features = []
player_names = []
min_shots = 50

for player_stat in stats:
    name = player_stat['name']
    
    # Try exact match first
    shot_profile = player_shots.get(name)
    
    # If not found, try matching by last name
    if not shot_profile or shot_profile['total'] < min_shots:
        last_name = name.split(' ')[-1] if ' ' in name else name
        for shot_player_name in player_shots.keys():
            if shot_player_name.endswith(last_name) or shot_player_name.split(' ')[-1] == last_name:
                shot_profile = player_shots[shot_player_name]
                break
    
    if not shot_profile or shot_profile['total'] < min_shots:
        continue
    
    total_shots = shot_profile['total']
    total_contrib = player_stat['pts'] + player_stat['reb'] + player_stat['ast']
    
    # Calculate percentages for features
    feature_vec = [
        # Shot zone distribution (%)
        shot_profile['Restricted Area'] / total_shots * 100,
        shot_profile['In The Paint (Non-RA)'] / total_shots * 100,
        shot_profile['Mid-Range'] / total_shots * 100,
        shot_profile['Above the Break 3'] / total_shots * 100,
        (shot_profile['Left Corner 3'] + shot_profile['Right Corner 3']) / total_shots * 100,
        
        # Shot selection (%) - Moderately weighted
        (shot_profile['threes'] / total_shots * 100) * 1.3,  # 3PT attempt rate
        
        # Efficiency
        shot_profile['made'] / total_shots * 100,
        
        # Action types (%) - NEW FEATURES
        shot_profile['drives'] / total_shots * 100,
        shot_profile['post_ups'] / total_shots * 100,
        shot_profile['step_backs'] / total_shots * 100,
        shot_profile['pullups'] / total_shots * 100,
        
        # Play style (as % of total contributions) - Moderately weighted
        player_stat['reb'] / total_contrib * 100 if total_contrib > 0 else 0,
        (player_stat['ast'] / total_contrib * 100 * 1.5) if total_contrib > 0 else 0,  # Assist % (moderate emphasis)
        
        # Defense
        player_stat['stl'] / player_stat['gp'] if player_stat['gp'] > 0 else 0,
        player_stat['blk'] / player_stat['gp'] if player_stat['gp'] > 0 else 0,
    ]
    
    features.append(feature_vec)
    player_names.append(name)

print(f"Created features for {len(features)} qualified players")

# Convert to numpy array
X = np.array(features)

# Standardize features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Apply K-Means clustering
n_clusters = 12
kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
clusters = kmeans.fit_predict(X_scaled)

print(f"\nClustering into {n_clusters} player archetypes...")

# Analyze clusters
cluster_names = [
    "Offensive Engine Bigs",
    "Traditional Centers",
    "Stretch Bigs",
    "Rim Runners",
    "Corner 3 Specialists",
    "Volume 3PT Shooters",
    "Elite Scorers",
    "Mid-Range Scorers",
    "Playmaking Guards",
    "Two-Way Wings",
    "Slashers",
    "Role Players"
]

# Save results
results = []
for i, name in enumerate(player_names):
    # Find full stats
    player_full = next((p for p in stats if p['name'] == name), None)
    
    results.append({
        'name': name,
        'team': player_full['team'] if player_full else '',
        'cluster': int(clusters[i]),
        'archetype': cluster_names[clusters[i]] if clusters[i] < len(cluster_names) else f"Type {clusters[i]}",
        'features': {
            'restricted_area_pct': round(features[i][0], 1),
            'paint_pct': round(features[i][1], 1),
            'midrange_pct': round(features[i][2], 1),
            'above_break_3_pct': round(features[i][3], 1),
            'corner_3_pct': round(features[i][4], 1),
            'three_pt_rate': round(features[i][5] / 1.3, 1),  # Unweight for display
            'fg_pct': round(features[i][6], 1),
            'drive_pct': round(features[i][7], 1),
            'postup_pct': round(features[i][8], 1),
            'stepback_pct': round(features[i][9], 1),
            'pullup_pct': round(features[i][10], 1),
            'rebound_contribution': round(features[i][11], 1),
            'assist_contribution': round(features[i][12] / 1.5, 1)  # Unweight for display
        }
    })

# Print cluster summaries
print("\nCluster Summaries:")
for cluster_id in range(n_clusters):
    cluster_players = [r for r in results if r['cluster'] == cluster_id]
    print(f"\n{cluster_names[cluster_id] if cluster_id < len(cluster_names) else f'Cluster {cluster_id}'} ({len(cluster_players)} players)")
    
    # Show top 5 players
    sample = cluster_players[:5]
    for p in sample:
        try:
            print(f"  - {p['name']} ({p['team']})")
        except UnicodeEncodeError:
            safe_name = p['name'].encode('ascii', 'ignore').decode('ascii')
            print(f"  - {safe_name} ({p['team']})")

# Save to JSON
with open('src/data/player_clusters.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print(f"\nSaved clustering results to src/data/player_clusters.json")
