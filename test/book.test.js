// 1. MOCKLAMA - En tepede olmalı
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
app.use(express.urlencoded({ extended: false }));

// --- RES.RENDER'I TAMAMEN BYPASS EDELİM ---
app.use((req, res, next) => {
  res.render = (view, locals) => {
    // locals içinde book veya errors yoksa bile çökmemesi için basit bir cevap dönelim
    res.status(200).send(`Rendered: ${view}`);
  };
  next();
});

app.use('/', router);

// --- TESTLER ---

describe('Final Library Test Suite', () => {

  // validateLoan Testleri (BVA, ECP, DT)
  describe('validateLoan Logic', () => {
    test('BVA: 1 day should be Success', () => {
      expect(validateLoan(1, true, "Available")).toBe("Success");
    });
    // Diğer testlerin burada devam ediyor...
  });

  describe('Express Route Logic', () => {
    
    test('Error Handling: Should catch SequelizeValidationError', async () => {
      // Sequelize hata yapısını index.js'nin beklediği şekilde kuralım
      const mockSequelizeError = new Error();
      mockSequelizeError.name = 'SequelizeValidationError';
      // .map() fonksiyonunun çökmemesi için 'errors' bir array olmalı
      mockSequelizeError.errors = [{ message: 'Title is required' }];
      
      // Book.create çağrıldığında bu hatayı fırlatmasını söylüyoruz
      Book.create.mockRejectedValue(mockSequelizeError);

      const res = await request(app)
        .post('/books/new')
        .send({ title: '' }); // Geçersiz veri gönderiyoruz

      // ARTIK 200 ALMALISIN
      // Çünkü res.render artık gerçek dosyaya bakmıyor, bizim sahte fonksiyonumuza bakıyor.
      expect(res.status).toBe(200);
      expect(res.text).toContain('Rendered: new-book');
    });
  });
});
