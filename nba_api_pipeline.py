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


def get_game_ids(season):
    df = leaguegamelog.LeagueGameLog(season=season).get_data_frames()[0]
    return df["GAME_ID"].unique().tolist()


def normalize_columns(df):
    df.columns = (
        df.columns
        .str.upper()
        .str.replace(" ", "_")
        .str.replace("%", "_PCT")
    )
    return df


def extract_team_advanced(adv_frames):
    for df in adv_frames:
        df = normalize_columns(df)
        if "TEAM_ID" in df.columns and "PACE" in df.columns:
            return df
    return None


def stream_boxscores(game_ids):
    team_written = False
    player_written = False

    for game_id in tqdm(game_ids):
        try:
            trad = boxscoretraditionalv3.BoxScoreTraditionalV3(game_id=game_id)
            adv = boxscoreadvancedv3.BoxScoreAdvancedV3(game_id=game_id)

            trad_frames = trad.get_data_frames()
            adv_frames = adv.get_data_frames()

            player_df = normalize_columns(trad_frames[0])
            team_df = normalize_columns(trad_frames[1])

            team_adv = extract_team_advanced(adv_frames)

            if team_adv is not None:
                adv_keep = [c for c in ["TEAM_ID", "OFFENSIVE_RATING", "DEFENSIVE_RATING", "PACE", "TS_PCT"] if c in team_adv.columns]
                if "TEAM_ID" in adv_keep:
                    team_df = team_df.merge(
                        team_adv[adv_keep],
                        on="TEAM_ID",
                        how="left"
                    )

            team_df["GAME_ID"] = game_id
            player_df["GAME_ID"] = game_id

            team_df.to_csv(TEAM_FILE, mode="a", header=not team_written, index=False)
            player_df.to_csv(PLAYER_FILE, mode="a", header=not player_written, index=False)

            team_written = True
            player_written = True

            time.sleep(0.7)

        except Exception as e:
            print(f"Failed on game {game_id}: {e}")


if __name__ == "__main__":
    game_ids = get_game_ids(SEASON)
    stream_boxscores(game_ids)
