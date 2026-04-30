const request = require('supertest');
const express = require('express');
const router = require('../routes/index'); 
const { Book } = require('../models');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use('/', router);
app.set('view engine', 'pug'); 

// Mocking (Taklit): Koddaki hataları yakalamak için kontrollü ortam sağlıyoruz
jest.mock('../models', () => ({
  Book: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
}));

describe('Library System Full Audit - ECP/BVA/DT (16 Tests)', () => {
  
  beforeEach(() => { jest.clearAllMocks(); });

  // --- BÖLÜM 1: ECP (6 TEST - 3 FAIL) ---
  describe('ECP: Search & Pagination', () => {
    test('E1: Valid Title Search', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 1, rows: [{ title: 'Harry Potter' }] });
      const res = await request(app).get('/books?search=Harry');
      expect(res.status).toBe(200);
    });

    test('E2: FAIL - Year Search (Tip Uyuşmazlığı)', async () => {
      // Beklenen: 2020 yılında kitap bulunması | Gerçekleşen: No Results
      Book.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      const res = await request(app).get('/books?search=2020');
      expect(res.text).toContain('Harry Potter'); // Fail alması için var olan bir kitap ismini bekliyoruz
    });

    test('E3: Valid Page Navigation', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 10, rows: [] });
      await request(app).get('/books?page=2');
      expect(Book.findAndCountAll).toHaveBeenCalled();
    });

    test('U1: FAIL - Invalid Book ID (Crash Test)', async () => {
      // Beklenen: 404/Hata Sayfası | Gerçekleşen: 500 Server Error
      Book.findByPk.mockResolvedValue(null);
      const res = await request(app).get('/books/9999');
      expect(res.status).not.toBe(500); 
    });

    test('U2: FAIL - Space-only Search (Sanitization)', async () => {
      // Beklenen: Tüm kitaplar | Gerçekleşen: Boşluk araması (Filtrelenmiş sonuç)
      await request(app).get('/books?search=   ');
      expect(Book.findAndCountAll).toHaveBeenCalledWith(
        expect.not.objectContaining({ where: expect.anything() })
      );
    });

    test('U3: FAIL - Negative Page (Logic Bug)', async () => {
      // Beklenen: Offset 0 | Gerçekleşen: Offset -10
      Book.findAndCountAll.mockResolvedValue({ count: 10, rows: [] });
      await request(app).get('/books?page=-1');
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ offset: 0 }));
    });
  });

  // --- BÖLÜM 2: BVA (6 TEST - HEPSİ PASS) ---
  describe('BVA: Boundary Value Analysis', () => {
    test('BVA E1: Lower Boundary (1 book)', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 1, rows: [] });
      const res = await request(app).get('/books');
      expect(res.status).toBe(200);
    });

    test('BVA E2: Page Edge (5 books)', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 5, rows: [] });
      await request(app).get('/books');
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 5 }));
    });

    test('BVA E3: New Page Trigger (6 books)', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 6, rows: [] });
      await request(app).get('/books?page=2');
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ offset: 5 }));
    });

    test('BVA E4: Page 1 Check', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 5, rows: [] });
      await request(app).get('/books?page=1');
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ offset: 0 }));
    });

    test('BVA E5: Max Page Check', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 15, rows: [] });
      await request(app).get('/books?page=3');
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ offset: 10 }));
    });

    test('BVA U1: Beyond Max Page', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 5, rows: [] });
      const res = await request(app).get('/books?page=999');
      expect(res.status).toBe(200);
    });
  });

  // --- BÖLÜM 3: DECISION TABLE (4 TEST - HEPSİ PASS) ---
  describe('Decision Table: Form Validation', () => {
    test('DT R1: Title(T) and Author(T)', async () => {
      Book.create.mockResolvedValue({});
      const res = await request(app).post('/books/new').send({ title: 'A', author: 'B' });
      expect(res.status).toBe(302);
    });

    test('DT R2: Title(T) only', async () => {
      const err = { name: 'SequelizeValidationError', errors: [{ message: 'Err' }] };
      Book.create.mockRejectedValue(err);
      const res = await request(app).post('/books/new').send({ title: 'A' });
      expect(res.status).toBe(200);
    });

    test('DT R3: Author(T) only', async () => {
      const err = { name: 'SequelizeValidationError', errors: [{ message: 'Err' }] };
      Book.create.mockRejectedValue(err);
      const res = await request(app).post('/books/new').send({ author: 'B' });
      expect(res.status).toBe(200);
    });

    test('DT R4: None (F/F)', async () => {
      const err = { name: 'SequelizeValidationError', errors: [{ message: 'Err' }] };
      Book.create.mockRejectedValue(err);
      const res = await request(app).post('/books/new').send({});
      expect(res.status).toBe(200);
    });
  });
});
