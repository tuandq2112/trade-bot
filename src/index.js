import { ethers } from "ethers";
import Express from "express";
import ERC20ABI from "./abi/IERC20.js";
import UniswapV2PairABI from "./abi/UniswapV2Pair.js";
import UniswapV2RouterABI from "./abi/UniswapV2Router.js";
import "./config/env.js";
import Logger from "./utils/logger-utils.js";

const app = Express();
const zeroValue = ethers.BigNumber.from("0");
const PORT = process.env.PORT;
const rpc = process.env.RPC;
const routerAddress = process.env.ROUTER_ADDRESS;
const pairAddress = process.env.PAIR_ADDRESS;
const receiver = process.env.RECEIVER;
const privateKey = process.env.PRIVATE_KEY;

const isEnable = process.env.ISENABLE;;
app.listen(PORT, async () => {
  const jsonProvider = new ethers.providers.JsonRpcProvider(rpc);
  let wallet = new ethers.Wallet(privateKey, jsonProvider);
  wallet = wallet.connect(jsonProvider);
  let pair = new ethers.Contract(pairAddress, UniswapV2PairABI.abi, wallet);
  let router = new ethers.Contract(
    routerAddress,
    UniswapV2RouterABI.abi,
    wallet
  );

  let token0Address = await pair.token0();
  let token1Address = await pair.token1();
  const initPairData = await pair.getReserves();
  const initToken0Reserve = ethers.utils.formatUnits(initPairData[0], 18);
  const initToken1Reserve = ethers.utils.formatUnits(initPairData[1], 18);
  const initConvention = Number(initToken0Reserve) / Number(initToken1Reserve);
  let tokens = [token0Address, token1Address];
  let walletAddress = wallet.address;
  const token0 = new ethers.Contract(token0Address, ERC20ABI.abi, wallet);
  const token1 = new ethers.Contract(token1Address, ERC20ABI.abi, wallet);
  if (isEnable) {
    let rqApproveToken0 = await token0.approve(
      pairAddress,
      ethers.utils.parseEther("1000000")
    );
    await rqApproveToken0.wait();
    console.log("Token0 approve successfully!");
    let rqApproveToken1 = await token1.approve(
      pairAddress,
      ethers.utils.parseEther("1000000")
    );
    await rqApproveToken1.wait();
    console.log("Token2 approve successfully!");
    console.log("Init convension", initConvention);
  }
  let token0Balance = await token0.balanceOf(walletAddress);
  let token1Balance = await token1.balanceOf(walletAddress);

  Logger.debug(
    "Init token0 balance: %o",
    ethers.utils.formatUnits(token0Balance, 18)
  );
  Logger.debug(
    "Init token1 balance: %o",
    ethers.utils.formatUnits(token1Balance, 18)
  );
  let activeCount = 0;
  let errorCount = 0;

  pair.on(
    "Swap",
    async (sender, amount0In, amount1In, amount0Out, amount1Out, to) => {
      try {
        // const pairData = await pair.getReserves();
        // const token0Reserve = ethers.utils.formatUnits(pairData[0], 18);
        // const token1Reserve = ethers.utils.formatUnits(pairData[1], 18);
        // const conversion = Number(token0Reserve) / Number(token1Reserve);
        // console.log(`
        //   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        //   1. Block timestamp: ${pairData[2]}
        //   2. Token0 Reserve: ${token0Reserve}
        //   3. Token1 Reserve: ${token1Reserve}
        //   4. Conversion token0/token1: ${conversion}
        //   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // `);
        if (walletAddress != sender && walletAddress != to) {
          let token0SwapToToken1 = amount0In.gt(zeroValue);
          let amountIn = token0SwapToToken1
            ? amount1Out.div(ethers.BigNumber.from("2"))
            : amount0Out.div(ethers.BigNumber.from("2"));
          if (token0SwapToToken1) {
            tokens.reverse();
          }
          const amounts = await router.getAmountsOut(amountIn, [
            tokens[0],
            tokens[1],
          ]);

          let amountOutMax = amounts[1];
          let amountOutMin = amountOutMax.sub(amountOutMax.div(10));

          Logger.debug("Before transaction: %o", {
            activeCount,
            amountIn: ethers.utils.formatUnits(amountIn, 18),
            amountOutMax: ethers.utils.formatUnits(amountOutMax, 18),
            amountOutMin: ethers.utils.formatUnits(amountOutMin, 18),
          });
          const transaction = await router.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            tokens,
            receiver,
            Date.now() + 1000 * 60 * 10
          );
          await transaction.wait();
          activeCount++;

          token0Balance = await token0.balanceOf(walletAddress);
          token1Balance = await token1.balanceOf(walletAddress);

          Logger.debug("After transaction: %o", {
            activeCount,
            token0Balance: ethers.utils.formatUnits(token0Balance, 18),
            token1Balance: ethers.utils.formatUnits(token1Balance, 18),
          });
        }
      } catch (error) {
        errorCount++;
        // console.log(error);
        // Logger.error("Error: %o", error);
        Logger.error("Error Count: %o", errorCount);
      }
    }
  );
});
