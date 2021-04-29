import { fetchInfo as fetchUniswapInfo } from './trackers/uniswap';
import { fetchInfo as fetchPancakeInfo } from './trackers/pancakeswap';
import { fetchInfo as fetchcoingeckoInfo } from './trackers/coingecko';
import { fetchInfo as fetchethplorerInfo } from './trackers/ethplorer';
import { sendHourlyInfo } from './telegram/tg';
import * as config from 'config';
import { COINS } from './coins';

const coinName = config.get<string>('coin');
const coin = COINS[coinName];

const POLLING_INTERVAL = Number(config.get<string>('pollingInterval'));

const ONE_HOUR = 1000 * 60 * 60;

const currentDate = new Date();
currentDate.setHours(currentDate.getHours( ) + 1, 0, 0, 0);

let nextTimeToSend = currentDate.valueOf();

export const startManager = async () => {
    await sendHourlyInfo(coin);
    const runCycle = async () => {
        console.log('Start iteration');
        try {
            await fetchUniswapInfo(coin.contract);
            console.log('Info from UniSwap has been fetched');
        } catch (e) {
            console.error('Error while fetch info from UniSwap', e);
        }

        if (coin.bscContract) {
            try {
                await fetchPancakeInfo(coin.bscContract);
                console.log('Info from PancakeSwap has been fetched');
            } catch (e) {
                console.error('Error while fetch info from PancakeSwap', e);
            }
        }

        try {
            await fetchcoingeckoInfo(coin.contract);
            console.log('Info from CoinGecko has been fetched');
        } catch (e) {
            console.error('Error while fetch info from CoinGecko', e);
        }

        try {
            await fetchethplorerInfo(coin.contract);
            console.log('Info from Ethplorer has been fetched');
        } catch (e) {
            console.error('Error while fetch info from Ethplorer', e);
        }

        if (Date.now() >= nextTimeToSend) {
            try {
                await sendHourlyInfo(coin);
                nextTimeToSend += ONE_HOUR;
                console.log(`Message has been sent, next message will be send at ${new Date(nextTimeToSend)}`)
            } catch (e) {
                console.error('Error while send notification', e);
            }
        }
        console.log('Iteration has been finished');
        setTimeout(runCycle, POLLING_INTERVAL);
    };
    await runCycle();
};
