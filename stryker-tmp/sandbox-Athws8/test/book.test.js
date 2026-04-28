// @ts-nocheck
// 1. Fonksiyonu index.js içinden çağırıyoruz (Kopya değil, gerçeği!)
const { validateLoan } = require('../routes/index'); 

describe('Library Management System - ECP, BVA & Decision Table Tests', () => {

  // --- BVA (Sınır Değer Analizi) TESTLERİ ---
  test('BVA-E1: 1 day (Valid Boundary) should be Success', () => {
    expect(validateLoan(1, true, "Available")).toBe("Success");
  });

  test('BVA-U2: 22 days (Invalid Boundary) should return Error', () => {
    expect(validateLoan(22, true, "Loan duration must be between 1 and 21 days!"));
  });

  // --- ECP (Eşdeğerlik Sınıfları) TESTLERİ ---
  test('ECP-U3: "Ten" (Non-numeric) should return Numeric Error', () => {
    expect(validateLoan("Ten", true, "Available")).toBe("Loan duration must be a numeric value!");
  });

  test('ECP-U2: Empty duration should return Numeric Error', () => {
    expect(validateLoan("", true, "Available")).toBe("Loan duration must be a numeric value!");
  });

  // --- DECISION TABLE (Karar Tablosu) TESTLERİ ---
  test('DT-R1: All conditions met -> Success', () => {
    expect(validateLoan(15, true, "Available")).toBe("Success");
  });

  test('DT-R4: Unauthorized user (isBorrower false) -> Error', () => {
    expect(validateLoan(10, false, "Available")).toBe("Hata: Ödünç alma yetkiniz yok!");
  });

  test('DT-R3: Already borrowed book -> Error', () => {
    expect(validateLoan(10, true, "Borrowed")).toBe("Hata: Kitap şu an kütüphanede değil!");
  });
});