const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} = require("@aws-sdk/lib-dynamodb");

const express = require("express");
const serverless = require("serverless-http");
const { v4: uuidv4} = require("uuid");
const jwt = require("jsonwebtoken");

const app = express();

const TICKETS_TABLE = process.env.TICKETS_TABLE;
const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

const TICKET_STATUS = {
  NEW: "NEW",
  OPEN: "OPEN",
  CLOSED: "CLOSED",
}

function checkUser(req, res, next) {
  const token = req.headers.authorization.split(' ')[1];

  try {
    const decoded = jwt.decode(token);
    const groups = decoded['cognito:groups'];
    let role = "USER";

    if(groups && groups.includes("ADMIN")) {
      role = "ADMIN";
    }

    req.user = {
      sub: decoded.sub,
      role: role,
    }

    next();

  } catch(error) {
      res.status(401).json({
        message: "Błędny token",
        error: error.message,
      })
  }
}

app.use(express.json());

const router = express.Router();

router.post(
  "/create", 
  checkUser,
  body('title').notEmpty(), 
  body('description').notEmpty(), 
  async (req, res) => {
    const result = validationResult(req);
    if(!result.isEmpty()) {
      return res.status(500).json({ errors: result.array() })
    }

    const ticketId = uuidv4();

    const params = {
      TableName: TICKETS_TABLE,
      Item: {
        tickedId: tickedIt,
        userSub: "sub1",
        createdAt: Date.now(),
        title: req.body.title,
        description: req.body.description,
        status: TICKET_STATUS.NEW,
      },
    };
  
    try {
      const command = new PutCommand(params);
      await docClient.send(command);
      res.json({  });
    } catch(error) {
      console.log(error);

      res.status(500).json({ 
        message: "Nie udało się utworzyć ticketu",
        error: error.message, 
      });
    }
  });

app.get("/users/:userId", async (req, res) => {
  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId: req.params.userId,
    },
  };

  try {
    const command = new GetCommand(params);
    const { Item } = await docClient.send(command);
    if (Item) {
      const { userId, name } = Item;
      res.json({ userId, name });
    } else {
      res
        .status(404)
        .json({ error: 'Could not find user with provided "userId"' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retrieve user" });
  }
});

app.post("/users", async (req, res) => {
  const { userId, name } = req.body;
  if (typeof userId !== "string") {
    res.status(400).json({ error: '"userId" must be a string' });
  } else if (typeof name !== "string") {
    res.status(400).json({ error: '"name" must be a string' });
  }

  const params = {
    TableName: USERS_TABLE,
    Item: { userId, name },
  };

  try {
    const command = new PutCommand(params);
    await docClient.send(command);
    res.json({ userId, name });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not create user" });
  }
});

app.use('/ticket', router);

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

exports.handler = serverless(app);
