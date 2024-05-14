const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;
const corsConfig = {
  origin: "*",
  Credential: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
};

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://studysync-network.web.app",
      "https://studysync-network.firebaseapp.com",
      "",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.552onl4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//middlewares

const logger = (req, res, next) => {
  // console.log("Log Info: ", req.method, req.url);
  next();
};

const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  // console.log("token in the middleware:", token);
  if (!token) {
    return res.status(401).send({ message: "Unathorized token" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unathorized token" });
    }
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const assignmentCollection = client
      .db("assignmentDB")
      .collection("assignments");
    const submitAssignmentCollection = client
      .db("assignmentDB")
      .collection("submitassignments");

    const featuredAssignmentCollection = client
      .db("assignmentDB")
      .collection("featuredassignments");

    //auth related
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log("User for Token: ", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" ? "true" : "false",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      });
      res.send({ success: true });
    });

    app.post("/logout", async (req, res) => {
      const user = req.body;
      console.log("logging Out User:", user);
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });

    app.get("/assignments", async (req, res) => {
      const cursor = assignmentCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/submitassignments", async (req, res) => {
      const cursor = submitAssignmentCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/featuredassignments", async (req, res) => {
      const cursor = featuredAssignmentCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/assignments/:id", logger, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assignmentCollection.findOne(query);
      res.send(result);
    });

    app.get("/submitassignments/:id", logger, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await submitAssignmentCollection.findOne(query);
      res.send(result);
    });

    app.get(
      "/submitassignments/obtained_marks/:obtained_marks",
      logger,
      verifyToken,
      async (req, res) => {
        console.log("token Owner Info", req.user.email);
        console.log("query user", req.query.user);
        // if (req.user.email !== req.query.email) {
        //   return res.status(403).send({ message: "Forbidden" });
        // }
        const obtained_marks = req.params.obtained_marks;
        const cursor = submitAssignmentCollection.find({
          obtained_marks: "",
        });
        const result = await cursor.toArray();
        res.send(result);
      }
    );

    app.get(
      "/submitassignments/submitted_by/:email",
      logger,
      async (req, res) => {
        try {
          const userEmail = req.params.email;

          const cursor = submitAssignmentCollection.find({
            submitted_by: userEmail,
          });
          console.log(userEmail);

          const result = await cursor.toArray();
          console.log(result);
          res.send(result);
        } catch (err) {
          console.log("Error fetching assignments:", err);
          res.status(500).send("Error fetching assignments");
        }
      }
    );

    app.post("/assignments", async (req, res) => {
      const newAssignments = req.body;
      console.log(newAssignments);
      const result = await assignmentCollection.insertOne(newAssignments);
      res.send(result);
    });

    app.post("/submitassignments", logger, async (req, res) => {
      const submitAssignments = req.body;
      const result = await submitAssignmentCollection.insertOne(
        submitAssignments
      );
      res.send(result);
    });

    app.patch("/assignments/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedAssignments = req.body;
      const assignment = {
        $set: {
          photo: updatedAssignments.photo,
          title: updatedAssignments.title,
          description: updatedAssignments.description,
          marks: updatedAssignments.marks,
          dueDate: updatedAssignments.dueDate,
          difficulty: updatedAssignments.difficulty,
        },
      };
      const result = await assignmentCollection.updateOne(filter, assignment);
      res.send(result);
    });

    app.patch("/submitassignments/:id", logger, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedAssignments = req.body;
      const assignment = {
        $set: {
          photo: updatedAssignments.photo,
          title: updatedAssignments.title,
          description: updatedAssignments.description,
          marks: updatedAssignments.marks,
          dueDate: updatedAssignments.dueDate,
          difficulty: updatedAssignments.difficulty,
          obtained_marks: updatedAssignments.obtained_marks,
          submitted_by: updatedAssignments.submitted_by,
          feedback: updatedAssignments.feedback,
          status: updatedAssignments.status,
        },
      };
      const result = await submitAssignmentCollection.updateOne(
        filter,
        assignment
      );
      res.send(result);
    });

    app.delete("/assignments/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assignmentCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("StudySyncNetwork is running");
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
