import got from "got";

export interface CoinInfo {
    address: string;
    decimals: string;
    name: string;
    owner: string;
    symbol: string;
    totalSupply: string;
    transfersCount: number;
    lastUpdated: number;
    issuancesCount: number;
    holdersCount: number;
}

export const getCoinInfo = async (contract: string): Promise<CoinInfo> => (await got.get({
    responseType: 'json',
    url: `https://api.ethplorer.io/getTokenInfo/${contract}?apiKey=freekey`,
})).body as CoinInfo;
