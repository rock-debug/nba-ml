from nba_api.stats.endpoints import (
    leaguegamelog,
    playbyplayv3,
    shotchartdetail
)
import pandas as pd
import time
import os
from tqdm import tqdm

SEASON = "2023-24"
DATA_DIR = "data"

PBP_FILE = f"{DATA_DIR}/pbp_events.csv"
SHOTS_FILE = f"{DATA_DIR}/shots.csv"
PROCESSED_FILE = f"{DATA_DIR}/processed_games.txt"

CHUNK_SIZE = 50
SLEEP_BETWEEN_CALLS = 1.5
COOLDOWN_BETWEEN_CHUNKS = 30
MAX_RETRIES = 5

os.makedirs(DATA_DIR, exist_ok=True)

# ---------------- helpers ----------------

def get_game_ids(season):
    df = leaguegamelog.LeagueGameLog(season=season).get_data_frames()[0]
    return df["GAME_ID"].astype(str).unique().tolist()

def load_processed():
    if os.path.exists(PROCESSED_FILE):
        with open(PROCESSED_FILE) as f:
            return set(f.read().splitlines())
    return set()

def mark_processed(game_id):
    with open(PROCESSED_FILE, "a") as f:
        f.write(str(game_id) + "\n")

def append_csv(path, df):
    write_header = not os.path.exists(path)
    df.to_csv(path, mode="a", header=write_header, index=False)

# ---------------- main ----------------

def download_games(game_ids):
    processed = load_processed()
    pending = [g for g in game_ids if g not in processed]

    print(f"Already downloaded: {len(processed)}")
    print(f"Remaining games: {len(pending)}")

    chunks = [
        pending[i:i + CHUNK_SIZE]
        for i in range(0, len(pending), CHUNK_SIZE)
    ]

    for ci, chunk in enumerate(chunks, 1):
        print(f"\n=== Chunk {ci}/{len(chunks)} ({len(chunk)} games) ===")

        for game_id in tqdm(chunk):
            retries = 0
            success = False

            while not success and retries < MAX_RETRIES:
                try:
                    # -------- Play by play (V3) --------
                    pbp = playbyplayv3.PlayByPlayV3(
                        game_id=game_id,
                        timeout=60
                    )
                    pbp_frames = pbp.get_data_frames()
                    if not pbp_frames or pbp_frames[0].empty:
                        raise ValueError("Empty PBP response")

                    pbp_df = pbp_frames[0]
                    pbp_df["GAME_ID"] = game_id

                    # -------- Shot chart --------
                    shots = shotchartdetail.ShotChartDetail(
                        team_id=0,
                        player_id=0,
                        game_id_nullable=game_id,
                        season_nullable=SEASON,
                        context_measure_simple="FGA",
                        timeout=60
                    )
                    shot_frames = shots.get_data_frames()
                    if not shot_frames or shot_frames[0].empty:
                        raise ValueError("Empty ShotChart response")

                    shots_df = shot_frames[0]
                    shots_df["GAME_ID"] = game_id

                    # -------- Write --------
                    append_csv(PBP_FILE, pbp_df)
                    append_csv(SHOTS_FILE, shots_df)

                    mark_processed(game_id)
                    success = True
                    time.sleep(SLEEP_BETWEEN_CALLS)

                except Exception as e:
                    retries += 1
                    wait = 2 ** retries
                    print(
                        f"Retry {retries}/{MAX_RETRIES} on {game_id}: {e} "
                        f"-> waiting {wait}s"
                    )
                    time.sleep(wait)

            if not success:
                print(f"Skipped {game_id} after {MAX_RETRIES} retries")

        print(f"\nChunk complete. Cooling {COOLDOWN_BETWEEN_CHUNKS}s...")
        time.sleep(COOLDOWN_BETWEEN_CHUNKS)

# ---------------- entry ----------------

if __name__ == "__main__":
    game_ids = get_game_ids(SEASON)
    download_games(game_ids)
