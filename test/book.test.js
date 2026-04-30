const request = require('supertest');
const express = require('express');
const router = require('../routes/index'); 
const { Book } = require('../models');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use('/', router);
app.set('view engine', 'pug'); 

jest.mock('../models', () => ({
  Book: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
}));

describe('Library System - Full Audit (16 Scenarios)', () => {
  
  beforeEach(() => { jest.clearAllMocks(); });

  // --- SECTION 1: ECP (6 TESTS) ---
  describe('ECP Scenarios', () => {
    test('E1: Search Any Kind Of Text', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 1, rows: [{ title: 'Harry Potter' }] });
      const res = await request(app).get('/books?search=Harry');
      expect(res.status).toBe(200);
    });

    test('E2: Year-based Search', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 1, rows: [{ title: '2020 Book', year: 2020 }] });
      await request(app).get('/books?search=2020');
      expect(Book.findAndCountAll).toHaveBeenCalled();
    });

    test('E3: Pagination (URL - Page 2)', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 10, rows: [] });
      await request(app).get('/books?page=2');
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ offset: 5 }));
    });

    test('U1: Create New Book (Validation Trigger)', async () => {
      const error = { name: 'SequelizeValidationError', errors: [{ message: 'Error' }] };
      Book.create.mockRejectedValue(error);
      const res = await request(app).post('/books/new').send({});
      expect(res.status).toBe(200);
    });

    test('U2: Search Blank Query', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 5, rows: [] });
      await request(app).get('/books?search= ');
      expect(Book.findAndCountAll).toHaveBeenCalled();
    });

    test('U3: Pagination With Invalid Number (Negative)', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 10, rows: [] });
      await request(app).get('/books?page=-1');
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ offset: 0 }));
    });
  });

  // --- SECTION 2: BVA (6 TESTS) ---
  describe('BVA Scenarios', () => {
    test('BVA E1: 1 <= e <= 4 (No pagination buttons)', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 4, rows: [] });
      const res = await request(app).get('/books');
      expect(res.status).toBe(200);
    });

    test('BVA E2: 4 < e = 5 (Exactly 1 page)', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 5, rows: [] });
      await request(app).get('/books');
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 5 }));
    });

    test('BVA E3: 5 < e <= 10 (Page 2 should be created)', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 6, rows: [] });
      await request(app).get('/books?page=2');
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ offset: 5 }));
    });

    test('BVA E4: Page = 1', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 5, rows: [] });
      await request(app).get('/books?page=1');
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ offset: 0 }));
    });

    test('BVA E5: Page = Max', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 15, rows: [] });
      await request(app).get('/books?page=3');
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ offset: 10 }));
    });

    test('BVA U1: Page = Max + 1', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 10, rows: [] });
      const res = await request(app).get('/books?page=3');
      expect(res.text).toContain('books');
    });
  });

  // --- SECTION 3: DECISION TABLE (4 TESTS) ---
  describe('Decision Table Scenarios', () => {
    test('DT R1: Title(T), Author(T)', async () => {
      Book.create.mockResolvedValue({});
      const res = await request(app).post('/books/new').send({ title: 'A', author: 'B' });
      expect(res.status).toBe(302);
    });

    test('DT R2: Title(T), Author(F)', async () => {
      const err = { name: 'SequelizeValidationError', errors: [] };
      Book.create.mockRejectedValue(err);
      const res = await request(app).post('/books/new').send({ title: 'A' });
      expect(res.status).toBe(200);
    });

    test('DT R3: Title(F), Author(T)', async () => {
      const err = { name: 'SequelizeValidationError', errors: [] };
      Book.create.mockRejectedValue(err);
      const res = await request(app).post('/books/new').send({ author: 'B' });
      expect(res.status).toBe(200);
    });

    test('DT R4: Title(F), Author(F)', async () => {
      const err = { name: 'SequelizeValidationError', errors: [] };
      Book.create.mockRejectedValue(err);
      const res = await request(app).post('/books/new').send({});
      expect(res.status).toBe(200);
    });
  });
});
