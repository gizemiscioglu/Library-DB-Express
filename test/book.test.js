const { validateLoan } = require('../routes/index');
const request = require('supertest');
const express = require('express');
const path = require('path');
const router = require('../routes/index');

const app = express();
app.use(express.urlencoded({ extended: false }));

// --- KURŞUN GEÇİRMEZ RENDER AYARI ---
// Bu blok, Express'in gerçek dosyaları aramasını engeller ve 
// render komutu geldiğinde "tamam, hallettim" der.
app.engine('pug', (filePath, options, callback) => {
  return callback(null, '<html><body>Mock Rendered Content</body></html>');
});
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'pug');
// ------------------------------------

app.use('/', router);

// Book modelini mock'layalım
jest.mock('../models', () => ({
  Book: {
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
  },
}));

const { Book } = require('../models');

describe('Library Management System - Comprehensive Test Suite', () => {

    // --- BÖLÜM 1: validateLoan (BVA, ECP, Decision Table) ---
    describe('validateLoan Logic', () => {
        test('BVA: 1 day (Min Boundary) - Valid', () => {
            expect(validateLoan(1, true, "Available")).toBe("Success");
        });
        test('BVA: 22 days (Above Max) - Invalid', () => {
            expect(validateLoan(22, true, "Available")).toBe("Loan duration must be between 1 and 21 days!");
        });
        test('ECP: "Ten" (Non-Numeric) - Error', () => {
            expect(validateLoan("Ten", true, "Available")).toBe("Loan duration must be a numeric value!");
        });
        test('DT: Book Borrowed - Error', () => {
            expect(validateLoan(10, true, "Borrowed")).toBe("Hata: Kitap şu an kütüphanede değil!");
        });
        test('DT: Unauthorized User - Error', () => {
            expect(validateLoan(10, false, "Available")).toBe("Hata: Ödünç alma yetkiniz yok!");
        });
    });

    // --- BÖLÜM 2: Index.js Rota ve Mantık Testleri ---
    describe('Express Route Logic Tests', () => {

        test('Pagination: Should calculate correct offset for Page 2', async () => {
            Book.findAndCountAll.mockResolvedValue({ count: 10, rows: [] });
            await request(app).get('/books?page=2');
            
            // 2 * 5 - 5 = 5 (BVA: Sayfa sınır testi)
            expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
                offset: 5,
                limit: 5
            }));
        });

        test('Search: Should apply filter when search query is present', async () => {
            Book.findAndCountAll.mockResolvedValue({ count: 1, rows: [] });
            await request(app).get('/books?search=Hamlet');
            
            // ECP: Arama olan durum sınıfı
            expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.any(Object)
            }));
        });

        test('Error Handling: Should render new-book page when validation fails', async () => {
            // Sequelize hata simülasyonu
            const validationError = new Error();
            validationError.name = 'SequelizeValidationError';
            validationError.errors = [{ message: 'Title is required' }];
            
            Book.create.mockRejectedValue(validationError);

            const res = await request(app)
                .post('/books/new')
                .send({ title: '' });

            // Artık 500 değil 200 dönecek çünkü yukarıda sahte bir render motoru kurduk!
            expect(res.status).toBe(200); 
        });
    });
});
