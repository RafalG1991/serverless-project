const express = require("express");
const serverless = require("serverless-http");

const app = express();

app.use(express.json());

app.post("/auth/login", async (req, res) => {
    res.status(200).json({ message: "OK" });
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

exports.handler = serverless(app);