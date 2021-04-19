import { db } from '../../db/db';
import { getCoinInfo } from "./api";

export const ETHPLORER_TABLE = 'ethplorer';

export interface EthplorerInfo {
    timestamp: number;
    contract: string;
    transfersCount: number;
    holdersCount: number;
}

export const getActualInfo = async (contract: string): Promise<EthplorerInfo> => {
    return (await db.where({
        contract,
    }).first().orderBy('timestamp', 'desc').select().from(ETHPLORER_TABLE)) || {
        timestamp: Date.now(),
        contract,
        transfersCount: 0,
        holdersCount: 0,
    };
};

const addNewData = async (data: EthplorerInfo): Promise<void> => {
    await db.insert(data).into(ETHPLORER_TABLE);
};

export const fetchInfo = async (contract: string): Promise<void> => {
    const coinInfo = await getCoinInfo(contract);

    await addNewData({
        timestamp: Date.now(),
        contract,
        transfersCount: coinInfo.transfersCount,
        holdersCount: coinInfo.holdersCount,
    });
};
