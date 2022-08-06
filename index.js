const helmet = require('helmet');
const compression = require('compression');
const express = require("express");
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore= require("connect-mongo")
const { body }= require('express-validator')
const app = express();
const http = require('http').Server(app);
const PORT = process.env.PORT || 3000;
const cors = require('cors');
const bcrypt=require('bcryptjs');
const cookieParse= require('cookie-parser');


//I love to use 404 since I love gfl


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
})
  }))

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



const userMes = mongoose.model("user", UserSchema);

const userAdd= new mongoose.Schema({
  username:{
    type: String,
  },
  password: {
    type: String
  }
})

const userName = mongoose.model("userName", userAdd);

app.use('/', express.static(path.join(__dirname,'public')))

app.post("/sendMessage",body('message').isLength({min: 3, max:50}).escape(),async (request, response) => {
    try {
    const data= request.session.user.name
        const newMess = new userMes({
          user: data,
          text: request.body.message,
          timeAdded: new Date()
        });
        await newMess.save();
        response.redirect('/')
    } catch (error) {
      response.status(500).send(error);
    }
});

app.post("/signUpNow", body('use').isLength({min: 3, max:20}).escape() && body('pass').isLength({ min: 7, max:20 }).matches('[0-9]').matches('[A-Z]').matches('[a-z]').trim().escape(), async (request,response)=>{
  try{
    const counter= await userName.countDocuments({"username":`${request.body.use}`}) 
    if(counter === 0){
      bcrypt.hash(request.body.pass, 10, (err, hashedPassword) => {
        if (err) throw err
        const bruh = new userName({
          username: request.body.use,
          password: hashedPassword
        })
        bruh.save((err)=>{
          if (err) { 
            return response.send(err);
          }
          request.session.user = {
            name: request.body.use
        }
          response.redirect("/")
        })
        
      });

    }else{
      response.status(500).send('user exist')
    }
  }catch(error){
    response.status(500).send(error);
  }
})

app.post('/signIn', body('use').isLength({min: 3, max:20}).escape() && body('pass').isLength({ min: 7, max:20 }).matches('[0-9]').matches('[A-Z]').matches('[a-z]').trim().escape(), async(req, res)=>{
try{
const file= await userName.findOne({"username":`${req.body.use}`}) 
if(file !== null) {
  const pass= bcrypt.compare(req.body.pass, file.password)
  if(pass){
    req.session.user={
      name: req.body.use
    }
  }
}

res.redirect('/')

}catch(err){
res.status(404)
}
})

app.get('/api', (req, res)=>{
  if(req.session.user){
    res.send(req.session.user.name)
  }else{
    res.sendStatus(404)
  }
})

app.get('/serveMe', (req,res)=>{
  userMes.find({}).then((data)=>{
    res.send(data)
  }).catch((error)=>{console.log(error)})
})

userMes.watch().on('change', (stream)=>{
  app.use((req,res)=>{
    if(req.session.user && stream){
      res.redirect('/')
    }else{
      res.sendStatus(404)
    }
  })})


 
  
// ..

http.listen(PORT, () => console.log(`server running at http://localhost:${PORT}/`));

  