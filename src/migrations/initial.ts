import { Knex } from 'knex';
import {UNISWAP_SWAPS_TABLE, UNISWAP_HOURLY_DATA_TABLE} from '../trackers/uniswap';
import { COINGECKO_TABLE } from '../trackers/coingecko';
import { ETHPLORER_TABLE } from "../trackers/ethplorer";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable(COINGECKO_TABLE, table => {
        table.timestamp('timestamp');
        table.string('contract');
        table.float('usdPrice');
        table.float('btcPrice');
        table.float('usdVolume');
        table.float('btcVolume');
    });

    await knex.schema.createTable(UNISWAP_SWAPS_TABLE, table => {
        table.string('id').primary();
        table.timestamp('timestamp');
        table.string('token0Symbol');
        table.string('token1Symbol');
        table.string('txId');
        table.string('pairId');
        table.string('tokenContract');
        table.float('buyVolume');
        table.float('sellVolume');
        table.float('amountUSD');
    });

    await knex.schema.createTable(UNISWAP_HOURLY_DATA_TABLE, table => {
        table.timestamp('timestamp');
        table.string('pairId');
        table.string('token0Symbol');
        table.string('token1Symbol');
        table.string('tokenContract');
        table.string('pooledToken0');
        table.string('pooledToken1');
        table.float('volumeUSD');
        table.float('txns');
        table.float('totalTxns');
    });

    await knex.schema.createTable(ETHPLORER_TABLE, table => {
        table.timestamp('timestamp');
        table.string('contract');
        table.float('transfersCount');
        table.float('holdersCount');
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable(ETHPLORER_TABLE);
    await knex.schema.dropTable(UNISWAP_HOURLY_DATA_TABLE);
    await knex.schema.dropTable(UNISWAP_SWAPS_TABLE);
    await knex.schema.dropTable(COINGECKO_TABLE);
}
