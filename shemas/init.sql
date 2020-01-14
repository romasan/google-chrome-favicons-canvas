CREATE TABLE IF NOT EXISTS "colors" (
	"id"		INTEGER PRIMARY KEY AUTOINCREMENT,
	"dec"		INTEGER NOT NULL,
	"hex"		TEXT NOT NULL,
	"path"		TEXT,
	"hash"		TEXT UNIQUE,
	"image"		BLOB,
	"width"		INTEGER,
	"height"	INTEGER
);