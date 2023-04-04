import { ethers } from "ethers";
import { scheduleJob } from "node-schedule";
import { ROUTER_ADDRESS, RPC } from "../config/env.js";

import UniswapV2Factory from "../abi/UniswapV2Factory.js";
import UniswapV2Pair from "../abi/UniswapV2Pair.js";
import UniswapV2Router from "../abi/UniswapV2Router.js";
import PairHourRecordService from "../service/PairHourRecordService.js";
import Logger from "../utils/logger-utils.js";

const jsonProvider = new ethers.providers.JsonRpcProvider(RPC);
const router = new ethers.Contract(
  ROUTER_ADDRESS,
  UniswapV2Router.abi,
  jsonProvider
);
const factoryAddress = await router.factory();
const factory = new ethers.Contract(
  factoryAddress,
  UniswapV2Factory.abi,
  jsonProvider
);

const getCurrentPairData = async (address) => {
  let pair = new ethers.Contract(address, UniswapV2Pair.abi, jsonProvider);
  let reserves = await pair.getReserves();

  return {
    contract: pair.address,
    reserve0: ethers.utils.formatUnits(reserves[0], "wei"),
    reserve1: ethers.utils.formatUnits(reserves[1], "wei"),
  };
};
const scanJob = scheduleJob("0 0 * * * *", async function () {
  Logger.debug("Start sync", new Date());
  const totalPair = await factory.allPairsLength();
  const totalPairAsNumber = Number(ethers.utils.formatUnits(totalPair, "wei"));
  let timestamp = +new Date();
  let listReserves = [];
  for (let index = 0; index < totalPairAsNumber; index++) {
    try {
      const pairAddress = await factory.allPairs(index);
      let reserves = await getCurrentPairData(pairAddress);
      listReserves.push(reserves);
    } catch (error) {
      Logger.error("Fetch data fail", error);
    }
  }
  try {
    let saveData = listReserves.map((item) => ({ ...item, timestamp }));
    let result = await PairHourRecordService.save(saveData);
  } catch (error) {
    Logger.error("Save fail", error);
  }

  Logger.debug("End sync", new Date());
});

export default scanJob;
