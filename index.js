// these are all imports

import express from "express";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

// constant declarations

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const port = process.env.port || 3000;

// MongoDB connection using mongoose
const conn = await mongoose.connect(`mongodb+srv://user1:Zypjj2kxTylAtCB0@workshop-bakery.n2rfmy7.mongodb.net/TaskDB`);

// task schema for storing tasks in storeDB
const PersonalTaskSchema = new conn.Schema({
  taskDesc: {
    type: String,
    max: 100,
    required: [1, "please insert task info"],
  },
  taskSwitch: String
});


// creating Collection in mongoDB as tasks
const Task = mongoose.model("task", PersonalTaskSchema);

// express route handlers for GET,POST,etc. requests
// home route
app.get("/", function (req, res) {
  res.redirect("/home");
});

app.get("/home", function (req, res) {
  async function show(){
    const taskArray = await Task.find({taskSwitch:{$ne: "on"}} );
    res.render(__dirname + "/views/showNote.ejs", {
      listOfNotes: taskArray,
    });
  } 
  show()
  
});

// addNote Route
app.get("/addNote", function (req, res) {
  res.render(__dirname + "/views/addNote.ejs");
});

app.post("/saveNote", function (req, res) {
  console.log(req.body);
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
  
});

// work profile handler
app.get("/workProfile", function (req, res) {
  async function show(){
    const taskArray = await Task.find({taskSwitch:"on"});
    res.render(__dirname + "/views/workProfile.ejs", {
      listOfNotes: taskArray,
    });
  } 
  show()
});

// deleting route
app.post("/delete",(req,res)=>{
  async function del(){
    await Task.findByIdAndDelete(req.body.del)
    res.redirect("/");
  }
  del()
})


// server initialization
app.listen(port, function () {
  console.log(`app is listening on port ${port}`);
});
