import { ethers } from "ethers";
import Express from "express";
import { connectToDatabase } from "./config/db.js";
import { PORT } from "./config/env.js";
import "./job/ScanReserves.js";
import PairHourRecordService from "./service/PairHourRecordService.js";
const app = Express();

app.get("/api/v1/scan/:pair", async function (req, res) {
  try {
    const { pair } = req.params;
    const { fromDate, toDate } = req.query;
    const validPair = ethers.utils.isAddress(pair);
    const validFrom = !isNaN(fromDate);
    const validTo = !isNaN(toDate);
    console.log(fromDate);
    if (!pair || !validFrom || !validTo) {
      res.status(400).json({
        code: 400,
        message: `${validPair ? "" : "Invalid pair."}${
          validFrom ? "" : "Invalid fromDate."
        }${validTo ? "" : "Invalid toDate."}`,
        data: null,
      });
    } else {
      let result = await PairHourRecordService.scan(
        pair,
        Number(fromDate),
        Number(toDate)
      );
      res.status(200).json({
        code: 0,
        message: "Success",
        data: result || [],
      });
    }
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "Server Error",
      data: JSON.stringify(error),
    });
  }
});
app.listen(PORT, async () => {
  connectToDatabase();
});
