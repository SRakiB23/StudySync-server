const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
// const cookieParser = require("cookie-parser");
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
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());

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

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const assignmentCollection = client
      .db("assignmentDB")
      .collection("assignments");
    const submitAssignmentCollection = client
      .db("assignmentDB")
      .collection("submitassignments");

    //auth related
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log("User for Token: ", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });
      res.send({ success: true });
    });

    app.get("/assignments", async (req, res) => {
      const cursor = assignmentCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/assignments/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assignmentCollection.findOne(query);
      res.send(result);
    });

    app.get("/submitassignments/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await submitAssignmentCollection.findOne(query);
      res.send(result);
    });

    // Define a new route for fetching assignments with empty obtained_marks
    app.get("/assignments/obtained_marks/:obtained_marks", async (req, res) => {
      const obtained_marks = req.params.obtained_marks;
      const cursor = assignmentCollection.find({
        obtained_marks: "",
      });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get(
      "/submitassignments/obtained_marks/:obtained_marks",
      async (req, res) => {
        const obtained_marks = req.params.obtained_marks;
        const cursor = submitAssignmentCollection.find({
          obtained_marks: "",
        });
        const result = await cursor.toArray();
        res.send(result);
      }
    );

    app.get("/submitassignments/submitted_by/:email", async (req, res) => {
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
    });

    app.post("/assignments", async (req, res) => {
      const newAssignments = req.body;
      console.log(newAssignments);
      const result = await assignmentCollection.insertOne(newAssignments);
      res.send(result);
    });

    app.post("/submitassignments", async (req, res) => {
      const submitAssignments = req.body;
      console.log(submitAssignments);
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

    app.patch("/submitassignments/:id", async (req, res) => {
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
