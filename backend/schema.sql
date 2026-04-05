CREATE TABLE IF NOT EXISTS users (
  client_id TEXT PRIMARY KEY,
  country TEXT,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_usage (
  client_id TEXT NOT NULL,
  date TEXT NOT NULL,
  requests INTEGER DEFAULT 0,
  flagged INTEGER DEFAULT 0,
  PRIMARY KEY (client_id, date),
  FOREIGN KEY (client_id) REFERENCES users(client_id)
);
