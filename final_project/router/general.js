const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();


// Register a new user
public_users.post("/register", (req, res) => {
    const { username, password } = req.body; // Extract username and password from the request body

    // Check for missing fields
    if (!username && !password) {
        return res.status(400).json({ message: "Username and password are required." });
    }
    if (!username) {
        return res.status(400).json({ message: "Username is required." });
    }
    if (!password) {
        return res.status(400).json({ message: "Password is required." });
    }

    // Check if the username already exists
    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
        return res.status(409).json({ message: "Username already exists." }); // Conflict status if user exists
    }

    // Create a new user object
    const newUser = { username, password }; // In a real application, hash the password here
    users.push(newUser); // Store the new user in the users array

    return res.status(201).json({ message: "User registered successfully." }); // Success status
});

// Utility function to fetch book data
function fetchBookData(callback) {
    return new Promise((resolve, reject) => {
        const result = callback();

        if (result) {
            resolve(result);
        } else {
            reject("Book(s) not found");
        }
    });
}


// Get the book list available in the shop
public_users.get('/', (req, res) => {
    fetchBookData(() => books)
        .then((booksList) => res.status(200).json(booksList))
        .catch((error) => res.status(500).json({ message: error }));
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', (req, res) => {
    const isbn = req.params.isbn;

    fetchBookData(() => books[isbn])
        .then((book) => res.status(200).json(book))
        .catch((error) => res.status(404).json({ message: error }));
});

// Get book details based on author
public_users.get('/author/:author', (req, res) => {
    const author = req.params.author.toLowerCase();

    fetchBookData(() => {
        const booksByAuthor = [];

        for (let isbn in books) {
            if (books[isbn].author.toLowerCase() === author) {
                booksByAuthor.push(books[isbn]);
            }
        }

        return booksByAuthor.length > 0 ? booksByAuthor : null;
    })
        .then((books) => res.status(200).json(books))
        .catch((error) => res.status(404).json({ message: error }));
});

// Get book details based on title
public_users.get('/title/:title', (req, res) => {
    const title = req.params.title.toLowerCase();

    fetchBookData(() => {
        const booksByTitle = [];

        for (let isbn in books) {
            if (books[isbn].title.toLowerCase() === title) {
                booksByTitle.push(books[isbn]);
            }
        }

        return booksByTitle.length > 0 ? booksByTitle : null;
    })
        .then((books) => res.status(200).json(books))
        .catch((error) => res.status(404).json({ message: error }));
});

// Get book reviews based on ISBN
public_users.get('/review/:isbn', function (req, res) {
    const isbn = req.params.isbn; // Extract the ISBN from the URL

    // Check if the book exists for the given ISBN
    if (books[isbn]) {
        const reviews = JSON.stringify(books[isbn].reviews); // Get the reviews for the book
        return res.status(200).send(reviews); // Return the reviews
    } else {
        return res.status(404).json({ message: "Book not found" }); // Return 404 if book doesn't exist
    }
});


module.exports.general = public_users;
