import express,{json} from "express"; 
import cors from 'cors';
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";

dotenv.config();
console.log('DATABASE_URL:', process.env.DATABASE_URL);
const app = express();
app.use(json());
app.use(cors());

const mongoClient = new MongoClient(process.env.DATABASE_URL);
let  db;

mongoClient.connect()
    .then(()=> {
        db = mongoClient.db();
        console.log("Conexão com o banco estabelecida com sucesso!")})

    .catch((err)=>console.log(err.message));



  app.get("/users/", (req, res) => {
    db.collection("users").find().toArray()
        .then((data) => res.send(data))
        .catch((err) => res.status(500).send(err.message));
});

app.get("/", (req, res) => {
    res.send("Hello World");
  });

// app.get('/:name', (req, res) => {
// 	const name = req.params.name;
//   res.send('Hello ' + name); 
// });

const porta = process.env.PORTA;
app.listen(porta,()=>{
    console.log(`o servidor roda na porta ${porta}`);
});