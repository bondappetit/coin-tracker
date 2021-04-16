export interface Coin {
    contract: string;
    symbol: string;
}
export const COINS: {
    [key: string]: Coin;
} = {
    BAG: {
        contract: '0x28a06c02287e657ec3f8e151a13c36a1d43814b0',
        symbol: 'BAG',
    },
    USDap: {
        contract: '0x9a1997C130f4b2997166975D9AFf92797d5134c2',
        symbol: 'USDap',
    },
};
