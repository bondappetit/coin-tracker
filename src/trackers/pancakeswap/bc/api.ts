import BigNumber from 'bignumber.js';
// @ts-ignore
import networks from '@bondappetit/networks';
import { AbiItem } from 'web3-utils';

const ERC20 = require('@bondappetit/networks/abi/ERC20.json');
const Pair = require('@bondappetit/networks/abi/IUniswapV2Pair.json');
// eslint-disable-next-line @typescript-eslint/no-require-imports,@typescript-eslint/no-var-requires
const Web3 = require('web3');

const web3Url = 'https://bsc-dataseed1.ninicoin.io';
const web3 = new Web3(new Web3.providers.HttpProvider(web3Url));


export async function getTokenDecimals(address: string) {
    const token = new web3.eth.Contract(ERC20.abi as AbiItem[], address);
    return await token.methods.decimals().call();
}

export async function getBcPairInfo(pairAddress: string) {
    const contract = new web3.eth.Contract(Pair.abi as AbiItem[], pairAddress);
    const [
        token0Address,
        token1Address,
        reserves,
    ] = await Promise.all([
        contract.methods.token0().call(),
        contract.methods.token1().call(),
        contract.methods.getReserves().call(),
    ]);

    const [tokenDecimals0, tokenDecimals1] = await Promise.all([
        getTokenDecimals(token0Address.toLowerCase()),
        getTokenDecimals(token1Address.toLowerCase()),
    ]);

    return  {
        pooledToken0: new BigNumber(reserves.reserve0).div(new BigNumber(10).pow(tokenDecimals0)).toNumber(),
        pooledToken1: new BigNumber(reserves.reserve1).div(new BigNumber(10).pow(tokenDecimals1)).toNumber(),
    };
};