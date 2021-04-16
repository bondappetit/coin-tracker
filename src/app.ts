require('dotenv').config()
import { startManager } from './manager';
import { runMugrations } from './db/db';

const start = async () => {
    await runMugrations();
    await startManager();
};

start().catch(e => {
    console.error(e);
    process.exit(1);
});
