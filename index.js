const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

function verifyJwt(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).send({ message: 'Unauthorize access' })
  }
  const token = authHeader.split(' ')[1]
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access token' })
    }
    req.decoded = decoded
    next()
  });
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6f6kb.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//console.log(uri)

async function run() {
  try {
    await client.connect()
    const partsCollection = client.db('ebike').collection('parts');
    const placeOrderCollection = client.db('ebike').collection('placeorder');
    const reviewCollection = client.db('ebike').collection('review');
    const userCollection = client.db('ebike').collection('users');
    const myprofileCollection = client.db('ebike').collection('myprofile');

    //user put
    app.put('/user/:email', async (req, res) => {
      const email = req.params.email
      const user = req.body
      const filter = { email: email }
      const options = { upsert: true }
      const updateDoc = {
        $set: user,
      }
      const result = await userCollection.updateOne(filter, updateDoc, options)
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({ result, token })
    })

    //get admin api
    app.get('/admin/:email', async (req, res) => {
      const email = req.params.email
      const user = await userCollection.findOne({ email: email })
      const isAdmin = user.role === 'admin'
      res.send({ admin: isAdmin })
    })

    //admin put
    app.put('/user/admin/:email', verifyJwt, async (req, res) => {
      const email = req.params.email
      const requester = req.decoded.email
      const requesterAccount = await userCollection.findOne({ email: requester })
      if (requesterAccount.role === 'admin') {
        const filter = { email: email }
        const updateDoc = {
          $set: { role: 'admin' },
        }
        const result = await userCollection.updateOne(filter, updateDoc)
        res.send(result)
      } else {
        return res.status(403).send({ message: 'Forbidden' })
      }
    })


    //get user information
    app.get('/user', verifyJwt, async (req, res) => {
      const users = await userCollection.find().toArray()
      res.send(users)
    })


    //get all parts
    app.get('/parts', async (req, res) => {
      const query = {}
      const cursor = partsCollection.find(query)
      const parts = await cursor.toArray()
      res.send(parts)
    })

    //parts post by admin
    app.post('/parts', async (req, res) => {
      const addItem = req.body
      const result = await partsCollection.insertOne(addItem)
      res.send(result)
    })

    //get one parts details
    app.get('/parts/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: ObjectId(id) }
      const parts = await partsCollection.findOne(query)
      res.send(parts)
    })

    //post place order
    app.post('/placeorder', async (req, res) => {
      const placeOrder = req.body
      const result = await placeOrderCollection.insertOne(placeOrder)
      res.send(result)
    })

    //get place order
    app.get('/placeorder', verifyJwt, async (req, res) => {
      const email = req.query.email
      const decodedEmail = req.decoded.email
      if (email === decodedEmail) {
        const query = { email: email }
        const placeOrder = await placeOrderCollection.find(query).toArray()
        return res.send(placeOrder)
      }
      else {
        return res.status(403).send({ message: 'Forbidden access token' })
      }
    })

    app.post('/review', async (req, res) => {
      const review = req.body
      const result = await reviewCollection.insertOne(review)
      res.send(result)
    })

    app.get('/reviews', async (req, res) => {
      const query = {}
      const review = await reviewCollection.find(query).toArray()
      res.send(review)
    })

    app.patch('/myprofile', async (req, res) => {

    })
  }
  finally {

  }
}
run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Hello from eBikeParts!')
})

app.listen(port, () => {
  console.log(`eBikePart listening on port ${port}`)
})