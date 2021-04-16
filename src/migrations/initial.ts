import { Knex } from 'knex';
import { UNISWAP_TABLE } from '../trackers/uniswap';
import { COINGECO_TABLE } from '../trackers/coingeco';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable(COINGECO_TABLE, table => {
        table.timestamp('timestamp');
        table.string('contract');
        table.float('usdPrice');
        table.float('btcPrice');
        table.float('usdVolume');
        table.float('btcVolume');
    });

    await knex.schema.createTable(UNISWAP_TABLE, table => {
        table.timestamp('timestamp');
        table.string('txId');
        table.string('contract');
        table.float('buyVolume');
        table.float('sellVolume');
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable(UNISWAP_TABLE);
    await knex.schema.dropTable(COINGECO_TABLE);
}
