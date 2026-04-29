// 1. MOCKLAMA (Router'dan önce olmalı)
jest.mock('../models', () => ({
  Book: {
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
  },
}));

const request = require('supertest');
const express = require('express');
const { validateLoan } = require('../routes/index');
const router = require('../routes/index');
const { Book } = require('../models');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- HATA DEDEKTİFİ VE RENDER SUSTURUCU ---
app.use((req, res, next) => {
  res.render = (view, locals) => {
    res.status(200).send(`Rendered: ${view}`);
  };
  next();
});

app.use('/', router);

// Eğer bir hata 500'e düşerse terminalde ne olduğunu görelim
app.use((err, req, res, next) => {
  console.log("DİKKAT! Uygulama şu hatadan dolayı 500 verdi:", err.message);
  res.status(500).send(err.message);
});

// --- TESTLER ---

describe('Library System - Final Test', () => {

  // validateLoan Testleri (Hali hazırda geçen 16 test)
  test('validateLoan: Basic Success Check', () => {
    expect(validateLoan(10, true, "Available")).toBe("Success");
  });

  describe('Express Route Logic', () => {
    
    test('Error Handling: Catching SequelizeValidationError', async () => {
      // Sequelize hata yapısını birebir taklit ediyoruz
      const mockSequelizeError = new Error();
      mockSequelizeError.name = 'SequelizeValidationError';
      // index.js içindeki .map() fonksiyonunun çökmemesi için bu yapı şart:
      mockSequelizeError.errors = [
        { message: 'Title is required' }
      ];
      
      Book.create.mockRejectedValue(mockSequelizeError);

      const res = await request(app)
        .post('/books/new')
        .send({ title: '' });

      // Eğer hala 500 alıyorsan terminaldeki "DİKKAT!" yazısını oku
      expect(res.status).toBe(200);
      expect(res.text).toContain('Rendered: new-book');
    });
  });
});
