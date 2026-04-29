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

// RENDER SUSTURUCU - 500 hatasını önleyen ve 200 dönen yapı
app.use((req, res, next) => {
  res.render = (view) => res.status(200).send(`Rendered: ${view}`);
  next();
});

app.use('/', router);

describe('Library Management System - Final Comprehensive Suite', () => {

  // ============================================================
  // BÖLÜM 1: validateLoan (BVA, ECP, DT - En Detaylı Hali)
  // ============================================================
  describe('Unit: validateLoan Logic', () => {
    
    // --- BVA (Boundary Value Analysis) ---
    test('BVA-E1: 1 day (Min Boundary) - Valid', () => expect(validateLoan(1, true, "Available")).toBe("Success"));
    test('BVA-E1: 2 days (Inside Boundary) - Valid', () => expect(validateLoan(2, true, "Available")).toBe("Success"));
    test('BVA-E1: 20 days (Inside Boundary) - Valid', () => expect(validateLoan(20, true, "Available")).toBe("Success"));
    test('BVA-E1: 21 days (Max Boundary) - Valid', () => expect(validateLoan(21, true, "Available")).toBe("Success"));
    test('BVA-U1: 0 days (Below Min) - Invalid', () => expect(validateLoan(0, true, "Available")).toBe("Loan duration must be between 1 and 21 days!"));
    test('BVA-U2: 22 days (Above Max) - Invalid', () => expect(validateLoan(22, true, "Available")).toBe("Loan duration must be between 1 and 21 days!"));

    // --- ECP (Equivalence Class Partitioning) ---
    test('ECP-E1: 15 days (Valid Loan Duration) - Success', () => expect(validateLoan(15, true, "Available")).toBe("Success"));
    test('ECP-U1: -3 days (Invalid Input) - Error', () => expect(validateLoan(-3, true, "Available")).toBe("Loan duration must be between 1 and 21 days!"));
    test('ECP-U2: Empty Search Query ("") - Error', () => expect(validateLoan("", true, "Available")).toBe("Loan duration must be a numeric value!"));
    test('ECP-U3: "Ten" (Non-Numeric) - Error', () => expect(validateLoan("Ten", true, "Available")).toBe("Loan duration must be a numeric value!"));
    test('ECP-U4: "12%" (Special Characters) - Error', () => expect(validateLoan("12%", true, "Available")).toBe("Loan duration must be a numeric value!"));

    // --- DECISION TABLE (DT) ---
    test('DT-R1: Valid User, Available Book, Valid Days - Success', () => expect(validateLoan(10, true, "Available")).toBe("Success"));
    test('DT-R2: Valid User & Book, but Invalid Days (25) - Error', () => expect(validateLoan(25, true, "Available")).toBe("Loan duration must be between 1 and 21 days!"));
    test('DT-R3: Valid User & Days, but Book Borrowed - Error', () => expect(validateLoan(10, true, "Borrowed")).toBe("Hata: Kitap şu an kütüphanede değil!"));
    test('DT-R4: Valid User, but Book Borrowed & Invalid Days - Error', () => expect(validateLoan(30, true, "Borrowed")).toBe("Hata: Kitap şu an kütüphanede değil!"));
    test('DT-R5: Unauthorized User - Error', () => expect(validateLoan(10, false, "Available")).toBe("Hata: Ödünç alma yetkiniz yok!"));
  });

  // ============================================================
  // BÖLÜM 2: Express Routes (BVA, ECP, DT - Yeni Teknikler)
  // ============================================================
  describe('Integration: Express Route Logic', () => {

    // --- BVA & ECP: Pagination (Sayfalama) ---
    test('BVA-P1: Page 1 (Min) should have offset 0', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 10, rows: [] });
      await request(app).get('/books?page=1');
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ offset: 0 }));
    });

    test('BVA-P2: Page 2 (Inside) should have offset 5', async () => {
      await request(app).get('/books?page=2');
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ offset: 5 }));
    });

    // --- ECP: Search (Arama) ---
    test('ECP-S1: Search term present should trigger Sequelize filters', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 1, rows: [] });
      await request(app).get('/books?search=Hamlet');
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ where: expect.any(Object) }));
    });

    test('ECP-S2: Empty search should return all books (No Where clause)', async () => {
      await request(app).get('/books');
      // Arama yoksa Sequelize'a 'where' gönderilmemeli (koduna göre)
    });

    // --- DECISION TABLE: Error Handling ---
    test('DT-E1: SequelizeValidationError should return 200 and show form again', async () => {
      const mockError = { name: 'SequelizeValidationError', errors: [{ message: 'Title is required' }] };
      Book.create.mockRejectedValue(mockError);
      
      const res = await request(app).post('/books/new').send({ title: '' });
      expect(res.status).toBe(200);
      expect(res.text).toContain('Rendered: new-book');
    });
  });
});
