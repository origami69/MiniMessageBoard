const helmet = require('helmet');
const compression = require('compression');
const express = require("express");
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const app = express();
const http = require('http').Server(app);
const PORT = process.env.PORT || 3000;
const cors = require('cors');
const cookieParse= require('cookie-parser')

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(helmet());
app.use(compression()); 


mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true});
//connection checker
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("Connected successfully");
});


app.use(cookieParse())
app.use(session({
  secret: process.env.cookie,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 86400,
    autoRemove: 'native'
})}))

const UserSchema = new mongoose.Schema({
  user: {
    type: String,
  },
  text: {
    type: String,
  },
  timeAdded: {
    type: Date,
  }
});



const user = mongoose.model("user", UserSchema);

const userAdd= new mongoose.Schema({
  user:{
    type: String,
  }
})

const userName = mongoose.model("userName", userAdd);

app.use('/', express.static(path.join(__dirname,'public')))

// ...
app.post("/sendMessage", async (request, response) => {
    try {
      const body=request.body.message
      const data= request.session.user.name
        const newMess = new user({
          user: data,
          text: body,
          timeAdded: new Date()
        });
        await newMess.save();
        response.redirect('/')
    } catch (error) {
      response.status(500).send(error);
    }
});



app.post("/userName", async (request,response)=>{
  try{
    const body=request.body.creator
    const counter= await userName.countDocuments({"user":`${body}`}) 
    if(counter === 0){
      const bruh = new userName({
        user: body
      });  
      await bruh.save()
      request.session.user = {
        name: body
    } //THIS SETS AN OBJECT - 'USER'
    response.redirect('/')
    }else{
      response.redirect('/')
    }
  }catch(error){
    response.status(500).send(error);
  }
})

app.get('/api', (req, res)=>{
  if(req.session.user){
    res.send(req.session.user)
  }else{
    res.sendStatus(404)
  }
})

app.get('/serveMe', (req,res)=>{
  user.find({}).then((data)=>{
    res.send(data)
  }).catch((error)=>{console.log(error)})
})

http.listen(PORT, () => console.log(`server running at http://localhost:${PORT}/`));

  