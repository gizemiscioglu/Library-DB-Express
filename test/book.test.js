// 1. MOCKLAMA - Dosyanın en tepesinde olmalı
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

// RENDER SUSTURUCU - 500 hatasını önleyen kahraman
app.use((req, res, next) => {
  res.render = (view) => res.status(200).send(`Rendered: ${view}`);
  next();
});

app.use('/', router);

describe('Library Management System - COMPLETE TEST SUITE', () => {

  // --- BÖLÜM 1: validateLoan (16 TEST - BVA, ECP, DT) ---
  describe('validateLoan Logic (Unit Tests)', () => {
    
    // BVA (Boundary Value Analysis)
    test('BVA: 1 day (Min) - Valid', () => expect(validateLoan(1, true, "Available")).toBe("Success"));
    test('BVA: 21 days (Max) - Valid', () => expect(validateLoan(21, true, "Available")).toBe("Success"));
    test('BVA: 0 days - Invalid', () => expect(validateLoan(0, true, "Available")).toContain("between 1 and 21"));
    test('BVA: 22 days - Invalid', () => expect(validateLoan(22, true, "Available")).toContain("between 1 and 21"));

    // ECP (Equivalence Class Partitioning)
    test('ECP: 15 days - Valid', () => expect(validateLoan(15, true, "Available")).toBe("Success"));
    test('ECP: Non-numeric "Ten" - Error', () => expect(validateLoan("Ten", true, "Available")).toContain("numeric"));
    test('ECP: Empty string - Error', () => expect(validateLoan("", true, "Available")).toContain("numeric"));
    test('ECP: Special chars "12%" - Error', () => expect(validateLoan("12%", true, "Available")).toContain("numeric"));

    // Decision Table (Karar Tablosu)
    test('DT: Unauthorized User - Error', () => expect(validateLoan(10, false, "Available")).toContain("yetkiniz yok"));
    test('DT: Borrowed Book - Error', () => expect(validateLoan(10, true, "Borrowed")).toContain("kütüphanede değil"));
    test('DT: Book Borrowed & Invalid Day - Error (Priority Check)', () => expect(validateLoan(30, true, "Borrowed")).toContain("kütüphanede değil"));
    test('DT: Valid User & Available Book & Valid Days - Success', () => expect(validateLoan(10, true, "Available")).toBe("Success"));
  });

  // --- BÖLÜM 2: Express Route & Logic (Integration Tests) ---
  describe('Express Route Logic (Pagination, Search, Errors)', () => {

    test('Pagination: Page 2 should have offset 5 (BVA)', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 10, rows: [] });
      await request(app).get('/books?page=2');
      // Kodundaki: offset = page * 5 - 5
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ offset: 5 }));
    });

    test('Search: Should use filters when search query is present (ECP)', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 1, rows: [] });
      await request(app).get('/books?search=test');
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ where: expect.any(Object) }));
    });

    test('Error Handling: Catching SequelizeValidationError (Decision)', async () => {
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
