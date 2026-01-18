export function migrateDbIfNeeded(db: any): void {
  console.log('migratedDbIfNeeded Web');
  const DATABASE_VERSION = 1;
  //let { user_version: currentDbVersion } = db.exec<{ user_version: number; }>('PRAGMA user_version');
  const user_version =  db.exec('PRAGMA user_version');
  const currentDbVersion = user_version.length > 0 && user_version[0].values.length > 0 
      ? user_version[0].values[0][0] as number 
      : 0;
  if (currentDbVersion >= DATABASE_VERSION) {
    console.log('No migration needed v',currentDbVersion);
    return;
  }
  if (currentDbVersion === 0) {
   db.run(`
PRAGMA journal_mode = 'wal';
CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY NOT NULL, done INT, value TEXT);
`);
   //currentDbVersion = 1;
  }
  // if (currentDbVersion === 1) {
  //   Add more migrations
  // }
  //console.log(db.exec(`PRAGMA user_version = ${DATABASE_VERSION}`));
  db.run(`PRAGMA user_version = ${DATABASE_VERSION}`);
  console.log('Migration completed, version set to', DATABASE_VERSION);
}
