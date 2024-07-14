process.env.Node_ENV = 'test';

const request = require('supertest');

const app = require('../app');
const db = require('../db');
const { after } = require('node:test');

let book_isbn;

beforeEach(async () => {
    let result = await db.query(`
        INSERT INTO
            books (isbn, amazon_url,author,language,pages,publisher,title,year)
            VALUES(
                '123456789',
                'https://amazon.com/LordOfTheRings',
                'JRR Tolkien',
                'English',
                400,
                'Tolkien Enterprises',
                'The Two Towers', 1950)
            RETURNING isbn`);

    book_isbn = result.rows[0].isbn
});

describe('POST /books', function () {
    test('Creates a new book', async function () {
        const response = await request(app)
            .post(`/books`)
            .send({
                isbn: '987654321',
                amazon_url: "https://amazon.com/LOTR",
                author: "JRR Tolkien",
                language: "english",
                pages: 500,
                publisher: "Tolkien Enterprises",
                title: "The Return of the King",
                year: 1955
            });
        expect(response.statusCode).toBe(201);
        expect(response.body.book).toHaveProperty("isbn");
    });

    test('Prevents creating book without required data', async function () {
        const response = await request(app)
            .post(`/books`)
            .send({ author: "JRR Tolkien" });
        expect(response.statusCode).toBe(400);
    });
});

describe('GET /books', function () {
    test('Gets a list of books', async function () {
        const response = await request(app).get('/books');
        const books = response.body.books;
        expect(books).toHaveLength(1);
        expect(books[0]).toHaveProperty('isbn');
        expect(books[0]).toHaveProperty('amazon_url');
    });
});

describe('GET /books/:isbn', function () {
    test('Gets a single book', async function () {
        const response = await request(app).get(`/books/${book_isbn}`);
        expect(response.body.book).toHaveProperty('isbn');
        expect(response.body.book.isbn).toBe(book_isbn);
    });

    test('Responds with 404 if cannot find book', async function () {
        const response = await request(app).get(`/books/100`);
        expect(response.statusCode).toBe(404);
    });
});

describe('PUT /books/:isbn', function () {
    test('Updates a single book', async function () {
        const response = await request(app)
            .put(`/books/${book_isbn}`)
            .send({
                isbn: '123456789',
                amazon_url: "https://amazon.com/LordOfTheRings",
                author: "JRR Tolkien",
                language: "english",
                pages: 400,
                publisher: "Tolkien Enterprises",
                title: "The Two Towers",
                year: 1950
            }); 
        expect(response.body.book).toHaveProperty('isbn');
        expect(response.body.book.title).toBe('The Two Towers');
    } );
});

describe('DELETE /books/:isbn', function () {
    test('Deletes a single book', async function () {
        const response = await request(app).delete(`/books/${book_isbn}`);
        expect(response.body).toEqual({ message: 'Book deleted' });
    });
});

afterEach(async () => {
    await db.query('DELETE FROM books');
});

afterAll(async () => {
    await db.end();
});


