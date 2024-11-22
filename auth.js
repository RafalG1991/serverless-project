const express = require("express");
const serverless = require("serverless-http");

const app = express();

app.use(express.json());

const router = express.Router();

router.post("/login", async (req, res) => {
    res.status(200).json({ message: "OK" });
});

app.use('/auth', router);

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

exports.handler = serverless(app);