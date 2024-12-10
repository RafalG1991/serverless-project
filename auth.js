const express = require("express");
const { validationResult } = require("express-validator");
const serverless = require("serverless-http");
const {body} = require("express-validator");
const { CognitoIdentityProviderClient, SignUpCommand, ConfirmSignUpCommand, AdminInitiateAuthCommand } = require("@aws-sdk/client-cognito-identity-provider");

const { REGION, CLIENT_ID, USER_POOL_ID } = process.env;
const clientCognito = new CognitoIdentityProviderClient({ region: REGION });

const app = express();

app.use(express.json());

const router = express.Router();

router.post(
  "/login", 
  body('email').isEmail(), 
  body('password').notEmpty(), 
  async (req, res) => {
    const result = validationResult(req);
    if(!result.isEmpty()) {
      return res.status(200).json({ errors: result.array() })
    }

    const params = {
      AuthFlow: "ADMIN_NO_SRP_AUTH",
      UserPoolId: USER_POOL_ID,
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: req.body.email,
        PASSWORD: req.body.password,
      }
    }

    try {
      const command = new AdminInitiateAuthCommand(params);
      const response = await clientCognito.send(command);

      res.status(200).json({ sub: response.UserSub });

    } catch(error) {
      console.log(error);

      res.status(500).json({ 
        message: "Nie udało się zarejestrować użytkownika",
        error: error.message, 
      });
    }

    

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

    const params = {
      ClientId: CLIENT_ID,
      Username: req.body.email,
      Password: req.body.password,
      UserAttributes: [{
        Name: 'email',
        Value: req.body.email,
      }]
    }

    try {
      const command = new SignUpCommand(params);
      const response = await clientCognito.send(command);

      res.status(200).json({ sub: response.UserSub });

    } catch(error) {
      console.log(error);

      res.status(500).json({ 
        message: "Nie udało się zarejestrować użytkownika",
        error: error.message, 
      });
    }
  });


router.post(
  "/confirm", 
  body('email').isEmail(), 
  body('code').notEmpty(), 
  async (req, res) => {
    const result = validationResult(req);
    if(!result.isEmpty()) {
      return res.status(200).json({ errors: result.array() })
    }

    const params = {
      ClientId: CLIENT_ID,
      Username: req.body.email,
      ConfirmationCode: req.body.code,
    }

    try {
      const command = new ConfirmSignUpCommand(params);
      const response = await clientCognito.send(command);

      res.status(200).json({ message: "Użytkownik potwierdzony" });
    } catch(error) {
      console.log(error);

      res.status(500).json({ 
        message: "Nie udało się potwierdzić użytkownika",
        error: error.message, 
      });
    }
});

app.use('/auth', router);

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

exports.handler = serverless(app);