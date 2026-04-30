const request = require('supertest');
const express = require('express');
const router = require('../routes/index'); 
const { Book } = require('../models');
const { Op } = require('sequelize');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use('/', router);
app.set('view engine', 'pug'); 

// Sequelize Model Mocking
jest.mock('../models', () => ({
  Book: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
}));

describe('Complete Library System Audit (ECP, BVA, Decision Table)', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- SECTION 1: ECP - BOOK SEARCH & REGISTRATION ---
  describe('ECP: Search Functionality', () => {
    
    test('E1: Search Any Kind Of Text (Harry Potter)', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 1, rows: [{ title: 'Harry Potter' }] });
      const res = await request(app).get('/books?search=Harry');
      expect(res.status).toBe(200);
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ where: expect.any(Object) }));
    });

    test('E2: Year-based Search (2020)', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 1, rows: [{ title: 'Book A', year: 2020 }] });
      const res = await request(app).get('/books?search=2020');
      expect(res.status).toBe(200);
      // Logic check for potential numeric mismatch
    });

    test('U2: Search Blank Query', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 10, rows: new Array(5) });
      const res = await request(app).get('/books?search= ');
      expect(res.status).toBe(200);
      expect(Book.findAndCountAll).toHaveBeenCalled();
    });
  });

  // --- SECTION 2: BVA - PAGINATION LOGIC ---
  describe('BVA: Pagination Boundaries', () => {

    test('BVA E1/E2: Page = 1 when items <= 5', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 5, rows: new Array(5) });
      const res = await request(app).get('/books?page=1');
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 5, offset: 0 }));
    });

    test('BVA E3/E4: Page = 2 should be created (Boundary 6)', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 6, rows: [{ title: '6th Book' }] });
      await request(app).get('/books?page=2');
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ offset: 5 }));
    });

    test('BVA E5: Page = Max (Last books returned)', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 15, rows: new Array(5) });
      await request(app).get('/books?page=3');
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ offset: 10 }));
    });

    test('U3 (ECP) & BVA: Negative Page Number', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 10, rows: [] });
      await request(app).get('/books?page=-1');
      // Requirement: Default to Page 1 (Offset 0)
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ offset: 0 }));
    });

    test('BVA U1: Page = Max + 1 (Returns No Results)', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 10, rows: [] });
      const res = await request(app).get('/books?page=3'); 
      expect(res.text).toContain('books'); // Check if index renders correctly
    });
  });

  // --- SECTION 3: DT - BOOK REGISTRATION LOGIC ---
  describe('Decision Table: Registration Logic', () => {

    test('R1: Title(T) and Author(T) - Save to Database', async () => {
      const validBook = { title: 'Test Title', author: 'Test Author' };
      Book.create.mockResolvedValue(validBook);
      const res = await request(app).post('/books/new').send(validBook);
      expect(res.status).toBe(302); 
      expect(res.header.location).toBe('/books');
    });

    test('R2: Title(T) and Author(F) - Show Error', async () => {
      const error = { name: 'SequelizeValidationError', errors: [{ message: 'Author is required' }] };
      Book.create.mockRejectedValue(error);
      const res = await request(app).post('/books/new').send({ title: 'Title Only' });
      expect(res.status).toBe(200); 
      expect(Book.create).toHaveBeenCalled();
    });

    test('R3: Title(F) and Author(T) - Show Error', async () => {
      const error = { name: 'SequelizeValidationError', errors: [{ message: 'Title is required' }] };
      Book.create.mockRejectedValue(error);
      const res = await request(app).post('/books/new').send({ author: 'Author Only' });
      expect(res.status).toBe(200);
    });

    test('R4: Title(F) and Author(F) - Show Error', async () => {
      const error = { name: 'SequelizeValidationError', errors: [{ message: 'Fields required' }] };
      Book.create.mockRejectedValue(error);
      const res = await request(app).post('/books/new').send({});
      expect(res.status).toBe(200);
    });
  });

  // --- SECTION 4: CRUD OPERATIONS (DELETE/UPDATE) ---
  describe('CRUD Operations', () => {
    test('Delete: should destroy book and redirect', async () => {
      const mockBook = { destroy: jest.fn() };
      Book.findByPk.mockResolvedValue(mockBook);
      const res = await request(app).post('/books/1/delete');
      expect(mockBook.destroy).toHaveBeenCalled();
      expect(res.status).toBe(302);
    });
  });
});
