const express = require("express");
const { validationResult } = require("express-validator");
const serverless = require("serverless-http");
const {body} = require("express-validator");
const { CognitoIdentityProviderClient, ListDevicesCommand } = require("@aws-sdk/client-cognito-identity-provider");

const { REGION } = process.env;
const client = new CognitoIdentityProviderClient({ region: REGION });

const app = express();

app.use(express.json());

const router = express.Router();

router.post("/login", async (req, res) => {
    res.status(200).json({ message: "login" });
});

router.post(
  "/register", 
  body('email').isEmail(), 
  body('password').notEmpty(), 
  async (req, res) => {
    const result = validationResult(req);
    if(!result.isEmpty()) {
      return res.status(200).json({ errors: result.array() })
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