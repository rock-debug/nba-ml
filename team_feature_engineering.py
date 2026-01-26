import pandas as pd

df = pd.read_csv("data/team_games.csv")

df["WIN"] = (df["PLUS_MINUS"] > 0).astype(int)
df["BLOWOUT"] = (df["PLUS_MINUS"].abs() >= 15).astype(int)

float_cols = df.select_dtypes(include=["float64"]).columns
df[float_cols] = df[float_cols].astype("float32")

int_cols = df.select_dtypes(include=["int64"]).columns
df[int_cols] = df[int_cols].astype("int16")

df.to_csv("data/team_games_clean.csv", index=False)
