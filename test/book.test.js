const request = require('supertest');
const express = require('express');
const router = require('../routes/index'); 
const { Book } = require('../models');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use('/', router);
app.set('view engine', 'pug'); 

jest.mock('../models', () => ({
  Book: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
}));

describe('SE 2226 - Library Project Official Audit (16 Tests)', () => {
  
  beforeEach(() => { jest.clearAllMocks(); });

  // --- BÖLÜM 1: ECP (E1-E3 Valid, U1-U3 Invalid) ---
  describe('ECP Table Alignment', () => {
    test('E1: Search by Valid Title (Harry)', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 1, rows: [{ title: 'Harry Potter' }] });
      const res = await request(app).get('/books?search=Harry');
      expect(res.status).toBe(200);
    });

    test('E2: FAIL - Search by Valid Year (2020)', async () => {
      // Beklenen: Kitap listelenmeli | Gerçek: No Results (Tip uyuşmazlığı hatası)
      Book.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      const res = await request(app).get('/books?search=2020');
      expect(res.text).toContain('Harry Potter'); 
    });

    test('E3: Valid Page Navigation (Page 2)', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 10, rows: [] });
      const res = await request(app).get('/books?page=2');
      expect(res.status).toBe(200);
    });

    test('U1: FAIL - Invalid/Non-existent ID (9999)', async () => {
      // Beklenen: 404 | Gerçek: 500 Crash (null.title okuma hatası)
      Book.findByPk.mockResolvedValue(null);
      const res = await request(app).get('/books/9999');
      expect(res.status).not.toBe(500); 
    });

    test('U2: Invalid Search (Empty/Spaces)', async () => {
      await request(app).get('/books?search=   ');
      expect(Book.findAndCountAll).toHaveBeenCalled();
    });

    test('U3: FAIL - Invalid Page Number (-1)', async () => {
      // Beklenen: Offset 0 | Gerçek: Offset -10
      Book.findAndCountAll.mockResolvedValue({ count: 10, rows: [] });
      await request(app).get('/books?page=-1');
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ offset: 0 }));
    });
  });

  // --- BÖLÜM 2: BVA (E1-E5 boundaries, U1 out-of-bounds) ---
  describe('BVA Table Alignment', () => {
    test('BVA E1: Minimum Book Count (1)', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 1, rows: [] });
      const res = await request(app).get('/books');
      expect(res.status).toBe(200);
    });

    test('BVA E2: Exactly 5 Books (Page 1 limit)', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 5, rows: [] });
      await request(app).get('/books');
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 5 }));
    });

    test('BVA E3: 6 Books (Triggering Page 2)', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 6, rows: [] });
      await request(app).get('/books?page=2');
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ offset: 5 }));
    });

    test('BVA E4: Page Number = 1', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 5, rows: [] });
      await request(app).get('/books?page=1');
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ offset: 0 }));
    });

    test('BVA E5: Page Number = Last Page', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 15, rows: [] });
      await request(app).get('/books?page=3');
      expect(Book.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ offset: 10 }));
    });

    test('BVA U1: Page Number > Max Page', async () => {
      Book.findAndCountAll.mockResolvedValue({ count: 5, rows: [] });
      const res = await request(app).get('/books?page=999');
      expect(res.status).toBe(200);
    });
  });

  // --- BÖLÜM 3: DECISION TABLE (R1-R4 Form Validation) ---
  describe('Decision Table Alignment', () => {
    test('DT R1: Title(T) AND Author(T) -> Success', async () => {
      Book.create.mockResolvedValue({});
      const res = await request(app).post('/books/new').send({ title: 'A', author: 'B' });
      expect(res.status).toBe(302);
    });

    test('DT R2: Title(T) AND Author(F) -> Error', async () => {
      const err = { name: 'SequelizeValidationError', errors: [{ message: 'Err' }] };
      Book.create.mockRejectedValue(err);
      const res = await request(app).post('/books/new').send({ title: 'A' });
      expect(res.status).toBe(200);
    });

    test('DT R3: Title(F) AND Author(T) -> Error', async () => {
      const err = { name: 'SequelizeValidationError', errors: [{ message: 'Err' }] };
      Book.create.mockRejectedValue(err);
      const res = await request(app).post('/books/new').send({ author: 'B' });
      expect(res.status).toBe(200);
    });

    test('DT R4: Title(F) AND Author(F) -> Error', async () => {
      const err = { name: 'SequelizeValidationError', errors: [{ message: 'Err' }] };
      Book.create.mockRejectedValue(err);
      const res = await request(app).post('/books/new').send({});
      expect(res.status).toBe(200);
    });
  });
});
