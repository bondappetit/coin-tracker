import { fetchInfo as fetchUniswapInfo } from './trackers/uniswap';
import { fetchInfo as fetchPancakeInfo } from './trackers/pancakeswap';
import { fetchInfo as fetchcoingeckoInfo } from './trackers/coingecko';
import { fetchInfo as fetchethplorerInfo } from './trackers/ethplorer';
import { sendHourlyInfo } from './telegram/tg';
import * as config from 'config';
import { COINS } from './coins';

const POLLING_INTERVAL = Number(config.get<string>('pollingInterval'));

const ONE_HOUR = 1000 * 60 * 60;

class Tracker {
    protected nextTimeToSend: number;
    constructor(readonly coinName: string) {
        const currentDate = new Date();
        currentDate.setHours(currentDate.getHours( ) + 1, 0, 0, 0);
        this.nextTimeToSend =  currentDate.valueOf();
    }

    async forceSendInfo() {
        await sendHourlyInfo(COINS[this.coinName]);
    }

    async process() {
        const coin = COINS[this.coinName];
        console.log(`Start iteration for ${this.coinName}`);
        try {
            await fetchUniswapInfo(coin.contract);
            console.log(`Info from UniSwap for ${this.coinName} has been fetched`);
        } catch (e) {
            console.error(`Error while fetch info from UniSwap for ${this.coinName}`, e);
        }

        if (coin.bscContract) {
            try {
                await fetchPancakeInfo(coin.bscContract);
                console.log(`Info from PancakeSwap for ${this.coinName} has been fetched`);
            } catch (e) {
                console.error(`Error while fetch info from PancakeSwap for ${this.coinName}`, e);
            }
        }

        try {
            await fetchcoingeckoInfo(coin.contract);
            console.log(`Info from CoinGecko for ${this.coinName} has been fetched`);
        } catch (e) {
            console.error(`Error while fetch info from CoinGecko for ${this.coinName}`, e);
        }

        try {
            await fetchethplorerInfo(coin.contract);
            console.log(`Info from Ethplorer for ${this.coinName} has been fetched`);
        } catch (e) {
            console.error(`Error while fetch info from Ethplorer for ${this.coinName}`, e);
        }

        if (Date.now() >= this.nextTimeToSend) {
            try {
                await sendHourlyInfo(coin);
                this.nextTimeToSend += ONE_HOUR;
                console.log(`Message for ${this.coinName} has been sent, next message will be send at ${new Date(this.nextTimeToSend)}`)
            } catch (e) {
                console.error(`Error while send notification for ${this.coinName}`, e);
            }
        }
        console.log(`Iteration for ${this.coinName} has been finished`);
    }
}

const coinNames = config.get<string>('coins');


export const startManager = async () => {
    const trackers = coinNames.split(',').map(coinName => new Tracker(coinName));
    const runCycle = async () => {
        for (let tracker of trackers) {
            await tracker.process();
        }
        setTimeout(runCycle, POLLING_INTERVAL);
    };
    await runCycle();

    for (let tracker of trackers) {
        await tracker.forceSendInfo();
    }
};
