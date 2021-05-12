import { db } from '../../db/db';
import {getLastSwaps, getPairHourlyData, getPairsByContract} from "./api";

export const UNISWAP_SWAPS_TABLE = 'uniswap_swaps';
export const UNISWAP_HOURLY_DATA_TABLE = 'uniswap_hourly_data';

export interface UniswapPairData {
    totalTxns: number;
    token0Symbol: string;
    token1Symbol: string;
    pooledToken0: number;
    pooledToken1: number;
    lastHourData: {
        volumeUSD: number;
        txns: number;
    };
    last24hData: {
        volumeUSD: number;
        txns: number;
    };
}

interface UniswapPairDataSnapshot {
    timestamp: number;
    token0Symbol: string;
    token1Symbol: string;
    pairId: string;
    tokenContract: string;
    pooledToken0: number;
    pooledToken1: number;
    volumeUSD: number;
    txns: number;
    totalTxns: number;
}

interface UniswapTradeInfo {
    id: string;
    timestamp: number;
    txId: string;
    token0Symbol: string;
    token1Symbol: string;
    pairId: string;
    tokenContract: string;
    buyVolume: number;
    sellVolume: number;
    amountUSD: number;
}

export interface UniswapAggregatedSwapInfo {
    buyVolume: number;
    sellVolume: number;
    amountUSD: number;
}

export const getAggregatedSwapInfo = async (tokenContract: string, from: number, to: number): Promise<UniswapAggregatedSwapInfo> => {
    return (await db.whereBetween('timestamp', [from, to]).andWhere({
        tokenContract,
    }).select().from(UNISWAP_SWAPS_TABLE)).reduce<UniswapAggregatedSwapInfo>((res, row) => {
        res.buyVolume += row.buyVolume;
        res.sellVolume += row.sellVolume;
        res.amountUSD += row.amountUSD;
        return res;
    }, { buyVolume: 0, sellVolume: 0, amountUSD: 0 });
};


export const getPairDatas= async (tokenContract: string): Promise<Array<UniswapPairData>> => {
    const data: Array<UniswapPairDataSnapshot> = (await db.whereBetween('timestamp', [Date.now() - 24 * 60 * 60 * 1000, Date.now()]).andWhere({
        tokenContract,
    }).orderBy('timestamp', 'desc').select().from(UNISWAP_HOURLY_DATA_TABLE));

    if (data.length === 0) {
        const lastRow: UniswapPairDataSnapshot = (await db.where({
            tokenContract,
        }).orderBy('timestamp', 'desc').first().select().from(UNISWAP_HOURLY_DATA_TABLE));

        if (lastRow) {
            lastRow.txns = 0;
            lastRow.volumeUSD = 0;
            data.push(lastRow);
        }
    }

    const result: Record<string, UniswapPairData> = {};
    data.map(row => {
        if (!result[row.pairId]) {
            result[row.pairId] = {
                token0Symbol: row.token0Symbol,
                token1Symbol: row.token1Symbol,
                totalTxns: row.totalTxns,
                pooledToken0: row.pooledToken0,
                pooledToken1: row.pooledToken1,
                lastHourData: {
                    txns: row.txns,
                    volumeUSD: row.volumeUSD,
                },
                last24hData: {
                    txns: row.txns,
                    volumeUSD: row.volumeUSD,
                },
            };
        } else {
            const aggregated24h = result[row.pairId].last24hData;
            result[row.pairId].last24hData = {
                ...aggregated24h,
                volumeUSD: aggregated24h.volumeUSD + row.volumeUSD,
                txns: aggregated24h.txns + row.txns,
            }
        }
    });

    return Object.values(result);
};

const getLastSwapTimestamp = async (pairId: string): Promise<number> => {
    return (await db.where({
        pairId,
    }).max({ timestamp: 'timestamp' }).select().from(UNISWAP_SWAPS_TABLE))[0].timestamp || 0;
};

const getLastHourlyDataTimestamp = async (pairId: string): Promise<number> => {
    return (await db.where({
        pairId,
    }).max({ timestamp: 'timestamp' }).select().from(UNISWAP_HOURLY_DATA_TABLE))[0].timestamp || 0;
};

const addSwaps = async (swaps: Array<UniswapTradeInfo>): Promise<void> => {
    if (swaps.length > 0) {
        const processing = [...swaps];
        while (processing.length > 0) {
            const bunch = processing.splice(0, 100);
            await db(UNISWAP_SWAPS_TABLE).delete().whereIn('id', bunch.map(swap => swap.id));
            await db.insert(bunch).into(UNISWAP_SWAPS_TABLE);
        }
    }
};

const addHourlyDatas = async (hourlyDatas: Array<UniswapPairDataSnapshot>, pairId: string): Promise<void> => {
    if (hourlyDatas.length > 0) {
        const processing = [...hourlyDatas];
        while (processing.length > 0) {
            const bunch = processing.splice(0, 100);
            await db(UNISWAP_HOURLY_DATA_TABLE).delete()
                .whereIn('timestamp', bunch.map(hourlyData => hourlyData.timestamp))
                .andWhere({
                    pairId,
                })
            await db.insert(bunch).into(UNISWAP_HOURLY_DATA_TABLE);
        }
    }
}

const fetchSwaps = async (contract: string): Promise<void> => {
    const pairs = await getPairsByContract(contract);

    const operations: Array<UniswapTradeInfo> = [];
    await Promise.all(pairs.data.pairs.map(async pair => {
        const lastTimestamp = await getLastSwapTimestamp(contract);
        const swaps = await getLastSwaps(pair.id, lastTimestamp);
        operations.push(...swaps.data.swaps
            .map(swap => ({
                id: swap.id,
                token0Symbol: pair.token0.symbol,
                token1Symbol: pair.token1.symbol,
                tokenContract: contract,
                pairId: swap.pair.id,
                txId: swap.transaction.id,
                timestamp: Number(Number(swap.timestamp) * 1000),
                buyVolume: Number(swap.amount0In) === 0 ? Number(swap.amount0Out) : 0,
                sellVolume: Number(swap.amount0Out) === 0 ? Number(swap.amount0In) : 0,
                amountUSD: Number(swap.amountUSD),
            }))
        );
    }));

    await addSwaps(operations);
}

const fetchPairInfo = async (tokenContract: string): Promise<void> => {
    const pairs =  await getPairsByContract(tokenContract);

    await Promise.all(pairs.data.pairs.map(async pair => {
        const lastTimestamp = await getLastHourlyDataTimestamp(pair.id);
        const pairHourDatas = await getPairHourlyData(pair.id, lastTimestamp);

        const houryDatas = pairHourDatas.data.pairHourDatas.map(pairHourData => ({
            timestamp: Number(Number(pairHourData.hourStartUnix) * 1000),
            token0Symbol: pair.token0.symbol,
            token1Symbol: pair.token1.symbol,
            pairId: pair.id,
            tokenContract: tokenContract,
            pooledToken0: Number(pairHourData.reserve0),
            pooledToken1: Number(pairHourData.reserve1),
            volumeUSD: Number(pairHourData.hourlyVolumeUSD),
            txns: Number(pairHourData.hourlyTxns),
            totalTxns: Number(pair.txCount),
        }));
        await addHourlyDatas(houryDatas, pair.id);
    }));
}

export const fetchInfo = async (tokenContract: string): Promise<void> => {
    await fetchSwaps(tokenContract);
    await fetchPairInfo(tokenContract);
};
