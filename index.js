//Definition & imports
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();

// Middlewares
require("dotenv").config();
app.use(cors());
app.use(express.json());

app.use(async (req, res, next) => {
  console.log(
    `⚡ ${req.method} - ${req.path} from ${
      req.host
    } at ⌛ ${new Date().toLocaleString()}`
  );
  next();
});

//ports & clients
const port = process.env.PORT || 5000;
const uri =
  "mongodb+srv://moduleFiftynine:8WD0iFZlfUYDrU1j@cluster0.6l2dtxw.mongodb.net/?appName=Cluster0";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//listeners
client
  .connect()
  .then(() => {
    app.listen(port, () => {
      console.log(`Hero Apps Server listening ${port}`);
      console.log(`Hero Apps Server Connected with DB`);
    });
  })
  .catch((err) => {
    console.log(err);
  });

//DB & collections
const database = client.db("heroAppsDB");
const appsCollection = database.collection("apps");

//Apps Route

app.post("/apps", async (req, res) => {
  try {
    const newApp = req.body;
    const result = await appsCollection.insertOne(newApp);
    res.status(201).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/apps", async (req, res) => {
  try {
    const {
      limit = 0,
      skip = 0,
      sortBy = "rating",
      order = "asc",
      search = "",
    } = req.query;

    const shortoptions = {};

    if (sortBy === "rating") {
      shortoptions.rating = order === "asc" ? 1 : -1;
    } else if (sortBy === "downloads") {
      shortoptions.downloads = order === "asc" ? 1 : -1;
    } else if (sortBy === "size") {
      shortoptions.size = order === "asc" ? 1 : -1;
    }

    let query = {};

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const apps = await appsCollection
      .find(query)
      .sort(shortoptions)
      .skip(Number(skip))
      .limit(Number(limit))
      .project({ description: 0, ratings: 0 })
      .toArray();
    const count = await appsCollection.countDocuments();
    res.send({ apps, total: count });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/apps/:id", async (req, res) => {
  try {
    const appId = req.params.id;

    if (appId.length != 24) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const query = new ObjectId(appId);
    const app = await appsCollection.findOne({ _id: query });
    res.json(app);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Basic routes
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Hero Apps Server" });
});
//404
app.all(/.*/, (req, res) => {
  res.status(404).json({
    status: 404,
    error: "API not found",
  });
});
