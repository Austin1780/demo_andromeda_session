const secret = process.env["secret"] || "puppies";
const md5 = require("md5");
const User = require("../models/User");

const createSignedSessionId = email => {
  return `${email}:${generateSignature(email)}`;
};

const generateSignature = email => md5(email + secret);

const loggedInOnly = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.redirect("login");
  }
};

const loggedOutOnly = (req, res, next) => {
  if (!req.user) {
    next();
  } else {
    res.redirect("/");
  }
};

const loginMiddleware = (req, res, next) => {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) return next();

  const [email, signature] = sessionId.split(":");

  User.findOne({ email }, (err, user) => {
    if (signature === generateSignature(email)) {
      req.user = user;
      res.locals.currentUser = user;
      next();
    } else {
      res.send("You've tampered with your session!");
    }
  });
};

module.exports = {
  createSignedSessionId,
  loginMiddleware,
  loggedOutOnly,
  loggedInOnly
};
