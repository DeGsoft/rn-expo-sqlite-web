import { migrateDbIfNeeded } from "@/services/database/migrateDbIfNeeded";
import { SQLiteProvider } from "@/services/database/SQLiteProvider";
import { Stack } from "expo-router";

export default function RootLayout() {

  return <SQLiteProvider databaseName="db.db" onInit={migrateDbIfNeeded}>
    <Stack />
  </SQLiteProvider>;
}
