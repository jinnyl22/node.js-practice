const express = require("express");
const dotenv = require("dotenv");
const ejs = require("ejs");
const mysql = require("mysql2");
const app = express();
const path = require("path");

app.use(express.urlencoded({ extended: false })); //

app.set("views", path.join(__dirname, "view"));

// app.engine("html", ejs.renderFile);
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("main.ejs");
});



app.post("/signup", (req, res) => {
  // console.log(req.body);
  
});

app.listen(3000, () => {
  console.log("서버 열림");
});
