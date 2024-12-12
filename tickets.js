const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
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

const ROLES = {
  ADMIN: "ADMIN",
  USER: "USER",
}

function checkUser(req, res, next) {
  const token = req.headers.authorization.split(' ')[1];

  try {
    const decoded = jwt.decode(token);
    const groups = decoded['cognito:groups'];
    let role = ROLES.USER;

    if(groups && groups.includes("ADMIN")) {
      role = ROLES.ADMIN;
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
      res.status(200).json({
        ...params,
      });
    } catch(error) {
      console.log(error);

      res.status(500).json({ 
        message: "Nie udało się utworzyć ticketu",
        error: error.message, 
      });
    }
  });

  router.get(
    "/all", 
    checkUser,
    async (req, res) => {
      const getTicketsByStatus = async (status) => {
        const params = {
          ...params,
          IndexName: "StatusIndex",
          KeyConditionExpression: "#status = :statusValue",
          ExpressionAttributeNames: {
            "#status": "status",
          },
          ExpressionAttributeValues: {
            ":statusValue": status,
          },
        };

        const command = new QueryCommand(params);
        const dataOpen = await docClient.send(command);
      }

      const user = req.user;

      const params = {
        TableName: TICKETS_TABLE,
        ScanIndexForward: true,
      };

      if(user.role === ROLES.ADMIN) {
        const ticketsOpen = await getTicketsByStatus(TICKET_STATUS.OPEN);
        const ticketsNew = await getTicketsByStatus(TICKET_STATUS.NEW);

        res.status(200).json({
          ticketsOpen: {
            count: ticketsOpen.count,
            tickets: ticketsOpen.Items,
          },
          ticketsNew: {
            count: ticketsNew.count,
            tickets: ticketsNew.Items,
          },
        });

      } else {
        params = {
          ...params,
          IndexName: "UserSubIndex",
          KeyConditionExpression: "#userSub = :userSubValue",
          ExpressionAttributeNames: {
            "#userSub": "userSub",
          },
          ExpressionAttributeValues: {
            ":userSubValue": user.sub,
          },
        };
      }
        
    
      try {
        const command = new QueryCommand(params);
        const data = await docClient.send(command);
        res.status(200).json({
          count: data.Count,
          tickets: data.Items,
        });
      } catch(error) {
        console.log(error);
  
        res.status(500).json({ 
          message: "Nie udało się wczytać ticketów",
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
