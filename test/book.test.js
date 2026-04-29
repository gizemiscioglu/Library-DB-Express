const { validateLoan } = require('../routes/index');
const request = require('supertest');
const express = require('express');
const path = require('path');
const router = require('../routes/index');

// Test için sahte Express uygulaması
const app = express();
app.use(express.urlencoded({ extended: false }));

// RENDER HATASINI ÇÖZEN AYARLAR:
// Express'e 'views' klasörünün yerini ve pug motorunu kullanacağını söylüyoruz
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'pug');

app.use('/', router);

// Book modelini mock'layalım (Veritabanı bağlantısını taklit ediyoruz)
jest.mock('../models', () => ({
  Book: {
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
}));

const { Book } = require('../models');

describe('Library Management System - Comprehensive Test Suite', () => {

    // --- BÖLÜM 1: validateLoan (Birim Testleri) ---
    describe('validateLoan Logic (BVA, ECP, Decision Table)', () => {
        test('BVA: 1 day (Min Boundary) - Valid', () => {
            expect(validateLoan(1, true, "Available")).toBe("Success");
        });

        test('BVA: 22 days (Above Max) - Invalid', () => {
            expect(validateLoan(22, true, "Available")).toBe("Loan duration must be between 1 and 21 days!");
        });

        test('ECP: "Ten" (Non-Numeric) - Error', () => {
            expect(validateLoan("Ten", true, "Available")).toBe("Loan duration must be a numeric value!");
        });

        test('DT: Book Borrowed & Invalid Days - Error (Priority Check)', () => {
            expect(validateLoan(30, true, "Borrowed")).toBe("Hata: Kitap şu an kütüphanede değil!");
        });

        test('DT: Unauthorized User - Error', () => {
            expect(validateLoan(10, false, "Available")).toBe("Hata: Ödünç alma yetkiniz yok!");
        });
        
        // (Diğer yazdığın validateLoan testlerini buraya ekli tutabilirsin, kısalık için birkaçını yazdım)
    });

    // --- BÖLÜM 2: Express Route & Logic Tests ---
    describe('Express Route Logic', () => {

        // 1. PAGINATION (SAYFALAMA) TESTİ
        test('Pagination: Page 2 should calculate offset 5', async () => {
            Book.findAndCountAll.mockResolvedValue({ count: 10, rows: [] });
            await request(app).get('/books?page=2');
            
            // Kodundaki mantık: offset = page * 5 - 5 => 2 * 5 - 5 = 5
            expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
                offset: 5,
                limit: 5
            }));
        });

        // 2. SEARCH (ARAMA) TESTİ
        test('Search: Should use Sequelize Op.like when search query is present', async () => {
            Book.findAndCountAll.mockResolvedValue({ count: 1, rows: [] });
            await request(app).get('/books?search=JavaScript');
            
            // where bloğunun gönderilip gönderilmediğini kontrol eder
            expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.any(Object)
            }));
        });

        // 3. VALIDATION & ERROR HANDLING (HATA YÖNETİMİ) TESTİ
        test('Error Handling: Should render new-book with errors when Sequelize validation fails', async () => {
            const validationError = new Error();
            validationError.name = 'SequelizeValidationError';
            validationError.errors = [{ message: 'Title is required' }];
            
            Book.create.mockRejectedValue(validationError);

            const res = await request(app)
                .post('/books/new')
                .send({ title: '' }); // Geçersiz boş veri

            expect(res.status).toBe(200); // 500 değil, 200 (hata sayfası) dönmeli
            expect(res.text).toContain('Title is required');
        });
    });
});
