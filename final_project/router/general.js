const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

// Base URL of this server, used by the Axios requests below
const BASE_URL = "http://localhost:5000";


// Register a new user
public_users.post("/register", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(404).json({message: "Unable to register user. Username and password are required."});
  }
  if (!isValid(username)) {
    return res.status(404).json({message: "User already exists!"});
  }
  users.push({"username": username, "password": password});
  return res.status(200).json({message: "User successfully registered. Now you can login"});
});

// Get the book list available in the shop (using a Promise)
public_users.get('/', function (req, res) {
  const getAllBooks = new Promise((resolve, reject) => {
    if (books) {
      resolve(books);
    } else {
      reject("No books available");
    }
  });

  getAllBooks
    .then((allBooks) => res.send(JSON.stringify(allBooks, null, 4)))
    .catch((error) => res.status(500).json({message: error}));
});

// Get book details based on ISBN (Axios with Promise callbacks)
public_users.get('/isbn/:isbn', function (req, res) {
  const isbn = req.params.isbn;

  axios.get(`${BASE_URL}/`)
    .then((response) => {
      const allBooks = response.data;
      if (allBooks[isbn]) {
        return res.send(JSON.stringify(allBooks[isbn], null, 4));
      }
      return res.status(404).json({message: `Book with ISBN ${isbn} not found`});
    })
    .catch((error) => res.status(500).json({message: "Error retrieving book details", error: error.message}));
});

// Get book details based on author (Axios with async/await)
public_users.get('/author/:author', async function (req, res) {
  const author = req.params.author;

  try {
    const response = await axios.get(`${BASE_URL}/`);
    const allBooks = response.data;

    const booksByAuthor = Object.keys(allBooks)
      .filter((isbn) => allBooks[isbn].author.toLowerCase() === author.toLowerCase())
      .map((isbn) => ({ isbn: isbn, title: allBooks[isbn].title, reviews: allBooks[isbn].reviews }));

    if (booksByAuthor.length > 0) {
      return res.send(JSON.stringify({ booksbyauthor: booksByAuthor }, null, 4));
    }
    return res.status(404).json({message: `No books found by author ${author}`});
  } catch (error) {
    return res.status(500).json({message: "Error retrieving books by author", error: error.message});
  }
});

// Get all books based on title (Axios with async/await)
public_users.get('/title/:title', async function (req, res) {
  const title = req.params.title;

  try {
    const response = await axios.get(`${BASE_URL}/`);
    const allBooks = response.data;

    const booksByTitle = Object.keys(allBooks)
      .filter((isbn) => allBooks[isbn].title.toLowerCase() === title.toLowerCase())
      .map((isbn) => ({ isbn: isbn, author: allBooks[isbn].author, reviews: allBooks[isbn].reviews }));

    if (booksByTitle.length > 0) {
      return res.send(JSON.stringify({ booksbytitle: booksByTitle }, null, 4));
    }
    return res.status(404).json({message: `No books found with title ${title}`});
  } catch (error) {
    return res.status(500).json({message: "Error retrieving books by title", error: error.message});
  }
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  if (books[isbn]) {
    return res.send(JSON.stringify(books[isbn].reviews, null, 4));
  }
  return res.status(404).json({message: "Book not found"});
});

module.exports.general = public_users;
