const express = require("express");
const cors = require("cors");
const session = require("express-session");
const mongoose = require("mongoose");
const Marvel = require("marvel");
const path = require("path");
const passport = require("./config/passport");
const MongoStore = require("connect-mongo")(session);
const dbConnection = require("./config/mongoStore");
const user = require("./routes/user");

// Configure Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Define middleware 
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use(
  session({ 
    secret: "keyboard cat", 
    store: new MongoStore({ mongooseConnection: dbConnection }),
    resave: true, 
    saveUninitialized: true })
);
app.use(passport.initialize());
app.use(passport.session());

// Connect to the Mongo DB
 mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/excelsiordb");

// Serve up static assets
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
}

// API routes

app.use('/user', user);

// Create an instance of the Marvel API library for use in API routes
const marvel = new Marvel(
  {
    // to-do: conceal these keys from view on GIT / production server
    publicKey: "4ec17a1ab75056cbf248564f7f463990",
    privateKey: "f6588b5911e153c8d42e62044dc91d2af43e8b90"
  }
);

// Find a character by name
app.get("/api/characters/:name", (req, res) => {
  const name = req.params.name;
  marvel.characters.nameStartsWith(name).get((err, resp) => {
    if (err) {
      return res.send(err).status(409).statusMessage("Server error");
    }
    res.json(resp);
  });
});

// Find a comic by title
app.get("/api/comics/:title", (req, res) => {
  const title = req.params.title;
  marvel.comics.titleStartsWith(title).get((err, resp) => {
    if (err) {
      return res.send(err).status(409).statusMessage("Server error");
    }
    res.json(resp);
  });
});

// Send every other request to the React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "./client/build/index.html"));
});

// Start the API server
app.listen(PORT, function () {
  console.log(`🌎  ==> API Server now listening on PORT ${PORT}!`);
});
