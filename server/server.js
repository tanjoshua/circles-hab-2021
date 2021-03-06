// node imports
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const compression = require("compression");

const userControllers = require("./controllers/user");
const auth = require("./middleware/auth");

const User = require("./models/user");
const Post = require("./models/post");
const ActivityItem = require("./models/activity-item");
const ConnectRequest = require("./models/connect-request");

// create express app
const app = express();

// parsing data
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(helmet()); //set standard http headers for security
app.use(compression()); // compress data

// add header to all responses - allow CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});

// route not found

app.get("/", (req, res, next) => {
  console.log("check");
  res.json({sanity: "check"});
});

app.get("/test", async (req, res, next) => {
  console.log("test");
  try {
    console.log("1")
    const r = await Post.list({users: [1], pages: 1});
    console.log("2")
    res.json(r);
  } catch (error) {
    console.log("3")
    console.log(error);
    next(error);
  }
});

app.post("/user/login", userControllers.login);

app.post("/user/signup", userControllers.signup);

app.post("/feed", auth, async (req, res, next) => {
  try {
    const { page } = req.body;
    const r = await Post.list({users: [req.userId], pages: page});
    res.json(r);
  } catch (error) {
    next(error);
  }
});

app.post("/activity", auth, async (req, res, next) => {
  try {
    const { page } = req.body;
    const r = await ActivityItem.list({userId: req.userId, pages: page});
    res.json(r);
  } catch (error) {
    next(error);
  }
});

app.get("/profile", auth, async (req, res, next) => {
  try {
    const r = await User.read({userId: req.userId, otherId: req.userId});
    res.json(r);
  } catch (error) {
    next(error);
  }
});

app.get("/profile/:id", auth, async (req, res, next) => {
  try {
    const otherId = req.params.id;
    const r = await User.read({userId: req.userId, otherId});
    res.json(r);
  } catch (error) {
    next(error);
  }
});

app.post("/connect/send", auth, async (req, res, next) => {
  try {
    const { userIdReceive } = req.body;
    await ConnectRequest.send({userIdSend: req.userId, userIdReceive})
    res.json(null);
  } catch (error) {
    next(error);
  }
});

app.post("/connect/accept", auth, async (req, res, next) => {
  try {
    const { connectRequestId } = req.body;
    await ConnectRequest.accept({connectRequestId});
    res.json(null);
  } catch (error) {
    next(error);
  }
});

app.get("/post/:id", auth, async (req, res, next) => {
  try {
    const postId = req.params.id;
    const r = await Post.read({postId});
    res.json(r);
  } catch (error) {
    next(error);
  }
});

app.post("/post", auth, async (req, res, next) => {
  try {
    const { type, userId, userName, userImageUrl, text, imageUrl, usersAdded } = req.body;
    const r = await Post.create({type, userId, userName, userImageUrl, text, imageUrl, usersAdded})
    res.json({postId: r});
  } catch (error) {
    next(error);
  }
});

app.put("/post/:id", auth, async (req, res, next) => {
  try {
    const postId = req.params.id;
    const { type } = req.body;
    await Post.update({postId, type});
    res.json(null);
  } catch (error) {
    next(error);
  }
});

app.post("/post/:id/reply", auth, async (req, res, next) => {
  try {
    const postId = req.params.id;
    const { userId, text } = req.body;
    await Post.reply({postId, userId, text});
    res.json(null);
  } catch (error) {
    next(error);
  }
});

// handling errors
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message;

  res.status(status).json({ message });
});

// start server
app.listen(process.env.PORT || 3000);
