import { db } from '../../db/db';
import { getCoinInfoByContract } from "./api";

export const COINGECKO_TABLE = 'coingecko';

export interface CoinGeckoInfo {
    timestamp: number;
    contract: string;
    usdPrice: number;
    btcPrice: number;
    usdVolume: number;
    btcVolume: number;
}

export const getActualInfo = async (contract: string): Promise<CoinGeckoInfo> => {
    return (await db.where({
        contract,
    }).first().orderBy('timestamp', 'desc').select().from(COINGECKO_TABLE)) || {
        timestamp: Date.now(),
        contract,
        usdPrice: 0,
        btcPrice: 0,
        usdVolume: 0,
        btcVolume: 0,
    };
};

const addNewData = async (data: CoinGeckoInfo): Promise<void> => {
    await db.insert(data).into(COINGECKO_TABLE);
};

export const fetchInfo = async (contract: string): Promise<void> => {
    const curencyInfo = await getCoinInfoByContract(contract);

    const data: Omit<CoinGeckoInfo, 'id'> = {
        timestamp: Date.now(),
        contract,
        usdPrice: curencyInfo.market_data.current_price.usd,
        btcPrice: curencyInfo.market_data.current_price.btc,
        usdVolume: curencyInfo.market_data.total_volume.usd,
        btcVolume: curencyInfo.market_data.total_volume.btc,
    };

    await addNewData(data);
};
