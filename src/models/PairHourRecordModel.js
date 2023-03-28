import mongoose from "mongoose";
const { Schema } = mongoose;

const PairHourRecordSchema = new Schema({
  timestamp: Number,
  contract: String,
  reserve0: String,
  reserve1: String,
});
const PairHourRecordModel = mongoose.model("reserve", PairHourRecordSchema);
export default PairHourRecordModel;
