const { validateLoan } = require('../routes/index'); 

describe('Library Management System - ECP, BVA & Decision Table Tests', () => {

  // --- BVA (Sınır Değer Analizi) TESTLERİ ---
  test('BVA-E1: 1 day (Lower Boundary) - Success', () => {
    expect(validateLoan(1, true, "Available")).toBe("Success");
  });

  test('BVA-E2: 21 days (Upper Boundary) - Success', () => {
    expect(validateLoan(21, true, "Available")).toBe("Success");
  });

  test('BVA-U1: 0 days (Below Boundary) - Error', () => {
    expect(validateLoan(0, true, "Available")).toBe("Loan duration must be between 1 and 21 days!");
  });

  test('BVA-U2: 22 days (Above Boundary) - Error', () => {
    expect(validateLoan(22, true, "Available")).toBe("Loan duration must be between 1 and 21 days!");
  });

  // --- ECP (Eşdeğerlik Sınıfları) TESTLERİ ---
  test('ECP-U3: "Ten" (Non-numeric input) - Error', () => {
    expect(validateLoan("Ten", true, "Available")).toBe("Loan duration must be a numeric value!");
  });

  test('ECP-U4: Empty input - Error', () => {
    expect(validateLoan("", true, "Available")).toBe("Loan duration must be a numeric value!");
  });

  // --- DECISION TABLE (Karar Tablosu) TESTLERİ ---
  test('DT-R1: Valid user & Available book - Success', () => {
    expect(validateLoan(10, true, "Available")).toBe("Success");
  });

  test('DT-R4: Unauthorized user (isBorrower false) - Error', () => {
    expect(validateLoan(10, false, "Available")).toBe("Hata: Ödünç alma yetkiniz yok!");
  });

  test('DT-R3: Book already borrowed - Error', () => {
    expect(validateLoan(10, true, "Borrowed")).toBe("Hata: Kitap şu an kütüphanede değil!");
  });

});
