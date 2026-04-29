const { validateLoan } = require('../routes/index');
const request = require('supertest');
const express = require('express');
const router = require('../routes/index');

const app = express();
app.use(express.urlencoded({ extended: false }));

// --- EN KESİN ÇÖZÜM: RES.RENDER'I DEVRE DIŞI BIRAKMAK ---
// Express'in render sistemini tamamen kapatıp, yerine basit bir cevap dönen 
// bir fonksiyon koyuyoruz. Artık Pug dosyalarına veya klasörlere ihtiyaç yok!
app.use((req, res, next) => {
  res.render = (view, locals) => {
    res.status(200).send(`Rendered: ${view}`);
  };
  next();
});
// ------------------------------------------------------

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

    // --- BÖLÜM 2: Express Rotaları (Pagination, Search, Error Handling) ---
    describe('Express Route Logic Tests', () => {

        test('Pagination: Should calculate correct offset for Page 2', async () => {
            Book.findAndCountAll.mockResolvedValue({ count: 10, rows: [] });
            await request(app).get('/books?page=2');
            
            // BVA Testi: (2 * 5) - 5 = 5 offset mi?
            expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
                offset: 5
            }));
        });

        test('Search: Should apply filter when search query is present', async () => {
            Book.findAndCountAll.mockResolvedValue({ count: 1, rows: [] });
            await request(app).get('/books?search=Hamlet');
            
            // ECP Testi: Arama filtresi objesi gönderiliyor mu?
            expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.any(Object)
            }));
        });

        test('Error Handling: Should catch Sequelize validation error', async () => {
            // Sahte bir Sequelize hatası yaratalım
            const validationError = new Error();
            validationError.name = 'SequelizeValidationError';
            validationError.errors = [{ message: 'Title is required' }];
            
            // Book.create çağrıldığında bu hatayı fırlat
            Book.create.mockRejectedValue(validationError);

            const res = await request(app)
                .post('/books/new')
                .send({ title: '' });

            // ARTIK HATA ALMAMALISIN:
            // res.render artık yukarıdaki sahte fonksiyonu kullanıyor (200 OK döner)
            expect(res.status).toBe(200); 
            expect(res.text).toContain('Rendered: new-book');
        });
    });
});
