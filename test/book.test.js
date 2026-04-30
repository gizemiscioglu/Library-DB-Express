const request = require('supertest');
const express = require('express');
const router = require('../routes/index'); 
const { Book } = require('../models');

const app = express();
app.use(express.json());
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

describe('SE 2226 - Full Coverage Audit (20 Tests)', () => {
  
  beforeEach(() => { jest.clearAllMocks(); });

  // --- ÖNCEKİ ECP TESTLERİ (E1-E3, U1-U3) ---
  describe('ECP: Search & Core Functions', () => {
    test('E1: Valid Title Search', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 1, rows: [{ title: 'Harry' }] });
      const res = await request(app).get('/books?search=Harry');
      expect(res.status).toBe(200);
    });

    test('E2: FAIL - Year Search (Type Mismatch)', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      const res = await request(app).get('/books?search=2020');
      expect(res.text).toContain('Harry Potter'); 
    });

    test('U1: FAIL - Non-existent ID (Crash)', async () => {
      Book.findByPk.mockResolvedValue(null);
      const res = await request(app).get('/books/9999');
      expect(res.status).not.toBe(500); 
    });

    test('U3: FAIL - Negative Page', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 10, rows: [] });
      await request(app).get('/books?page=-1');
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ offset: 0 }));
    });
  });

  // --- YENİ EKLENEN TESTLER (UPDATE & DELETE) ---
  describe('ECP: Update & Delete Operations', () => {
    // E4: Geçerli Güncelleme
    test('E4: Valid Book Update', async () => {
      Book.findByPk.mockResolvedValue({ update: jest.fn().mockResolvedValue({}) });
      const res = await request(app).post('/books/1').send({ title: 'New Title', author: 'New Author' });
      expect(res.status).toBe(302); // Redirect to /books
    });

    // U4: Geçersiz Güncelleme (Boş veri)
    test('U4: Update with Empty Fields', async () => {
      const err = { name: 'SequelizeValidationError', errors: [{ message: 'Title is required' }] };
      Book.findByPk.mockResolvedValue({ update: jest.fn().mockRejectedValue(err) });
      const res = await request(app).post('/books/1').send({ title: '' });
      expect(res.status).toBe(200); // Renders edit page with errors
    });

    // E5: Geçerli Silme
    test('E5: Valid Book Delete', async () => {
      Book.findByPk.mockResolvedValue({ destroy: jest.fn().mockResolvedValue({}) });
      const res = await request(app).post('/books/1/delete');
      expect(res.status).toBe(302);
    });

    // U5: Geçersiz Silme (Olmayan ID)
    test('U5: FAIL - Delete Non-existent Book', async () => {
      Book.findByPk.mockResolvedValue(null);
      const res = await request(app).post('/books/9999/delete');
      expect(res.status).not.toBe(500);
    });
  });

  // --- BVA (6 Test) & Decision Table (4 Test) Bölümleri Aynen Kalacak ---
  // (Önceki kodundaki BVA ve Decision Table testlerini buraya yapıştırabilirsin)
});
