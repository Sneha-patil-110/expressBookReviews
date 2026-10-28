const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

// Register a new customer.
public_users.post("/register", (req,res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({message: "Username and password are required"});
  }
  if (!isValid(username)) {
    return res.status(409).json({message: "User already exists"});
  }
  users.push({ username, password });
  return res.status(200).json({message: "Customer successfully registered. Now you can login"});
});

// Get the full book list. Uses async/await; the list is returned as a Promise.
public_users.get('/', async function (req, res) {
  const allBooks = await new Promise((resolve) => resolve(books));
  return res.status(200).send(JSON.stringify(allBooks, null, 4));
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', async function (req, res) {
  const isbn = req.params.isbn;
  const book = await new Promise((resolve) => resolve(books[isbn]));
  if (!book) {
    return res.status(404).json({message: `No book found with ISBN ${isbn}`});
  }
  return res.status(200).json({ [isbn]: book });
});

// Get books by author (exact match). Returns every book with that author.
public_users.get('/author/:author', async function (req, res) {
  const author = req.params.author;
  const matches = await new Promise((resolve) => {
    resolve(Object.fromEntries(Object.entries(books).filter(([, b]) => b.author === author)));
  });
  if (Object.keys(matches).length === 0) {
    return res.status(404).json({message: `No books found by author ${author}`});
  }
  return res.status(200).json(matches);
});

// Get books by title (exact match). Returns every book with that title.
public_users.get('/title/:title', async function (req, res) {
  const title = req.params.title;
  const matches = await new Promise((resolve) => {
    resolve(Object.fromEntries(Object.entries(books).filter(([, b]) => b.title === title)));
  });
  if (Object.keys(matches).length === 0) {
    return res.status(404).json({message: `No books found with title ${title}`});
  }
  return res.status(200).json(matches);
});

// Get all reviews for a book by ISBN.
public_users.get('/review/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  if (!books[isbn]) {
    return res.status(404).json({message: `No book found with ISBN ${isbn}`});
  }
  return res.status(200).json(books[isbn].reviews);
});

module.exports.general = public_users;
