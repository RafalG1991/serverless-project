const express = require("express");
const { validationResult } = require("express-validator");
const serverless = require("serverless-http");
const {query} = require("express-validator");

const app = express();

app.use(express.json());

const router = express.Router();

router.post("/login", async (req, res) => {
    res.status(200).json({ message: "login" });
});

router.post("/register", query('person').notEmpty() ,async (req, res) => {
  const result = validationResult(req);
  if(!result.isEmpty()) {
    res.send({ errors: result.array() })
  }
  res.status(200).json({ message: "register" });
});


router.post("/confirm", async (req, res) => {
  res.status(200).json({ message: "confirm" });
});

app.use('/auth', router);

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

exports.handler = serverless(app);