// 1. ADIM: MODELLERİ EN TEPEDE MOCKLA (Router'dan önce!)
jest.mock('../models', () => ({
  Book: {
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
}));

const request = require('supertest');
const express = require('express');
const { validateLoan } = require('../routes/index');
const router = require('../routes/index');
const { Book } = require('../models');

// 2. ADIM: TEST İÇİN EXPRESS KURULUMU
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// RENDER MOTORUNU DEVRE DIŞI BIRAK (500 Hatasını Önler)
app.use((req, res, next) => {
  res.render = (view, locals) => {
    res.status(200).send(`Mock Render: ${view}`);
  };
  next();
});

app.use('/', router);

// --- TESTLER ---

describe('Library System - Final Comprehensive Test Suite', () => {

  // validateLoan Testleri (BVA, ECP, DT)
  describe('validateLoan Logic', () => {
    test('BVA: 1 day should be Success', () => {
      expect(validateLoan(1, true, "Available")).toBe("Success");
    });
    // ... diğer validateLoan testlerini buraya ekleyebilirsin
  });

  describe('Express Route Logic', () => {

    // PAGINATION TESTİ (BVA)
    test('Pagination: Page 2 offset calculation', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 10, rows: [] });
      await request(app).get('/books?page=2');
      expect(Book.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 5 })
      );
    });

    // SEARCH TESTİ (ECP)
    test('Search: Filtering check', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 1, rows: [] });
      await request(app).get('/books?search=test');
      expect(Book.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.any(Object) })
      );
    });

    // ERROR HANDLING TESTİ (Decision Table / Decision Coverage)
    test('Error Handling: Catching SequelizeValidationError', async () => {
      // DİKKAT: Hata objesi tam olarak index.js'nin beklediği yapıda olmalı!
      const mockSequelizeError = {
        name: 'SequelizeValidationError',
        errors: [{ message: 'Title is required' }] // .map() için bu yapı şart!
      };
      
      Book.create.mockRejectedValue(mockSequelizeError);

      const res = await request(app)
        .post('/books/new')
        .send({ title: '' });

      // Sonuç 200 olmalı çünkü catch bloğu hatayı yakalayıp sayfayı render etmeli
      expect(res.status).toBe(200);
      expect(res.text).toContain('Mock Render: new-book');
    });
  });
});
