const { validateLoan } = require('../routes/index');
const request = require('supertest');
const express = require('express');
const path = require('path');
const router = require('../routes/index');

// Test için sanal Express uygulaması
const app = express();
app.use(express.urlencoded({ extended: false }));

// --- KRİTİK AYAR: Render hatasını çözen kısım ---
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'pug'); // Projen genelde Pug kullanır, eğer EJS ise 'ejs' yapabilirsin
// -----------------------------------------------

app.use('/', router);

// Book modelini mock'layalım (DB simülasyonu)
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
    // (Senin yazdığın 16 testlik kısım burada aynen kalıyor)
    test('BVA: 1 day (Min Boundary) - Valid', () => {
        expect(validateLoan(1, true, "Available")).toBe("Success");
    });
    // ... (diğer validateLoan testlerin)

    // --- BÖLÜM 2: Index.js İçindeki Fonksiyonların Testleri ---
    describe('Express Route Logic Tests', () => {

        // 1. PAGINATION (SAYFALAMA) MANTIĞI TESTİ
        test('Pagination: Should calculate correct offset for Page 2', async () => {
            Book.findAndCountAll.mockResolvedValue({ count: 10, rows: [] });
            
            await request(app).get('/books?page=2');
            
            // Kodundaki hesaplama: offset = page * 5 - 5 => 2 * 5 - 5 = 5
            expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
                offset: 5,
                limit: 5
            }));
        });

        // 2. SEARCH (ARAMA) MANTIĞI TESTİ
        test('Search: Should apply "where" filter when search query is present', async () => {
            Book.findAndCountAll.mockResolvedValue({ count: 1, rows: [] });
            
            await request(app).get('/books?search=Hamlet');
            
            // Arama yapıldığında Sequelize'a 'where' objesi gitmeli
            expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.any(Object)
            }));
        });

        // 3. VALIDATION ERROR (HATA YÖNETİMİ) TESTİ
        test('Error Handling: Should render new-book page when validation fails', async () => {
            const validationError = new Error();
            validationError.name = 'SequelizeValidationError';
            validationError.errors = [{ message: 'Title is required' }];
            
            Book.create.mockRejectedValue(validationError);

            const res = await request(app)
                .post('/books/new')
                .send({ title: '' });

            // Artık 500 değil, 200 dönecek çünkü render ayarını yaptık
            expect(res.status).toBe(200); 
            expect(res.text).toContain('Title is required');
        });
    });
});
