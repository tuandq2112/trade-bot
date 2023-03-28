import { connect } from "mongoose";
import { DB_DATABASE, DB_HOST, DB_PASS, DB_PORT, DB_USER } from "./env.js";

const dbConnection = {
  url: `mongodb://${DB_HOST}:${DB_PORT}/${DB_DATABASE}`,
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    user: DB_USER,
    pass: DB_PASS,
  },
};

export function connectToDatabase() {
  connect(dbConnection.url, dbConnection.options)
    .then(() => {
      console.log("Connected!");
    })
    .catch((err) => {
      console.log(err);
      console.log("Connected fail!");
    });
}
