import { fetchInfo as fetchUniswapInfo } from './trackers/uniswap';
import { fetchInfo as fetchCoingecoInfo } from './trackers/coingeco';
import { sendHourlyInfo } from './telegram/tg';
import * as config from 'config';
import { COINS } from './coins';

const coinName = config.get<string>('coin');
const coin = COINS[coinName];

const CYCLE_INTERVAL = 30000;

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
            console.error('Error while fetch info from UniSwap', e.message);
        }

        try {
            await fetchCoingecoInfo(coin.contract);
            console.log('Info from CoinGeco has been fetched');
        } catch (e) {
            console.error('Error while fetch info from CoinGeco', e.message);
        }

        if (Date.now() >= nextTimeToSend) {
            try {
                await sendHourlyInfo(coin);
                nextTimeToSend += ONE_HOUR;
                console.log(`Message has been sent, next message will be send at ${new Date(nextTimeToSend)}`)
            } catch (e) {
                console.error('Error while send notification', e.message);
            }
        }
        console.log('Iteration has been finished');
        setTimeout(runCycle, CYCLE_INTERVAL);
    };
    await runCycle();
};
