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
app.use(express.urlencoded({ extended: false }));

// RENDER SUSTURUCU - Testin en kritik parçası
app.use((req, res, next) => {
  res.render = (view) => res.status(200).send(`Rendered: ${view}`);
  next();
});

app.use('/', router);

describe('Library Management System - Full Quality Assurance Suite', () => {

  // --- BÖLÜM 1: validateLoan (Unit Testler) ---
  describe('validateLoan Logic (BVA, ECP, DT)', () => {
    
    // BVA (Sınır Değer Analizi)
    test('BVA-E1: 1 day (Min) - Valid', () => expect(validateLoan(1, true, "Available")).toBe("Success"));
    test('BVA-E1: 21 days (Max) - Valid', () => expect(validateLoan(21, true, "Available")).toBe("Success"));
    test('BVA-U1: 0 days - Invalid', () => expect(validateLoan(0, true, "Available")).toContain("between 1 and 21"));
    test('BVA-U2: 22 days - Invalid', () => expect(validateLoan(22, true, "Available")).toContain("between 1 and 21"));

    // ECP (Eşdeğer Aralıklar)
    test('ECP-E1: 15 days - Valid', () => expect(validateLoan(15, true, "Available")).toBe("Success"));
    test('ECP-U3: "Ten" (Non-Numeric) - Error', () => expect(validateLoan("Ten", true, "Available")).toContain("numeric"));
    test('ECP-U2: Empty Search Query - Error', () => expect(validateLoan("", true, "Available")).toContain("numeric"));

    // Decision Table (Karar Tablosu)
    test('DT-R5: Unauthorized User - Error', () => expect(validateLoan(10, false, "Available")).toContain("yetkiniz yok"));
    test('DT-R3: Borrowed Book - Error', () => expect(validateLoan(10, true, "Borrowed")).toContain("kütüphanede değil"));
    test('DT-R4: Book Borrowed & Invalid Day - Error (Priority Check)', () => expect(validateLoan(30, true, "Borrowed")).toContain("kütüphanede değil"));
  });

  // --- BÖLÜM 2: Express Routes (Integration Testler) ---
  describe('Express Route Logic (Pagination, Search, Error Handling)', () => {

    test('Pagination: Page 2 calculation (BVA)', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 10, rows: [] });
      await request(app).get('/books?page=2');
      // offset formülü: (page * 5) - 5
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ offset: 5 }));
    });

    test('Search: Filtering check (ECP)', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 1, rows: [] });
      await request(app).get('/books?search=Hamlet');
      // Arama varken 'where' objesi gitmeli
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ where: expect.any(Object) }));
    });

    test('Error Handling: Catching Validation Exception (Decision)', async () => {
      const mockError = {
        name: 'SequelizeValidationError',
        errors: [{ message: 'Title is required' }]
      };
      Book.create.mockRejectedValue(mockError);
      
      const res = await request(app).post('/books/new').send({ title: '' });
      expect(res.status).toBe(200);
      expect(res.text).toContain('Rendered: new-book');
    });

    test('Route: Home should redirect to /books', async () => {
        const res = await request(app).get('/');
        expect(res.status).toBe(302);
        expect(res.header.location).toBe('/books');
    });
  });
});
