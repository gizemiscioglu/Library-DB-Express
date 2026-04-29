const { validateLoan } = require('../routes/index');

describe('Library Management System - Final Test Suite (Based on Project Tables)', () => {

    // --- BVA (Boundary Value Analysis) 
    // Boundary Value Analysis: 1, 2, 20, 21 (Valid); 0, 22 (Invalid)
    test('BVA-E1: 1 day (Min Boundary) - Valid', () => {
        expect(validateLoan(1, true, "Available")).toBe("Success");
    });

    test('BVA-E1: 2 days (Inside Boundary) - Valid', () => {
        expect(validateLoan(2, true, "Available")).toBe("Success");
    });

    test('BVA-E1: 20 days (Inside Boundary) - Valid', () => {
        expect(validateLoan(20, true, "Available")).toBe("Success");
    });

    test('BVA-E1: 21 days (Max Boundary) - Valid', () => {
        expect(validateLoan(21, true, "Available")).toBe("Success");
    });

    test('BVA-U1: 0 days (Below Min) - Invalid', () => {
        expect(validateLoan(0, true, "Available")).toBe("Loan duration must be between 1 and 21 days!");
    });

    test('BVA-U2: 22 days (Above Max) - Invalid', () => {
        expect(validateLoan(22, true, "Available")).toBe("Loan duration must be between 1 and 21 days!");
    });

    // --- ECP (Equivalence Class Partitioning) 
    // Equivalence Class Partitioning: 15, -3, "", "Ten", "12%"
    test('ECP-E1: 15 days (Valid Loan Duration) - Success', () => {
        expect(validateLoan(15, true, "Available")).toBe("Success");
    });

    test('ECP-U1: -3 days (Invalid Input) - Error', () => {
        expect(validateLoan(-3, true, "Available")).toBe("Loan duration must be between 1 and 21 days!");
    });

    test('ECP-U2: Empty Search Query ("") - Error', () => {
        expect(validateLoan("", true, "Available")).toBe("Loan duration must be a numeric value!");
    });

    test('ECP-U3: "Ten" (Non-Numeric) - Error', () => {
        expect(validateLoan("Ten", true, "Available")).toBe("Loan duration must be a numeric value!");
    });

    test('ECP-U4: "12%" (Special Characters) - Error', () => {
        expect(validateLoan("12%", true, "Available")).toBe("Loan duration must be a numeric value!");
    });

    // --- DECISION TABLE 
    // R1: T, T, T -> Success
    test('DT-R1: Valid User, Available Book, Valid Days - Success', () => {
        expect(validateLoan(10, true, "Available")).toBe("Success");
    });

    // R2: T, T, F -> Invalid Days Exception
    test('DT-R2: Valid User & Book, but Invalid Days (25) - Error', () => {
        expect(validateLoan(25, true, "Available")).toBe("Loan duration must be between 1 and 21 days!");
    });

    // R3: T, F, T -> Book Unavailable Exception
    test('DT-R3: Valid User & Days, but Book Borrowed - Error', () => {
        expect(validateLoan(10, true, "Borrowed")).toBe("Hata: Kitap şu an kütüphanede değil!");
    });

    // R4: T, F, F -> Multiple Exceptions (Book Unavailable Priority)
    test('DT-R4: Valid User, but Book Borrowed & Invalid Days - Error', () => {
        expect(validateLoan(30, true, "Borrowed")).toBe("Hata: Kitap şu an kütüphanede değil!");
    });

    // R5: F, -, - -> User Not Found Exception
    test('DT-R5: Unauthorized User - Error', () => {
        expect(validateLoan(10, false, "Available")).toBe("Hata: Ödünç alma yetkiniz yok!");
    });
});
const request = require('supertest');
const express = require('express');
const router = require('../routes/index'); // Router'ın olduğu yol

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use('/', router);

// Book modelini mock'lamamız (sahtesini yapmamız) gerekiyor 
// çünkü test sırasında gerçek DB'yi kirletmek istemeyiz.
jest.mock('../models', () => ({
  Book: {
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
  },
}));

const { Book } = require('../models');

describe('Express Route Tests (Pagination & Search)', () => {

  // --- PAGINATION TESTLERİ (ECP & BVA) ---
  describe('GET /books Pagination Logic', () => {
    
    test('ECP-Valid: Page 1 should have offset 0', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 10, rows: [] });
      
      await request(app).get('/books?page=1');
      
      // Kodundaki: offset: page * 5 - 5 => 1 * 5 - 5 = 0
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        offset: 0,
        limit: 5
      }));
    });

    test('ECP-Valid: Page 2 should have offset 5', async () => {
       await request(app).get('/books?page=2');
       // 2 * 5 - 5 = 5
       expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
         offset: 5
       }));
    });
  });

  // --- SEARCH TESTLERİ (ECP) ---
  describe('GET /books Search Logic', () => {
    
    test('ECP-Search: When search query is present, it should use Op.like', async () => {
      await request(app).get('/books?search=JavaScript');
      
      // Sequelize'ın where bloğu ile çağrılıp çağrılmadığını kontrol ediyoruz
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.any(Object)
      }));
    });
  });

  // --- ERROR HANDLING TESTLERİ ---
  describe('POST /books/new Validation', () => {
    
    test('Should render new-book with errors when validation fails', async () => {
      // Sequelize hata simülasyonu
      const validationError = new Error();
      validationError.name = 'SequelizeValidationError';
      validationError.errors = [{ message: 'Title is required' }];
      
      Book.create.mockRejectedValue(validationError);

      const res = await request(app)
        .post('/books/new')
        .send({ title: '' }); // Boş veri gönderiyoruz

      expect(res.status).toBe(200); // Hata sayfası render edildiği için 200 döner
      expect(res.text).toContain('Title is required');
    });
  });
});
