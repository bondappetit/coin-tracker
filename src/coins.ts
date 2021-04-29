export interface Coin {
    contract: string;
    bscContract?: string;
    symbol: string;
}
export const COINS: {
    [key: string]: Coin;
} = {
    BAG: {
        contract: '0x28a06c02287e657ec3f8e151a13c36a1d43814b0',
        bscContract: '0x1ad0132d8b5ef3cebda1a9692f36ac30be871b6b',
        symbol: 'BAG',
    },
    USDap: {
        contract: '0x9a1997C130f4b2997166975D9AFf92797d5134c2',
        symbol: 'USDap',
    },
};
