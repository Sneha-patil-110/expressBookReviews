const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

// A username is valid (available for registration) when no existing user has it.
const isValid = (username)=>{ //returns boolean
  return !users.some((user) => user.username === username);
}

// True when the username and password match a registered user.
const authenticatedUser = (username,password)=>{ //returns boolean
  return users.some((user) => user.username === username && user.password === password);
}

//only registered users can login
regd_users.post("/login", (req,res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({message: "Username and password are required"});
  }
  if (!authenticatedUser(username, password)) {
    return res.status(401).json({message: "Invalid username or password"});
  }
  const accessToken = jwt.sign({ data: username }, "access", { expiresIn: 60 * 60 });
  req.session.authorization = { accessToken, username };
  return res.status(200).json({message: "Login successful!", accessToken});
});

// Add or modify a book review. The review text is sent as ?review=...
// Each user has one review per book, so posting again replaces their earlier review.
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;
  const username = req.session.authorization.username;
  if (!books[isbn]) {
    return res.status(404).json({message: `No book found with ISBN ${isbn}`});
  }
  if (!review) {
    return res.status(400).json({message: "Provide the review text as the review query parameter"});
  }
  const existed = Object.prototype.hasOwnProperty.call(books[isbn].reviews, username);
  books[isbn].reviews[username] = review;
  return res.status(200).json({
    message: `The review for the book with ISBN ${isbn} has been ${existed ? "modified" : "added"}`,
    reviews: books[isbn].reviews,
  });
});

// Delete the logged-in user's own review for a book.
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.authorization.username;
  if (!books[isbn]) {
    return res.status(404).json({message: `No book found with ISBN ${isbn}`});
  }
  if (!Object.prototype.hasOwnProperty.call(books[isbn].reviews, username)) {
    return res.status(404).json({message: `No review by ${username} exists for ISBN ${isbn}`});
  }
  delete books[isbn].reviews[username];
  return res.status(200).json({
    message: `Review by ${username} for the book with ISBN ${isbn} has been deleted`,
    reviews: books[isbn].reviews,
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
