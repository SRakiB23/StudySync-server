const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;
const corsConfig = {
  origin: "*",
  Credential: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
};

// Middleware
app.use(cors());
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

    app.post("/assignments", async (req, res) => {
      const newAssignments = req.body;
      console.log(newAssignments);
      const result = await assignmentCollection.insertOne(newAssignments);
      res.send(result);
    });

    app.patch("/assignments/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      // const options = { upsert: true };
      const updatedAssignments = req.body;
      const assignment = {
        $set: {
          photo: updatedAssignments.photo,
          title: updatedAssignments.title,
          description: updatedAssignments.description,
          marks: updatedAssignments.marks,
          dueDate: updatedAssignments.dueDate,
          difficulty: updatedAssignments.difficulty,
          documentLink: updatedAssignments.documentLink,
          note: updatedAssignments.note,
          status: updatedAssignments.status,
          obtained_marks: updatedAssignments.obtained_marks,
        },
      };
      const result = await assignmentCollection.updateOne(filter, assignment);
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
