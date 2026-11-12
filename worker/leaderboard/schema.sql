CREATE TABLE IF NOT EXISTS scores (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 player_name TEXT NOT NULL CHECK(length(player_name) BETWEEN 1 AND 18),
 score INTEGER NOT NULL CHECK(score BETWEEN 1 AND 1000000),
 coins INTEGER NOT NULL DEFAULT 0,
 near_misses INTEGER NOT NULL DEFAULT 0,
 ip_hash TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_scores_rank ON scores(score DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_scores_ip_time ON scores(ip_hash, created_at);
