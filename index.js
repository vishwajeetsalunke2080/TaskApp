// these are all imports

import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import passport from "passport";
import session from "express-session";
import passportGoogle from "passport-google-oauth20";
import passportMongoose from "passport-local-mongoose";
import env from "dotenv";
import gTime from 'greeting-time'
import findOrCreate from "mongoose-findorcreate";

env.config()
// constant declarations


const app = express();
app.set("view engine","ejs")
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
  secret:process.env.KEY,
  resave:false,
  saveUninitialized:false
}))
app.use(passport.initialize())
app.use(passport.session())

const port = process.env.port || 3000;

// MongoDB connection using mongoose
mongoose.connect(`mongodb+srv://user1:Zypjj2kxTylAtCB0@workshop-bakery.n2rfmy7.mongodb.net/TaskDB`);
// const conn = await mongoose.connect("mongodb://127.0.0.1:27017/TaskApp")
// task schema for storing tasks in storeDB
const taskSchema = mongoose.Schema({
  taskDesc: {
    type: String,
    max: 100,
    required: [1, "please insert task info"],
  },
  taskSwitch: String,
  username:String,
});

// user schema for authorization
const userSchema = mongoose.Schema({
  username:String,
  password:String,
  googleId:String,
  name:String,
})

userSchema.plugin(passportMongoose)
userSchema.plugin(findOrCreate)
taskSchema.plugin(findOrCreate)

// creating Collection in mongoDB as tasks
const Task = mongoose.model("task", taskSchema);

const User = mongoose.model("user",userSchema)

passport.use(User.createStrategy())

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username || user.displayName,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});


passport.use(new passportGoogle.Strategy({
  clientID:process.env.CLIENT_ID,
  clientSecret:process.env.CLIENT_SECRET,
  callbackURL:"http://localhost:3000/auth/google/home",
  userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
},
// callback fuction to get authToken,Profile,ect
  async (accessToken,refreshToken,profile,cb)=>{
  
  // registering user in user schema to store authToken
  // User.findOrCreate({googleId:profile.id,email:profile.emails[0].value,username:profile.displayName},(err,user)=>{
  //   return cb(err,user)
  // })
  const result = await User.findOne({googleId:profile.id})
  if(result==null){
    const newUsr = new User({
      googleId:profile.id,
      username:profile.displayName,
    })
    newUsr.save()
    return cb(null,newUsr)

  }else{
    return cb(null,result)
  }
}));
// express route handlers for GET,POST,etc. requests
// home route
app.get("/", function (req, res) {
  res.redirect("/login");
  
});

app.get("/auth/google",passport.authenticate("google",{scope:['profile','email']}))

app.get("/auth/google/home",passport.authenticate('google',{failureRedirect:"/login"}),
(req,res)=>{
  res.redirect("/home")
})

app.get("/login",(req,res)=>{
  res.render("login")
})

app.get("/register",(req,res)=>{
  res.render("register")
})

app.get("/home", async function (req, res) {
  if(req.isAuthenticated()){
      const taskArray = await Task.find({taskSwitch:{$ne: "on"}} ).exec()
      console.log(req.user);
      res.render("showNote", {
        listOfNotes: taskArray,
        salutation: req.user.name || req.user.username || "User",
        time:gTime(new Date())
      });
      
  }else{
    res.redirect("/")
  }
    
});

// addNote Route
app.get("/addNote", function (req, res) {
  if(req.isAuthenticated()){
    res.render("addNote")
  }else{
    res.redirect("/")
  }
});

// work profile handler
app.get("/workProfile", async function (req, res) {
  if(req.isAuthenticated()){
    const taskArray = await Task.find({taskSwitch:"on"});
    res.render("workProfile", {
      listOfNotes: taskArray,
      salutation: req.user.name || req.user.username || "User",
      time:gTime(new Date())
    });
  }else{
    res.redirect("/")
  }    
  
});

app.get("/logout",(req,res)=>{
  req.logOut((err)=>{
    if(err){
      console.error(err);
      res.redirect("home")
    }else{
      console.log("logged out successfully");
      res.redirect("/login")
    }
  })
})

app.post("/login",(req,res)=>{
  const user = new User({
    username : req.body.username,
    password : req.body.password
  })
  req.logIn(user,(err)=>{
    if(err){
      console.log(err);
      res.redirect("/login")
    }else{
      passport.authenticate("local")(req,res,()=>{
        res.redirect("/home")
      })
    }
  })
})


app.post("/register",(req,res)=>{
  User.register({username:req.body.username,name:req.body.name},req.body.password,(err,user)=>{
    if(err){
      console.error(err);
      res.redirect("/")
    }else{
      User.authenticate("local")(req,res,()=>{
        res.redirect("/login")
      })
    }
  })
})

app.post("/saveNote", function (req, res) {
  if(req.isAuthenticated())
  {
    
  const task = new Task({
    taskDesc:req.body.taskInput,
    taskSwitch:req.body.workSwitch
  })
  task.save();

  if(req.body.workSwitch)
  {
    res.redirect("/workProfile");
  }else{
    res.redirect("/home");
  }
  }else{
    res.redirect("/")
  }
  
  
});

// deleting route
app.post("/delete",async (req,res)=>{
  
    await Task.findByIdAndDelete(req.body.del)
    res.redirect("/home");
  
  
})


// server initialization
app.listen(port, function () {
  console.log(`app is listening on port ${port}`);
});
