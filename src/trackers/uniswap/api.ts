import got from "got";

export interface Swap {
    id: string;
    timestamp: string;
    amount0In: string;
    amount0Out: string;
    amount1In: string;
    amount1Out: string;
    amountUSD: string;
    pair: {
        id: string;
    };
    transaction: {
        id: string;
    };
}

export interface Token {
    id: string;
    symbol: string;
    name: string;
}

export interface Pair {
    id: string;
    token0: Token;
    token1: Token;
    reserve0: string;
    reserve1: string
    reserveUSD: string
    txCount: string;
}


export interface PairHourlData {
    id: string;
    hourStartUnix: string;
    hourlyTxns: string;
    reserve0: string;
    reserve1: string;
    reserveUSD: string;
    hourlyVolumeToken0: string;
    hourlyVolumeToken1: string;
    hourlyVolumeUSD: string;
    pair: {
        token0: Token;
        token1: Token;
    }
}

const BASE_URL = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2';

export const getPairsByContract = async (contract: string) => (await got.post({
    responseType: 'json',
    url: BASE_URL,
    body: JSON.stringify({
        query: `
          query($token0Id: String) {
             pairs(where: {token0: $token0Id}) {
               id
               token0 {
                 id
                 symbol
                 name
               }
               token1 {
                 id
                 symbol
                 name
               }
               reserve0
               reserve1
               reserveUSD
               txCount
             }
           }
          `,
        variables: { token0Id: contract },
    }),
})).body as {
    data: {
        pairs: Array<Pair>;
    };
};


export const getLastSwaps = async (pairId: string, lastTimestamp: number) => (await got.post({
    responseType: 'json',
    url: BASE_URL,
    body: JSON.stringify({
        query: `
                query($pairId: String, $lastTimestamp: Int) {
                 swaps(first: 1000, where: { pair: $pairId, timestamp_gte: $lastTimestamp }, orderBy: timestamp, orderDirection: desc) {
                   id
                   timestamp
                   amount0In
                   amount0Out
                   amount1In
                   amount1Out
                   amountUSD,
                   pair {
                    id
                   }
                   transaction {
                    id
                   }
                 }
                }
            `,
        variables: { pairId, lastTimestamp: Math.floor(lastTimestamp / 1000) },
    }),
})).body as {
    data: {
        swaps: Array<Swap>;
    };
};

export const getPairHourlyData = async (pairId: string, lastTimestamp: number) => {
    const res = (await got.post({
        responseType: 'json',
        url: BASE_URL,
        body: JSON.stringify({
            query: `
                query($pairId: String, $lastTimestamp: Int) {
                     pairHourDatas(first: 24, orderBy: hourStartUnix, orderDirection: desc,
                       where: { pair: $pairId, hourStartUnix_gte: $lastTimestamp }
                     ) {
                        id
                        hourStartUnix
                        hourlyTxns
                        reserve0
                        reserve1
                        reserveUSD
                        hourlyVolumeToken0
                        hourlyVolumeToken1
                        hourlyVolumeUSD
                        pair {
                           token0 {
                             id
                             symbol
                             name
                           }
                           token1 {
                             id
                             symbol
                             name
                           }
                        }
                     }
                }
                `,
            variables: { pairId, lastTimestamp: Math.floor(lastTimestamp / 1000) },
        }),
    })).body as {
        data: {
            pairHourDatas: Array<PairHourlData>;
        };
    };

    res.data.pairHourDatas.forEach(data => {
        // Проблема на стороне API
        if (Number(data.hourlyVolumeUSD) === 0 && Number(data.hourlyVolumeToken1) > 0 && data.pair.token1.symbol.indexOf("USD") > -1) {
            data.hourlyVolumeUSD = data.hourlyVolumeToken1;
        }
    });

    return res;
}
