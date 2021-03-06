import * as config from 'config';
import * as fs from 'fs';
import * as Mustache from 'mustache';
import * as TelegramBot from 'node-telegram-bot-api';
import { getActualInfo } from '../trackers/coingecko';
import { getActualInfo as getEthplorerInfo } from '../trackers/ethplorer';
import { getAggregatedSwapInfo, getPairDatas } from '../trackers/uniswap';
import { getAggregatedSwapInfo as getCakeAggregatedSwapInfo, getPairDatas as getCakePairDatas } from '../trackers/pancakeswap';
import { Coin } from '../coins';

const token = config.get<string>('tg.token');
const groups: Array<string> = config.get<string>('tg.groups').split(',');

const bot = new TelegramBot(token, { polling: false });

const ONE_HOUR = 1000 * 60 * 60;

const HOURLY_INFO_TEMPLATE = fs.readFileSync(`${__dirname}/templates/HourlyInfo.mustache`, 'utf8');

const NumberFormat = Intl.NumberFormat('en-EN');

export const sendHourlyInfo = async (coin: Coin) => {
    const coingeckoInfo = await getActualInfo(coin.contract);
    const ethplorerData = await getEthplorerInfo(coin.contract);

    const uniswapHourlyInfo = await getAggregatedSwapInfo(coin.contract, Date.now() - ONE_HOUR, Date.now());
    const uniswap24hInfo = await getAggregatedSwapInfo(coin.contract, Date.now() - 24 * ONE_HOUR, Date.now());
    const uniswapPairData = await getPairDatas(coin.contract);

    const pancakeswapHourlyInfo = await getCakeAggregatedSwapInfo(coin.bscContract || "", Date.now() - ONE_HOUR, Date.now());
    const pancakeswap24hInfo = await getCakeAggregatedSwapInfo(coin.bscContract || "", Date.now() - 24 * ONE_HOUR, Date.now());
    const pancakeswapPairData = await getCakePairDatas(coin.bscContract || "");


    await Promise.all(groups.map(async group => bot.sendMessage(group, Mustache.render(HOURLY_INFO_TEMPLATE,
        {
                coingeckoInfo: {
                    ...coingeckoInfo,
                    usdPrice: NumberFormat.format(coingeckoInfo.usdPrice),
                    btcPrice: NumberFormat.format(coingeckoInfo.btcPrice),
                    usdVolume: NumberFormat.format(coingeckoInfo.usdVolume),
                    btcVolume: NumberFormat.format(coingeckoInfo.btcVolume),
                }, uniswapInfo: {
                    hourlyInfo: {
                        ...uniswapHourlyInfo,
                        sellVolume: NumberFormat.format(uniswapHourlyInfo.sellVolume),
                        buyVolume: NumberFormat.format(uniswapHourlyInfo.buyVolume),
                        amountUSD: NumberFormat.format(uniswapHourlyInfo.amountUSD),
                    },
                    info24h: {
                        ...uniswap24hInfo,
                        sellVolume: NumberFormat.format(uniswap24hInfo.sellVolume),
                        buyVolume: NumberFormat.format(uniswap24hInfo.buyVolume),
                        amountUSD: NumberFormat.format(uniswap24hInfo.amountUSD),
                    }
                }, uniswapPairData: uniswapPairData.map(data => ({
                    ...data,
                    pooledToken0: NumberFormat.format(data.pooledToken0),
                    pooledToken1: NumberFormat.format(data.pooledToken1),
                    lastHourData: {
                        ...data.lastHourData,
                        volumeUSD: NumberFormat.format(data.lastHourData.volumeUSD),
                    },
                    last24hData: {
                        ...data.last24hData,
                        volumeUSD: NumberFormat.format(data.last24hData.volumeUSD),
                    }
                })), pancakeswapInfo: {
                    briefly: Number(config.get("pancakeswap.briefly")) === 1,
                    hourlyInfo: {
                        ...pancakeswapHourlyInfo,
                        sellVolume: NumberFormat.format(pancakeswapHourlyInfo.sellVolume),
                        buyVolume: NumberFormat.format(pancakeswapHourlyInfo.buyVolume),
                        amountUSD: NumberFormat.format(pancakeswapHourlyInfo.amountUSD),
                    },
                    info24h: {
                        ...pancakeswap24hInfo,
                        sellVolume: NumberFormat.format(pancakeswap24hInfo.sellVolume),
                        buyVolume: NumberFormat.format(pancakeswap24hInfo.buyVolume),
                        amountUSD: NumberFormat.format(pancakeswap24hInfo.amountUSD),
                    }
                }, pancakeswapPairData: pancakeswapPairData.map(data => ({
                    ...data,
                    pooledToken0: NumberFormat.format(data.pooledToken0),
                    pooledToken1: NumberFormat.format(data.pooledToken1),
                    lastHourData: {
                        ...data.lastHourData,
                        volumeUSD: NumberFormat.format(data.lastHourData.volumeUSD),
                    },
                    last24hData: {
                        ...data.last24hData,
                        volumeUSD: NumberFormat.format(data.last24hData.volumeUSD),
                    }
                })),
                ethplorerData,
                symbol: coin.symbol,
                ethereum: coin.contract !== undefined,
                bsc: coin.bscContract !== undefined,
        },
    ), {
        parse_mode: 'HTML',
    })));
};
