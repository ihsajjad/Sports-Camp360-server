const express = require('express');
const cors = require('cors');
require('dotenv').config();
var jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;

  if(!authorization){
    return res.status(401).send({error: true, message : 'Unauthorized access'});
  }

  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded)=> {
    
    if(error){
      return res.status(403).send({error: true, message: 'Forbidden Access'})
    }
    req.decoded = decoded;
  })

  next();
}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hbiibcp.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect();

    const classCollections = client.db("Sports-Camp360").collection("classes");
    const instructorCollections = client.db("Sports-Camp360").collection("instructors");
    const testimonialCollections = client.db("Sports-Camp360").collection('testimonials');
    const selectedCollections = client.db("Sports-Camp360").collection('selected');

    // JWT token
    app.post('/jwt', (req, res)=> {
      const user = req.body;

      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

      res.send({token});
    })

    // sending All classes data
    app.get('/classes', async (req, res) => {
      
      const result = await classCollections.find().toArray();
      res.send(result);
    });

    // sending classes data for individual instructor
    app.get('/my-classes', verifyJWT, async (req, res) => {
      const email = req.query?.email;
      const decodedEmail = req.decoded?.email;
      let query = {}
      
      if(req.query?.email){
        if(email !== decodedEmail){
          return res.status(401).send({error: true, message: 'Unauthorized Access'})
        }
        query = {email};
      }

      const result = await classCollections.find(query).toArray();
      res.send(result);
    });

    app.post('/add-new-class', async(req, res)=> {
      const newClass = req.body;

      const result = await classCollections.insertOne(newClass);
      res.send(result);
    })

    // delete class api for instructor
    app.delete('/my-classes/:id', async(req, res)=> {
      const id = req.params.id;

      const query = {_id : new ObjectId(id)};
      const result = await classCollections.deleteOne(query);
      res.send(result);
    })

    // student area
    app.post('/selected', async(req, res)=> {
      const selectedItem = req.body;
      console.log(selectedItem);
      
      const result = await selectedCollections.insertOne(selectedItem);
      res.send(result);
    })

    app.get('/instructors', async (req, res) => {
      const result = await instructorCollections.find().toArray();
      res.send(result);
    })

    app.get('/testimonials', async (req, res) => {
      const result = await testimonialCollections.find().toArray();
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Sports camp is running...');
})

app.listen(port, () => {
  console.log(`Sports camp is running on port ${port}`)
})