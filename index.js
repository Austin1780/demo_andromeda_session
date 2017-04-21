// Create our app
const app = require("express")();

// Require and mount the cookie and body parser middlewares
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Connect to our mongo server
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/test");

// Set up express-handlebars
const exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Require our User model and Session helpers
const User = require("./models/User");
const {
  createSignedSessionId,
  loginMiddleware,
  loggedInOnly,
  loggedOutOnly
} = require("./services/Session");

// Mount our custom loginMiddleware
app.use(loginMiddleware);

// Home route
app.get("/", loggedInOnly, (req, res) => {
  res.render("home");
});

// Login routes
app.get("/login", loggedOutOnly, (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  User.findOne({ email }, (err, user) => {
    if (!user) return res.send("NO USER");

    if (user.validatePassword(password)) {
      const sessionId = createSignedSessionId(email);
      res.cookie("sessionId", sessionId);
      res.redirect("/");
    } else {
      res.send("UNCOOL");
    }
  });
});

// Registration Routes
app.get("/register", loggedOutOnly, (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const newUser = new User({ email, password });
  newUser.save((err, user) => {
    if (err) return res.send("ERROR");

    const sessionId = createSignedSessionId(email);
    res.cookie("sessionId", sessionId);
    res.redirect("/");
  });
});

// Logout route
app.get("/logout", (req, res) => {
  res.cookie("sessionId", "");
  res.redirect("/");
});

// Start our app
app.listen(2000);
