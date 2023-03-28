import PairHourRecordModel from "../models/PairHourRecordModel.js";
import Logger from "../utils/logger-utils.js";

const PairHourRecordService = {
  save: async (record) => {
    try {
      Logger.debug("Try save", record);
      const saveModel = await PairHourRecordModel.create(record);
      Logger.debug("Save record", record);
      return saveModel;
    } catch (error) {
      Logger.error("Save record fail", error);
    }
  },
  scan: async (pair, from, to) => {
    try {
      const result = await PairHourRecordModel.find(
        {
          contract: pair,
          timestamp: {
            $gt: from,
            $lt: to,
          },
        },
        {
          _id: 0,
          __v: 0,
        }
      ).sort("timestamp");
      return result;
    } catch (error) {}
  },
};

export default PairHourRecordService;
