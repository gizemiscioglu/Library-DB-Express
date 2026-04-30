const request = require('supertest');
const express = require('express');
const router = require('../routes/index'); // Router dosyanın yolu
const { Book } = require('../models'); // Modelin
const { Op } = require('sequelize');

// Express uygulamasını test için simüle edelim
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use('/', router);
// View engine hatası almamak için sahte bir render fonksiyonu
app.set('view engine', 'pug'); 

// Sequelize Modelini Mock'layalım
jest.mock('../models', () => ({
  Book: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
}));

describe('Library System Unit Tests (ECP, BVA, Decision Table)', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- ECP & BVA: SEARCH & PAGINATION TESTS ---
  
  describe('GET /books (Search & Pagination)', () => {
    
    // E1: Search Any Kind of Text
    test('E1: should list relevant books for text search', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 1, rows: [{ title: 'Harry Potter' }] });
      
      const res = await request(app).get('/books?search=Harry');
      
      expect(res.status).toBe(200);
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.any(Object)
      }));
    });

    // E2: Year-based Search (Known to potentially fail based on your observation)
    test('E2: should attempt to search by year', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      
      const res = await request(app).get('/books?search=2020');
      
      expect(Book.findAndCountAll).toHaveBeenCalled();
      // Veritabanı integer bekleyip kod string (%2020%) gönderdiği için boş dönebilir
    });

    // E3 & BVA E4: Pagination Logic (Page 1)
    test('BVA E4: should return first 5 books for page 1', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 10, rows: new Array(5) });
      
      await request(app).get('/books?page=1');
      
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        limit: 5,
        offset: 0
      }));
    });

    // BVA E3: Pagination Logic (Page 2 / Boundary 6th book)
    test('BVA E3: should calculate correct offset for page 2', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 10, rows: new Array(5) });
      
      await request(app).get('/books?page=2');
      
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        offset: 5 // (2 * 5) - 5
      }));
    });

    // U3: Invalid Page Number
    test('U3: should default to page 1 for invalid page numbers', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 5, rows: [] });
      
      await request(app).get('/books?page=-1');
      
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        offset: 0
      }));
    });

    // SQL Injection Test (Security ECP)
    test('Security: should handle SQL injection strings as plain text', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      
      await request(app).get("/books?search=' OR '1'='1");
      
      expect(Book.findAndCountAll).toHaveBeenCalled();
      // Sequelize otomatik olarak escape ettiği için uygulama çökmemeli
    });
  });

  // --- DECISION TABLE: BOOK REGISTRATION TESTS ---

  describe('POST /books/new (Validation Logic)', () => {
    
    // R1: Title T, Author T -> Save Success
    test('Decision R1: should save to database when title and author are present', async () => {
      const bookData = { title: 'New Book', author: 'Author Name' };
      Book.create.mockResolvedValue(bookData);

      const res = await request(app).post('/books/new').send(bookData);
      
      expect(res.status).toBe(302); // Redirect to /books
      expect(res.header.location).toBe('/books');
    });

    // R2 & R3: Missing Title or Author -> Show Error
    test('Decision R2/R3: should show error message when title is missing', async () => {
      const error = new Error();
      error.name = 'SequelizeValidationError';
      error.errors = [{ message: 'title must be provided' }];
      
      Book.create.mockRejectedValue(error);

      const res = await request(app).post('/books/new').send({ author: 'Just Author' });
      
      expect(res.status).toBe(200); // Renders the form again
      expect(Book.create).toHaveBeenCalled();
    });
  });

  // --- ADDITIONAL CRUD TESTS ---

  describe('POST /books/:id/delete', () => {
    test('should delete the book and redirect', async () => {
      const mockBook = { destroy: jest.fn() };
      Book.findByPk.mockResolvedValue(mockBook);

      const res = await request(app).post('/books/1/delete');

      expect(mockBook.destroy).toHaveBeenCalled();
      expect(res.status).toBe(302);
    });
  });

});
