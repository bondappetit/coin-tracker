import * as config from 'config';
import * as fs from 'fs';
import * as Mustache from 'mustache';
import * as TelegramBot from 'node-telegram-bot-api';
import { getActualInfo } from '../trackers/coingeco';
import { getAggregatedInfo } from '../trackers/uniswap';
import { Coin } from '../coins';

const token = config.get<string>('tg.token');
const groups: Array<string> = config.get<string>('tg.groups').split(',');

const bot = new TelegramBot(token, { polling: false });

const ONE_HOUR = 1000 * 60 * 60;

const HOURLY_INFO_TEMPLATE = fs.readFileSync(`${__dirname}/templates/HourlyInfo.mustache`, 'utf8');

const NumberFormat = Intl.NumberFormat('en-EN');

export const sendHourlyInfo = async (coin: Coin) => {
    const coingecoInfo = await getActualInfo(coin.contract);
    const uniswapInfo = await getAggregatedInfo(coin.contract, Date.now() - ONE_HOUR, Date.now());
    await Promise.all(groups.map(async group => bot.sendMessage(group, Mustache.render(HOURLY_INFO_TEMPLATE,
        { coingecoInfo: {
                ...coingecoInfo,
                usdPrice: NumberFormat.format(coingecoInfo.usdPrice),
                btcPrice: NumberFormat.format(coingecoInfo.btcPrice),
                usdVolume: NumberFormat.format(coingecoInfo.usdVolume),
                btcVolume: NumberFormat.format(coingecoInfo.btcVolume),
            }, uniswapInfo: {
                ...uniswapInfo,
                sellVolume: NumberFormat.format(uniswapInfo.sellVolume),
                buyVolume: NumberFormat.format(uniswapInfo.buyVolume),
            }, symbol: coin.symbol },
    ), {
        parse_mode: 'HTML',
    })));
};
