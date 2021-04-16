import got from 'got';
import { db } from '../db/db';

export const UNISWAP_TABLE = 'uniswap';

interface UniswapTradeInfo {
    timestamp: number;
    txId: string;
    contract: string;
    buyVolume: number;
    sellVolume: number;
}

export interface UniswapAggregatedInfo {
    buyVolume: number;
    sellVolume: number;
}

export const getAggregatedInfo = async (contract: string, from: number, to: number): Promise<UniswapAggregatedInfo> => {
    return (await db.whereBetween('timestamp', [from, to]).andWhere({
        contract,
    }).select().from(UNISWAP_TABLE)).reduce<UniswapAggregatedInfo>((res, row) => {
        res.buyVolume += row.buyVolume;
        res.sellVolume += row.sellVolume;
        return res;
    }, { buyVolume: 0, sellVolume: 0 });
};

const getLastTimestamp = async (contract: string): Promise<number> => {
    return (await db.where({
        contract,
    }).max({ timestamp: 'timestamp' }).select().from(UNISWAP_TABLE))[0].timestamp || 0;
};

const getOperationsByTimestamp = async (contract: string, timestamp: number): Promise<Array<UniswapTradeInfo>> => {
    return (db.where({
        contract,
        timestamp,
    }).select().from(UNISWAP_TABLE));
};

const addSwaps = async (swaps: Array<UniswapTradeInfo>): Promise<void> => {
    if (swaps.length > 0) {
        const processing = [...swaps];
        while (processing.length > 0) {
            await db.insert(processing.splice(0, 100)).into(UNISWAP_TABLE);
        }
    }
};

export const fetchInfo = async (contract: string): Promise<void> => {
    const pairs = (await got.post({
        responseType: 'json',
        url: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2',
        body: JSON.stringify({
          query: `
          {
             pairs(where: {token0: "${contract}"}) {
               id
             }
           }
          `,
        }),
    })).body as {
        data: {
            pairs: Array<{ id: string }>;
        };
    };

    const pairIds = pairs.data.pairs.map(pair => pair.id);

    const lastTimestamp = await getLastTimestamp(contract);
    const tsxWithSameTimestamp = (await getOperationsByTimestamp(contract, lastTimestamp)).map(swap => swap.txId);

    const swaps = (await got.post({
        responseType: 'json',
        url: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2',
        body: JSON.stringify({
            query: `
                query($pairIds: [String!], $lastTimestamp: Int) {
                 swaps(first: 1000, where: { pair_in: $pairIds, timestamp_gte: $lastTimestamp }, orderBy: timestamp, orderDirection: desc) {
                   timestamp
                   amount0In
                   amount0Out
                   amount1In
                   amount1Out
                   transaction {
                    id
                   }
                 }
                }
            `,
            variables: { pairIds, lastTimestamp: Math.floor(lastTimestamp / 1000) },
        }),
    })).body as {
        data: {
            swaps: Array<{
                timestamp: string;
                amount0In: string;
                amount0Out: string;
                amount1In: string;
                amount1Out: string;
                transaction: {
                    id: string;
                };
            }>;
        };
    };

    const operations: Array<UniswapTradeInfo> = swaps.data.swaps
        .filter(swap => !tsxWithSameTimestamp.includes(swap.transaction.id))
        .map(swap => ({
            contract,
            txId: swap.transaction.id,
            timestamp: Number(Number(swap.timestamp) * 1000),
            buyVolume: Number(swap.amount0In) === 0 ? Number(swap.amount0Out) : 0,
            sellVolume: Number(swap.amount0Out) === 0 ? Number(swap.amount0In) : 0,
        }));

    await addSwaps(operations);
};
