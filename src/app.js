import express, { json } from "express";
import cors from 'cors';
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";

dotenv.config();
const app = express();
app.use(json());
app.use(cors());

const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

mongoClient.connect()
  .then(() => {
    db = mongoClient.db();
    console.log("Conexão com o banco estabelecida com sucesso!")
  })

  .catch((err) => console.log(err.message));



app.post('/sign-up', async (req, res) => {
  const { username, avatar } = req.body;

  const userSchema = joi.object({
    username: joi.string().required(),
    avatar: joi.string().required()
  });

  const validation = userSchema.validate({ username, avatar }, { abortEarly: false })

  if (validation.error) {
    return res.status(422).send("Unprocessable Entity");
  }

  try {
    const resp = await db.collection('users').findOne({ username: username });
    if (resp) return res.status(422).send("Usuario já existe");

    await db.collection("users").insertOne({ username, avatar });

    return res.sendStatus(201);
  } catch (err) {
    return res.status(500).send(err.message);
  }
})

app.post('/tweets', async (req, res) => {
  const { username, tweet } = req.body;

  const tweetSchema = joi.object({
    username: joi.string().required(),
    tweet: joi.string().required()
  });

  const validation = tweetSchema.validate({ username, tweet }, { abortEarly: false })

  if (validation.error) {
    return res.status(422).send("Unprocessable Entity");
  }

  try {
    const resp = await db.collection('users').findOne({ username: username });
    if (!resp) return res.status(401).send("Unauthorized");

    await db.collection("tweets").insertOne({ username, tweet });

    return res.sendStatus(201);
  } catch (err) {
    return res.status(500).send(err.message);
  }
})

app.get("/tweets", async (req, res) => {
  try {
    const tweets = await db.collection("tweets").find().sort({ _id: -1 }).toArray();

    if (tweets.length === 0) {
      return res.send([]);
    }

    const tweetsWithAvatar = [];
    for (let tweet of tweets) {
      const user = await db.collection("users").findOne({ username: tweet.username });
      tweetsWithAvatar.push({
        _id: tweet._id,
        username: tweet.username,
        tweet: tweet.tweet,
        avatar: user ? user.avatar : null
      });
    }

    res.send(tweetsWithAvatar);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.put('/tweets/:id', async (req, res) => {
  const { id } = req.params;
  const tweetBody = req.body;
  const tweetSchema = joi.object({
    username: joi.string().required(),
    tweet: joi.string().required()
  });

  const validation = tweetSchema.validate(tweetBody, { abortEarly: false });

  if (validation.error) {
    const messageError = validation.error.details.map(datail => datail.message);
    return res.status(422).send(messageError);
  }

  try {

    const result = await db.collection("tweets").updateOne({
      _id: new ObjectId(id)
    }, {
      $set: {
        username: tweetBody.username,
        tweet: tweetBody.tweet
      }
    });
    if (result.matchedCount === 0) {
      return res.status(404).send("Not Found");
    }

    return res.status(204).send("No content");
  }
  catch (error) {
    return res.status(500).send(error.message);
  }


});

app.delete('/tweets/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db
      .collection("tweets")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) return res.sendStatus(404)

    res.status(204).send("Usuário deletado com sucesso")
  } catch (error) {
    res.status(500).send(error);
  }
});

const porta = process.env.PORTA;
app.listen(porta, () => {
  console.log(`o servidor roda na porta ${porta}`);
});