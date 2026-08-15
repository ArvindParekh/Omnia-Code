import path from "node:path";
import { createAppServer } from "@omnia/app-server";
import { SqliteEventStore } from "@omnia/persistence";
import { app } from "electron";

const dbPath = path.join(app.getPath("userData"), "omnia.db");

export const appServer = createAppServer({ eventStore: new SqliteEventStore(dbPath) });
