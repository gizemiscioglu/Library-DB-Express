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
