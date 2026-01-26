from nba_api.stats.endpoints import leaguegamelog, boxscoretraditionalv3, boxscoreadvancedv3
import pandas as pd
import time
from tqdm import tqdm
import os

SEASON = "2023-24"
OUTPUT_DIR = "data"
TEAM_FILE = f"{OUTPUT_DIR}/team_games.csv"
PLAYER_FILE = f"{OUTPUT_DIR}/player_games.csv"

os.makedirs(OUTPUT_DIR, exist_ok=True)

# Utility functions


def normalize_columns(df):
    df.columns = (
        df.columns
        .str.upper()
        .str.replace(" ", "_")
        .str.replace("%", "_PCT")
    )
    return df

def deduplicate_csv(path, key_cols):
    if not os.path.exists(path):
        return

    df = pd.read_csv(path)

    # Fit key columns to available columns
    available_keys = [col for col in key_cols if col in df.columns]

    if not available_keys:
        # Fallback: attempt common variants
        fallback_map = {
            "GAME_ID": ["GAMEID", "GAME ID", "GAME_ID_x", "gameId"],
            "TEAM_ID": ["TEAMID", "TEAM ID", "TEAM_ID_x", "teamId"],
            "PLAYER_ID": ["PLAYERID", "PLAYER ID", "PLAYER_ID_x", "playerId"]
        }

        real_keys = []
        for key in key_cols:
            if key in df.columns:
                real_keys.append(key)
            else:
                for variant in fallback_map.get(key, []):
                    if variant in df.columns:
                        real_keys.append(variant)
                        break

        if not real_keys:
            print(f"Dedup skipped: no usable key columns found in {path}")
            return

        available_keys = real_keys

    df.drop_duplicates(subset=available_keys, inplace=True)
    df.to_csv(path, index=False)



def load_existing_game_ids():
    if os.path.exists(TEAM_FILE):
        df = pd.read_csv(TEAM_FILE, usecols=["GAME_ID"])
        return set(df["GAME_ID"].unique())
    return set()


def extract_team_advanced(adv_frames):
    for df in adv_frames:
        df = normalize_columns(df)
        if "TEAM_ID" in df.columns and ("PACE" in df.columns or "TS_PCT" in df.columns):
            return df
    return None


def get_game_ids(season):
    df = leaguegamelog.LeagueGameLog(season=season).get_data_frames()[0]
    return df["GAME_ID"].unique().tolist()

# Main streaming pipeline

def stream_boxscores(game_ids):

    # Remove existing duplicates
    deduplicate_csv(TEAM_FILE, ["GAME_ID", "TEAM_ID"])
    deduplicate_csv(PLAYER_FILE, ["GAME_ID", "PLAYER_ID"])

    existing_ids = load_existing_game_ids()

    team_written = os.path.exists(TEAM_FILE)
    player_written = os.path.exists(PLAYER_FILE)

    for game_id in tqdm(game_ids):

        if game_id in existing_ids:
            continue

        retries = 0
        success = False

        while retries < 5 and not success:
            try:
                trad = boxscoretraditionalv3.BoxScoreTraditionalV3(game_id=game_id, timeout=60)
                adv = boxscoreadvancedv3.BoxScoreAdvancedV3(game_id=game_id, timeout=60)

                trad_frames = trad.get_data_frames()
                adv_frames = adv.get_data_frames()

                player_df = normalize_columns(trad_frames[0])
                team_df = normalize_columns(trad_frames[1])

                team_adv = extract_team_advanced(adv_frames)

                if team_adv is not None:
                    adv_keep = [
                        c for c in ["TEAM_ID", "OFFENSIVE_RATING", "DEFENSIVE_RATING",
                                    "PACE", "TS_PCT"]
                        if c in team_adv.columns
                    ]
                    if "TEAM_ID" in adv_keep:
                        team_df = team_df.merge(team_adv[adv_keep], on="TEAM_ID", how="left")

                team_df["GAME_ID"] = game_id
                player_df["GAME_ID"] = game_id

                team_df.to_csv(TEAM_FILE, mode="a", header=not team_written, index=False)
                player_df.to_csv(PLAYER_FILE, mode="a", header=not player_written, index=False)

                team_written = True
                player_written = True
                success = True

                time.sleep(1)

            except Exception as e:
                retries += 1
                wait = 2 ** retries
                print(f"Retry {retries}/5 on {game_id}: {e} — waiting {wait}s")
                time.sleep(wait)

        if not success:
            print(f"Skipped {game_id} after 5 retries.")

    deduplicate_csv(TEAM_FILE, ["GAME_ID", "TEAM_ID"])
    deduplicate_csv(PLAYER_FILE, ["GAME_ID", "PLAYER_ID"])
# Entry point


if __name__ == "__main__":
    game_ids = get_game_ids(SEASON)
    stream_boxscores(game_ids)
