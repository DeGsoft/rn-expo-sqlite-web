  export async function migrateDbIfNeeded(db: any): Promise<void> {
  /*  const DATABASE_VERSION = 1;
  let { user_version: currentDbVersion } = await db.getFirstAsync<{
    user_version: number;
  }>('PRAGMA user_version');
  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }
  if (currentDbVersion === 0) {
    await db.execAsync(`
PRAGMA journal_mode = 'wal';
CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY NOT NULL, done INT, value TEXT);
`);
    currentDbVersion = 1;
  }
  // if (currentDbVersion === 1) {
  //   Add more migrations
  // }
  console.log(await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`));
*/
console.log('migratedDbIfNeeded Native');
  }