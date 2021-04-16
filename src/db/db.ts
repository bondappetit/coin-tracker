import * as config from 'config';
import Knex from 'knex';

const sqlLiteFilename = config.get<string>('db.file');

export const db = Knex({
    client: 'sqlite3',
    connection: {
        filename: sqlLiteFilename,
    },
});

export const runMugrations = async () => db.migrate.latest({
    directory: `${__dirname}/../migrations`,
    extension: 'js',
    loadExtensions: ['.js'],
});
