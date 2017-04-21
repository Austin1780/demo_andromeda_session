const app = require("express")();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/test");
const db = mongoose.connection;

const User = require("./models/User");
const {
  createSignedSessionId,
  loginMiddleware,
  loggedInOnly,
  loggedOutOnly
} = require("./services/Session");

const exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(loginMiddleware);

app.get("/", loggedInOnly, (req, res) => {
  res.render("home");
});

app.get("/logout", (req, res) => {
  res.cookie("sessionId", "");
  res.redirect("/");
});

app.get("/login", loggedOutOnly, (req, res) => {
  res.render("login");
});

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

app.listen(2000);
