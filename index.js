const express = require('express')
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6f6kb.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//console.log(uri)

async function run(){
    try{
        await client.connect()
        const partsCollection = client.db('ebike').collection('parts');
        const placeOrderCollection = client.db('ebike').collection('placeorder');
        const reviewCollection = client.db('ebike').collection('review');

        //get all parts
        app.get('/parts', async (req, res) =>{
            const query = {}
            const cursor = partsCollection.find(query)
            const parts = await cursor.toArray()
            res.send(parts)
        })

        //get one parts details
        app.get('/parts/:id', async (req, res) =>{
          const id = req.params.id
          const query = {_id: ObjectId(id)}
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
        app.get('/placeorder', async (req, res) => {
          const email = req.query.email
          const query = {email: email}
          const placeOrder = await placeOrderCollection.find(query).toArray()
          res.send(placeOrder)
        })

        app.post('/review', async (req, res) => {
          const review = req.body
          const result = await reviewCollection.insertOne(review)
          res.send(result)
        })

        app.get('/reviews', async (req, res) => {

        })
    }
    finally{

    }
}
run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Hello from eBikeParts!')
})

app.listen(port, () => {
  console.log(`eBikePart listening on port ${port}`)
})