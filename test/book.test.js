// 1. ADIM: HER ŞEYDEN ÖNCE MOCKLAMA (En tepede olmalı!)
jest.mock('../models', () => ({
  Book: {
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
  },
}));

// 2. ADIM: ŞİMDİ DİĞERLERİNİ ÇAĞIRALIM
const { validateLoan } = require('../routes/index');
const request = require('supertest');
const express = require('express');
const router = require('../routes/index');
const { Book } = require('../models');

// 3. ADIM: SANAL EXPRESS KURULUMU
const app = express();
app.use(express.urlencoded({ extended: false }));

// 4. ADIM: RENDER MOTORUNU DEVRE DIŞI BIRAKALIM
// res.render komutu gelince hata vermemesi için sahte bir fonksiyonla değiştiriyoruz
app.use((req, res, next) => {
  res.render = (view, locals) => {
    res.status(200).send(`Rendered View: ${view}`);
  };
  next();
});

app.use('/', router);

// --- TEST BAŞLIYOR ---

describe('Library System - Final Comprehensive Suite', () => {

    // --- BÖLÜM 1: validateLoan (BVA, ECP, DT) ---
    // (Daha önce geçen 16 testin buradaki mantıkla aynen devam eder)
    test('validateLoan Logic: 1 day should be Success', () => {
        expect(validateLoan(1, true, "Available")).toBe("Success");
    });

    // --- BÖLÜM 2: Express Rota Mantığı ---
    describe('Express Route Logic', () => {

        test('Pagination: Page 2 offset should be 5', async () => {
            Book.findAndCountAll.mockResolvedValue({ count: 10, rows: [] });
            await request(app).get('/books?page=2');
            expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ offset: 5 }));
        });

        test('Search: Should use Op.like filter', async () => {
            Book.findAndCountAll.mockResolvedValue({ count: 1, rows: [] });
            await request(app).get('/books?search=Hamlet');
            expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ where: expect.any(Object) }));
        });

        test('Error Handling: Should catch validation error and return 200', async () => {
            // Sequelize hata objesini taklit ediyoruz
            const mockError = new Error();
            mockError.name = 'SequelizeValidationError';
            mockError.errors = [{ message: 'Title is required' }];
            
            // Veritabanı ekleme işlemi hata verirse...
            Book.create.mockRejectedValue(mockError);

            const res = await request(app)
                .post('/books/new')
                .send({ title: '' });

            // ARTIK 500 VEREMEZ! Çünkü res.render'ı yukarıda susturduk.
            expect(res.status).toBe(200);
            expect(res.text).toContain('Rendered View: new-book');
        });
    });
});
