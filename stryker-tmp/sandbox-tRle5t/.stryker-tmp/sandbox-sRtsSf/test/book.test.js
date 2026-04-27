// @ts-nocheck
// 
// Uygulama mantığını test eden fonksiyon
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
const validateLoan = (loanDuration, isBorrower, bookStatus) => {
  if (stryMutAct_9fa48("0")) {
    {}
  } else {
    stryCov_9fa48("0");
    // 1. ECP & BVA: Sayısal mı ve boş mu?
    if (stryMutAct_9fa48("3") ? (loanDuration === undefined || loanDuration === "") && isNaN(loanDuration) : stryMutAct_9fa48("2") ? false : stryMutAct_9fa48("1") ? true : (stryCov_9fa48("1", "2", "3"), (stryMutAct_9fa48("5") ? loanDuration === undefined && loanDuration === "" : stryMutAct_9fa48("4") ? false : (stryCov_9fa48("4", "5"), (stryMutAct_9fa48("7") ? loanDuration !== undefined : stryMutAct_9fa48("6") ? false : (stryCov_9fa48("6", "7"), loanDuration === undefined)) || (stryMutAct_9fa48("9") ? loanDuration !== "" : stryMutAct_9fa48("8") ? false : (stryCov_9fa48("8", "9"), loanDuration === (stryMutAct_9fa48("10") ? "Stryker was here!" : (stryCov_9fa48("10"), "")))))) || isNaN(loanDuration))) {
      if (stryMutAct_9fa48("11")) {
        {}
      } else {
        stryCov_9fa48("11");
        return stryMutAct_9fa48("12") ? "" : (stryCov_9fa48("12"), "Loan duration must be a numeric value!");
      }
    }
    const duration = parseInt(loanDuration);

    // 2. BVA: 1-21 gün aralığı mı?
    if (stryMutAct_9fa48("15") ? duration < 1 && duration > 21 : stryMutAct_9fa48("14") ? false : stryMutAct_9fa48("13") ? true : (stryCov_9fa48("13", "14", "15"), (stryMutAct_9fa48("18") ? duration >= 1 : stryMutAct_9fa48("17") ? duration <= 1 : stryMutAct_9fa48("16") ? false : (stryCov_9fa48("16", "17", "18"), duration < 1)) || (stryMutAct_9fa48("21") ? duration <= 21 : stryMutAct_9fa48("20") ? duration >= 21 : stryMutAct_9fa48("19") ? false : (stryCov_9fa48("19", "20", "21"), duration > 21)))) {
      if (stryMutAct_9fa48("22")) {
        {}
      } else {
        stryCov_9fa48("22");
        return stryMutAct_9fa48("23") ? "" : (stryCov_9fa48("23"), "Loan duration must be between 1 and 21 days!");
      }
    }

    // 3. Karar Tablosu: Kullanıcı yetkili mi? (R4 senaryosu)
    if (stryMutAct_9fa48("26") ? isBorrower === false && isBorrower === "false" : stryMutAct_9fa48("25") ? false : stryMutAct_9fa48("24") ? true : (stryCov_9fa48("24", "25", "26"), (stryMutAct_9fa48("28") ? isBorrower !== false : stryMutAct_9fa48("27") ? false : (stryCov_9fa48("27", "28"), isBorrower === (stryMutAct_9fa48("29") ? true : (stryCov_9fa48("29"), false)))) || (stryMutAct_9fa48("31") ? isBorrower !== "false" : stryMutAct_9fa48("30") ? false : (stryCov_9fa48("30", "31"), isBorrower === (stryMutAct_9fa48("32") ? "" : (stryCov_9fa48("32"), "false")))))) {
      if (stryMutAct_9fa48("33")) {
        {}
      } else {
        stryCov_9fa48("33");
        return stryMutAct_9fa48("34") ? "" : (stryCov_9fa48("34"), "Hata: Ödünç alma yetkiniz yok!");
      }
    }

    // 4. Karar Tablosu: Kitap kütüphanede mi? (R3 senaryosu)
    if (stryMutAct_9fa48("37") ? bookStatus !== "Borrowed" : stryMutAct_9fa48("36") ? false : stryMutAct_9fa48("35") ? true : (stryCov_9fa48("35", "36", "37"), bookStatus === (stryMutAct_9fa48("38") ? "" : (stryCov_9fa48("38"), "Borrowed")))) {
      if (stryMutAct_9fa48("39")) {
        {}
      } else {
        stryCov_9fa48("39");
        return stryMutAct_9fa48("40") ? "" : (stryCov_9fa48("40"), "Hata: Kitap şu an kütüphanede değil!");
      }
    }
    return stryMutAct_9fa48("41") ? "" : (stryCov_9fa48("41"), "Success");
  }
};
describe(stryMutAct_9fa48("42") ? "" : (stryCov_9fa48("42"), 'Library Management System - ECP, BVA & Decision Table Tests'), () => {
  if (stryMutAct_9fa48("43")) {
    {}
  } else {
    stryCov_9fa48("43");
    // --- BVA (Sınır Değer Analizi) TESTLERİ ---
    test(stryMutAct_9fa48("44") ? "" : (stryCov_9fa48("44"), 'BVA-E1: 1 day (Valid Boundary) should be Success'), () => {
      if (stryMutAct_9fa48("45")) {
        {}
      } else {
        stryCov_9fa48("45");
        expect(validateLoan(1, stryMutAct_9fa48("46") ? false : (stryCov_9fa48("46"), true), stryMutAct_9fa48("47") ? "" : (stryCov_9fa48("47"), "Available"))).toBe(stryMutAct_9fa48("48") ? "" : (stryCov_9fa48("48"), "Success"));
      }
    });
    test(stryMutAct_9fa48("49") ? "" : (stryCov_9fa48("49"), 'BVA-U2: 22 days (Invalid Boundary) should return Error'), () => {
      if (stryMutAct_9fa48("50")) {
        {}
      } else {
        stryCov_9fa48("50");
        expect(validateLoan(22, stryMutAct_9fa48("51") ? false : (stryCov_9fa48("51"), true), stryMutAct_9fa48("52") ? "" : (stryCov_9fa48("52"), "Available"))).toBe(stryMutAct_9fa48("53") ? "" : (stryCov_9fa48("53"), "Loan duration must be between 1 and 21 days!"));
      }
    });

    // --- ECP (Eşdeğerlik Sınıfları) TESTLERİ ---
    test(stryMutAct_9fa48("54") ? "" : (stryCov_9fa48("54"), 'ECP-U3: "Ten" (Non-numeric) should return Numeric Error'), () => {
      if (stryMutAct_9fa48("55")) {
        {}
      } else {
        stryCov_9fa48("55");
        expect(validateLoan(stryMutAct_9fa48("56") ? "" : (stryCov_9fa48("56"), "Ten"), stryMutAct_9fa48("57") ? false : (stryCov_9fa48("57"), true), stryMutAct_9fa48("58") ? "" : (stryCov_9fa48("58"), "Available"))).toBe(stryMutAct_9fa48("59") ? "" : (stryCov_9fa48("59"), "Loan duration must be a numeric value!"));
      }
    });
    test(stryMutAct_9fa48("60") ? "" : (stryCov_9fa48("60"), 'ECP-U2: Empty duration should return Numeric Error'), () => {
      if (stryMutAct_9fa48("61")) {
        {}
      } else {
        stryCov_9fa48("61");
        expect(validateLoan(stryMutAct_9fa48("62") ? "Stryker was here!" : (stryCov_9fa48("62"), ""), stryMutAct_9fa48("63") ? false : (stryCov_9fa48("63"), true), stryMutAct_9fa48("64") ? "" : (stryCov_9fa48("64"), "Available"))).toBe(stryMutAct_9fa48("65") ? "" : (stryCov_9fa48("65"), "Loan duration must be a numeric value!"));
      }
    });

    // --- DECISION TABLE (Karar Tablosu) TESTLERİ ---
    test(stryMutAct_9fa48("66") ? "" : (stryCov_9fa48("66"), 'DT-R1: All conditions met -> Success'), () => {
      if (stryMutAct_9fa48("67")) {
        {}
      } else {
        stryCov_9fa48("67");
        expect(validateLoan(15, stryMutAct_9fa48("68") ? false : (stryCov_9fa48("68"), true), stryMutAct_9fa48("69") ? "" : (stryCov_9fa48("69"), "Available"))).toBe(stryMutAct_9fa48("70") ? "" : (stryCov_9fa48("70"), "Success"));
      }
    });
    test(stryMutAct_9fa48("71") ? "" : (stryCov_9fa48("71"), 'DT-R4: Unauthorized user (isBorrower false) -> Error'), () => {
      if (stryMutAct_9fa48("72")) {
        {}
      } else {
        stryCov_9fa48("72");
        expect(validateLoan(10, stryMutAct_9fa48("73") ? true : (stryCov_9fa48("73"), false), stryMutAct_9fa48("74") ? "" : (stryCov_9fa48("74"), "Available"))).toBe(stryMutAct_9fa48("75") ? "" : (stryCov_9fa48("75"), "Hata: Ödünç alma yetkiniz yok!"));
      }
    });
    test(stryMutAct_9fa48("76") ? "" : (stryCov_9fa48("76"), 'DT-R3: Already borrowed book -> Error'), () => {
      if (stryMutAct_9fa48("77")) {
        {}
      } else {
        stryCov_9fa48("77");
        expect(validateLoan(10, stryMutAct_9fa48("78") ? false : (stryCov_9fa48("78"), true), stryMutAct_9fa48("79") ? "" : (stryCov_9fa48("79"), "Borrowed"))).toBe(stryMutAct_9fa48("80") ? "" : (stryCov_9fa48("80"), "Hata: Kitap şu an kütüphanede değil!"));
      }
    });
  }
});