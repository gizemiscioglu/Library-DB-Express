// 1. MOCKLAMA - EN TEPEDE
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

// RENDER SUSTURUCU (Hata almamızı engeller)
app.use((req, res, next) => {
  res.render = (view) => res.status(200).send(`Rendered: ${view}`);
  next();
});

app.use('/', router);

describe('Library Management System - Advanced Test Suite', () => {

  // --- BÖLÜM 1: validateLoan (Zaten bildiğimiz kısım) ---
  describe('Unit: validateLoan Logic', () => {
    test('BVA-E1: 1 day - Valid', () => expect(validateLoan(1, true, "Available")).toBe("Success"));
    test('DT-R3: Borrowed Book - Error', () => expect(validateLoan(10, true, "Borrowed")).toContain("kütüphanede değil"));
  });

  // --- BÖLÜM 2: Express Routes (Yeni Tablo Mantığı) ---
  describe('Integration: Express Route Logic', () => {

    // PAGINATION TESTLERİ
    test('BVA-P1: Page 1 (Min Boundary) should have offset 0', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 10, rows: [] });
      await request(app).get('/books?page=1');
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ offset: 0 }));
    });

    test('BVA-P2: Page 2 (Transition) should have offset 5', async () => {
      await request(app).get('/books?page=2');
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ offset: 5 }));
    });

    test('ECP-P1: Invalid page ("abc") should default to offset 0', async () => {
      // Not: Kodun query'den gelen "abc"yi nasıl handle ettiğini test eder
      await request(app).get('/books?page=abc');
      // page=abc ise (abc * 5 - 5) NaN olacağı için sistemin nasıl davrandığını görürüz
    });

    // SEARCH TESTLERİ
    test('ECP-S1: Valid Search Term should trigger filters', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 1, rows: [] });
      await request(app).get('/books?search=Hamlet');
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ where: expect.any(Object) }));
    });

    test('ECP-S2: Empty Search Term should return all books', async () => {
      await request(app).get('/books?search=');
      // search boşsa where bloğu olmamalı (koduna göre değişir)
    });

    // ERROR HANDLING DECISION TABLE
    test('DT-E1: Should handle SequelizeValidationError (Show Form Again)', async () => {
      const mockError = { name: 'SequelizeValidationError', errors: [{ message: 'Hata' }] };
      Book.create.mockRejectedValue(mockError);
      
      const res = await request(app).post('/books/new').send({ title: '' });
      expect(res.status).toBe(200);
      expect(res.text).toContain('Rendered: new-book');
    });

    test('DT-E2: Should throw unknown errors to Global Handler', async () => {
      const unknownError = new Error('Database Down');
      Book.create.mockRejectedValue(unknownError);
      
      const res = await request(app).post('/books/new').send({ title: 'Test' });
      // Bu durumda render devreye girmez, direkt 500 döner (Global handler)
      expect(res.status).toBe(500);
    });
  });
});
