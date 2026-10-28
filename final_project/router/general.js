const express = require('express');
const axios = require('axios');
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

// Axios helpers: retrieve book details from the API with Axios.
// BASE_URL points at the running server; override with the BASE_URL environment variable.
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// Turns an Axios failure into a readable error instead of an unhandled rejection.
const requestError = (error, what) => {
  const status = error.response ? error.response.status : 'no response';
  return new Error(`Request for ${what} failed (${status}): ${error.message}`);
};

// Get all books (async/await with try/catch).
const getAllBooks = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/`);
    return response.data;
  } catch (error) {
    throw requestError(error, 'all books');
  }
};

// Get book details by ISBN (promise chain with catch).
const getBookByISBN = (isbn) =>
  axios.get(`${BASE_URL}/isbn/${isbn}`)
    .then((response) => response.data)
    .catch((error) => { throw requestError(error, `ISBN ${isbn}`); });

// Get books by author (async/await with try/catch).
const getBooksByAuthor = async (author) => {
  try {
    const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
    return response.data;
  } catch (error) {
    throw requestError(error, `author ${author}`);
  }
};

// Get books by title (promise chain with catch).
const getBooksByTitle = (title) =>
  axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`)
    .then((response) => response.data)
    .catch((error) => { throw requestError(error, `title ${title}`); });

module.exports.general = public_users;
module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;
