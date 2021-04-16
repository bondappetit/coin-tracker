import got from 'got';
import { db } from '../db/db';

export const COINGECO_TABLE = 'coingeco';

export interface CoinGecoInfo {
    timestamp: number;
    contract: string;
    usdPrice: number;
    btcPrice: number;
    usdVolume: number;
    btcVolume: number;
}

export const getActualInfo = async (contract: string): Promise<CoinGecoInfo> => {
    return (await db.where({
        contract,
    }).first().orderBy('timestamp', 'desc').select().from(COINGECO_TABLE)) || {
        timestamp: Date.now(),
        contract,
        usdPrice: 0,
        btcPrice: 0,
        usdVolume: 0,
        btcVolume: 0,
    };
};

const addNewData = async (data: CoinGecoInfo): Promise<void> => {
    await db.insert(data).into(COINGECO_TABLE);
};

export const fetchInfo = async (contract: string): Promise<void> => {
    const res = (await got.get({
        responseType: 'json',
        url: `https://api.coingecko.com/api/v3//coins/ethereum/contract/${contract}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
    })).body as {
        market_data: {
            current_price: {
                usd: number;
                btc: number;
            };
            total_volume: {
                usd: number;
                btc: number;
            };
        };
    };

    const data: Omit<CoinGecoInfo, 'id'> = {
        timestamp: Date.now(),
        contract,
        usdPrice: res.market_data.current_price.usd,
        btcPrice: res.market_data.current_price.btc,
        usdVolume: res.market_data.total_volume.usd,
        btcVolume: res.market_data.total_volume.btc,
    };

    await addNewData(data);
};
