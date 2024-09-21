const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = []; // Array to store registered users

const isValid = (username) => {
  return !users.some(user => user.username === username);
};

const authenticatedUser = (username, password) => {
  return users.some(user => user.username === username && user.password === password);
};

// Login as a registered user
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body; // Extract username and password from request body

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  // Authenticate user
  if (authenticatedUser(username, password)) {
    const token = jwt.sign({ username }, 'somesecretkey'); // Replace with a secure secret
    return res.status(200).json({ message: "Login successful", token });
  } else {
    return res.status(401).json({ message: "Invalid username or password." });
  }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
  if (token) {
    jwt.verify(token, 'somesecretkey', (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Token is not valid." });
      }
      req.username = decoded.username; // Store username in request object
      next();
    });
  } else {
    return res.status(403).json({ message: "Authorization token required." });
  }
};

// Add or modify a book review
regd_users.put("/auth/review/:isbn", verifyToken, (req, res) => {
  const { isbn } = req.params;
  const { review } = req.query; // Get the review from query parameter
  const username = req.username; // Get username from decoded token

  // Validate input
  if (!review) {
    return res.status(400).json({ message: "Review is required." });
  }

  // Check if the book exists
  if (!books[isbn]) {
    return res.status(404).json({ message: "Book not found." });
  }

  // Initialize reviews if not present
  if (!books[isbn].reviews) {
    books[isbn].reviews = {};
  }

  // Add or modify the review
  books[isbn].reviews[username] = review; // Update or create review for the username
  return res.status(200).json({ message: "Review added successfully." });
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", verifyToken, (req, res) => {
  const { isbn } = req.params;
  const username = req.username; // Get username from decoded token

  // Check if the book exists
  if (!books[isbn] || !books[isbn].reviews || !books[isbn].reviews[username]) {
    return res.status(404).json({ message: "Review not found." });
  }

  // Delete the user's review
  delete books[isbn].reviews[username];
  return res.status(200).json({ message: "Review deleted successfully." });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
