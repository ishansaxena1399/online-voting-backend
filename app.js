require("dotenv").config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var cors = require("cors");
var bodyParser = require("body-parser");

var authRouter = require("./routes/auth");
var adminRouter = require("./routes/admin");
var commonRoutes = require("./routes/common");

var app = express();

/*****************MONGODB SETUP START*******************/

//Set up default mongoose connection
var mongoDB = process.env.DB_URL;
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true});

//get default connection
var db = mongoose.connection;

//bind connection to error event(to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error : '));

/*******************MONGODB SETUP FINISH***************/

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://codersgas.github.io", 
    "https://codersgas.github.io/online_voting_system",
    "https://ishansaxena1399.github.io/online-voting-system/",
    "https://ishansaxena1399.github.io"
  ]
}));
app.use(logger('dev'));
// app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({
  limit: '50mb'
}));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use("/user", authRouter);
app.use("/admin", adminRouter);
app.use("/", commonRoutes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500).send({
    "status": "error",
    "message": err.message || "Something wrong occured. Please try again later",
    "errorObj": err
  });
});

module.exports = app;
