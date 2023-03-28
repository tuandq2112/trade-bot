import * as dotenv from "dotenv";
dotenv.config();
export const {
  PORT,
  RPC,
  ROUTER_ADDRESS,
  DB_HOST,
  DB_PORT,
  DB_DATABASE,
  DB_USER,
  DB_PASS,
} = process.env;
