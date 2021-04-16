import { fetchInfo as fetchUniswapInfo } from './trackers/uniswap';
import { fetchInfo as fetchCoingecoInfo } from './trackers/coingeco';
import { sendHourlyInfo } from './telegram/tg';
import * as config from 'config';
import { COINS } from './coins';

const coinName = config.get<string>('coin');
const coin = COINS[coinName];

const CYCLE_INTERVAL = 30000;

let nextHourToSend = (new Date()).getHours() + 1;

export const startManager = async () => {
    const runCycle = async () => {
        try {
            await fetchUniswapInfo(coin.contract);
        } catch (e) {
            console.error('Error while fetch info from uniswap', e.message);
        }

        try {
            await fetchCoingecoInfo(coin.contract);
        } catch (e) {
            console.error('Error while fetch info from coingeco', e.message);
        }

        if ((new Date()).getHours() === nextHourToSend) {
            try {
                await sendHourlyInfo(coin);
            } catch (e) {
                console.error('Error while send notification', e.message);
            }
            nextHourToSend = (new Date()).getHours() + 1;
        }
        setTimeout(runCycle, CYCLE_INTERVAL);
    };
    await runCycle();
};
