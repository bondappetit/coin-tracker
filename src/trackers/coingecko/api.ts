import got from "got";

export interface CoinInfo {
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
}

export const getCoinInfoByContract = async (contract: string): Promise<CoinInfo> => (await got.get({
    responseType: 'json',
    url: `https://api.coingecko.com/api/v3/coins/ethereum/contract/${contract}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
})).body as CoinInfo;
