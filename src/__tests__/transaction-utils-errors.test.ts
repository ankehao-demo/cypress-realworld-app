import { describe, expect, it, beforeEach } from "vitest";
import {
  hasSufficientFunds,
  getChargeAmount,
  getPayAppCreditedAmount,
  isRequestTransaction,
  isPayment,
  formatFullName,
  hasDateQueryFields,
  hasAmountQueryFields,
  getQueryWithoutFilterFields,
  getPaginatedItems,
  isoStringToLocalMidnightStart,
  isoStringToLocalMidnightEnd,
  isoStringToLocalDateFull,
  localDateToIsoString,
  localDateToUTCISOString,
} from "../utils/transactionUtils";
import { User, Transaction, TransactionStatus, DefaultPrivacyLevel } from "../models";
import { seedDatabase, getAllUsers, getTransactionsByUserId } from "../../backend/database";

describe("Transaction Utility Error Handling", () => {
  beforeEach(() => {
    seedDatabase();
  });

  describe("hasSufficientFunds", () => {
    it("should return false when user has insufficient balance", () => {
      const user: User = {
        ...getAllUsers()[0],
        balance: 100,
      };

      const transaction: Transaction = {
        id: "test-id",
        uuid: "test-uuid",
        source: "test-source",
        amount: 10000,
        description: "Test transaction",
        receiverId: "receiver-id",
        senderId: user.id,
        privacyLevel: DefaultPrivacyLevel.public,
        status: TransactionStatus.pending,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };

      expect(hasSufficientFunds(user, transaction)).toBe(false);
    });

    it("should return true when user has sufficient balance", () => {
      const user: User = {
        ...getAllUsers()[0],
        balance: 100000,
      };

      const transaction: Transaction = {
        id: "test-id",
        uuid: "test-uuid",
        source: "test-source",
        amount: 10000,
        description: "Test transaction",
        receiverId: "receiver-id",
        senderId: user.id,
        privacyLevel: DefaultPrivacyLevel.public,
        status: TransactionStatus.pending,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };

      expect(hasSufficientFunds(user, transaction)).toBe(true);
    });

    it("should handle zero balance", () => {
      const user: User = {
        ...getAllUsers()[0],
        balance: 0,
      };

      const transaction: Transaction = {
        id: "test-id",
        uuid: "test-uuid",
        source: "test-source",
        amount: 100,
        description: "Test transaction",
        receiverId: "receiver-id",
        senderId: user.id,
        privacyLevel: DefaultPrivacyLevel.public,
        status: TransactionStatus.pending,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };

      expect(hasSufficientFunds(user, transaction)).toBe(false);
    });

    it("should handle negative balance", () => {
      const user: User = {
        ...getAllUsers()[0],
        balance: -1000,
      };

      const transaction: Transaction = {
        id: "test-id",
        uuid: "test-uuid",
        source: "test-source",
        amount: 100,
        description: "Test transaction",
        receiverId: "receiver-id",
        senderId: user.id,
        privacyLevel: DefaultPrivacyLevel.public,
        status: TransactionStatus.pending,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };

      expect(hasSufficientFunds(user, transaction)).toBe(false);
    });
  });

  describe("getChargeAmount", () => {
    it("should calculate correct charge amount when balance is sufficient", () => {
      const user: User = {
        ...getAllUsers()[0],
        balance: 100000,
      };

      const transaction: Transaction = {
        id: "test-id",
        uuid: "test-uuid",
        source: "test-source",
        amount: 10000,
        description: "Test transaction",
        receiverId: "receiver-id",
        senderId: user.id,
        privacyLevel: DefaultPrivacyLevel.public,
        status: TransactionStatus.pending,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };

      const chargeAmount = getChargeAmount(user, transaction);
      expect(chargeAmount).toBe(90000);
    });

    it("should handle zero transaction amount", () => {
      const user: User = {
        ...getAllUsers()[0],
        balance: 100000,
      };

      const transaction: Transaction = {
        id: "test-id",
        uuid: "test-uuid",
        source: "test-source",
        amount: 0,
        description: "Test transaction",
        receiverId: "receiver-id",
        senderId: user.id,
        privacyLevel: DefaultPrivacyLevel.public,
        status: TransactionStatus.pending,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };

      const chargeAmount = getChargeAmount(user, transaction);
      expect(chargeAmount).toBe(100000);
    });
  });

  describe("getPayAppCreditedAmount", () => {
    it("should calculate correct credited amount", () => {
      const user: User = {
        ...getAllUsers()[0],
        balance: 50000,
      };

      const transaction: Transaction = {
        id: "test-id",
        uuid: "test-uuid",
        source: "test-source",
        amount: 10000,
        description: "Test transaction",
        receiverId: user.id,
        senderId: "sender-id",
        privacyLevel: DefaultPrivacyLevel.public,
        status: TransactionStatus.pending,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };

      const creditedAmount = getPayAppCreditedAmount(user, transaction);
      expect(creditedAmount).toBe(60000);
    });

    it("should handle zero balance", () => {
      const user: User = {
        ...getAllUsers()[0],
        balance: 0,
      };

      const transaction: Transaction = {
        id: "test-id",
        uuid: "test-uuid",
        source: "test-source",
        amount: 10000,
        description: "Test transaction",
        receiverId: user.id,
        senderId: "sender-id",
        privacyLevel: DefaultPrivacyLevel.public,
        status: TransactionStatus.pending,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };

      const creditedAmount = getPayAppCreditedAmount(user, transaction);
      expect(creditedAmount).toBe(10000);
    });
  });

  describe("isRequestTransaction", () => {
    it("should return false for payment transactions", () => {
      const transaction: Transaction = {
        id: "test-id",
        uuid: "test-uuid",
        source: "test-source",
        amount: 10000,
        description: "Test payment",
        receiverId: "receiver-id",
        senderId: "sender-id",
        privacyLevel: DefaultPrivacyLevel.public,
        status: TransactionStatus.complete,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };

      expect(isRequestTransaction(transaction)).toBe(false);
    });

    it("should return true for request transactions", () => {
      const transaction: Transaction = {
        id: "test-id",
        uuid: "test-uuid",
        source: "test-source",
        amount: 10000,
        description: "Test request",
        receiverId: "receiver-id",
        senderId: "sender-id",
        privacyLevel: DefaultPrivacyLevel.public,
        status: TransactionStatus.pending,
        requestStatus: "pending",
        createdAt: new Date(),
        modifiedAt: new Date(),
      };

      expect(isRequestTransaction(transaction)).toBe(true);
    });
  });

  describe("isPayment", () => {
    it("should return true for payment transactions", () => {
      const transaction: Transaction = {
        id: "test-id",
        uuid: "test-uuid",
        source: "test-source",
        amount: 10000,
        description: "Test payment",
        receiverId: "receiver-id",
        senderId: "sender-id",
        privacyLevel: DefaultPrivacyLevel.public,
        status: TransactionStatus.complete,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };

      expect(isPayment(transaction)).toBe(true);
    });

    it("should return false for request transactions", () => {
      const transaction: Transaction = {
        id: "test-id",
        uuid: "test-uuid",
        source: "test-source",
        amount: 10000,
        description: "Test request",
        receiverId: "receiver-id",
        senderId: "sender-id",
        privacyLevel: DefaultPrivacyLevel.public,
        status: TransactionStatus.pending,
        requestStatus: "pending",
        createdAt: new Date(),
        modifiedAt: new Date(),
      };

      expect(isPayment(transaction)).toBe(false);
    });
  });

  describe("formatFullName", () => {
    it("should format full name correctly", () => {
      const user: User = getAllUsers()[0];
      const fullName = formatFullName(user);
      expect(fullName).toBe(`${user.firstName} ${user.lastName}`);
    });

    it("should handle empty first name", () => {
      const user: User = {
        ...getAllUsers()[0],
        firstName: "",
      };
      const fullName = formatFullName(user);
      expect(fullName).toBe(` ${user.lastName}`);
    });

    it("should handle empty last name", () => {
      const user: User = {
        ...getAllUsers()[0],
        lastName: "",
      };
      const fullName = formatFullName(user);
      expect(fullName).toBe(`${user.firstName} `);
    });

    it("should handle both names empty", () => {
      const user: User = {
        ...getAllUsers()[0],
        firstName: "",
        lastName: "",
      };
      const fullName = formatFullName(user);
      expect(fullName).toBe(" ");
    });
  });

  describe("hasDateQueryFields", () => {
    it("should return true when both date fields are present", () => {
      const query = {
        dateRangeStart: new Date("2023-01-01"),
        dateRangeEnd: new Date("2023-12-31"),
      };
      expect(hasDateQueryFields(query)).toBe(true);
    });

    it("should return false when only start date is present", () => {
      const query = {
        dateRangeStart: new Date("2023-01-01"),
      };
      expect(hasDateQueryFields(query as any)).toBe(false);
    });

    it("should return false when only end date is present", () => {
      const query = {
        dateRangeEnd: new Date("2023-12-31"),
      };
      expect(hasDateQueryFields(query as any)).toBe(false);
    });

    it("should return false when neither date field is present", () => {
      const query = {};
      expect(hasDateQueryFields(query)).toBe(false);
    });
  });

  describe("hasAmountQueryFields", () => {
    it("should return true when both amount fields are present", () => {
      const query = {
        amountMin: 100,
        amountMax: 1000,
      };
      expect(hasAmountQueryFields(query)).toBe(true);
    });

    it("should return false when only min amount is present", () => {
      const query = {
        amountMin: 100,
      };
      expect(hasAmountQueryFields(query as any)).toBe(false);
    });

    it("should return false when only max amount is present", () => {
      const query = {
        amountMax: 1000,
      };
      expect(hasAmountQueryFields(query as any)).toBe(false);
    });

    it("should return false when neither amount field is present", () => {
      const query = {};
      expect(hasAmountQueryFields(query)).toBe(false);
    });
  });

  describe("getQueryWithoutFilterFields", () => {
    it("should remove date, amount, and pagination fields", () => {
      const query = {
        dateRangeStart: new Date("2023-01-01"),
        dateRangeEnd: new Date("2023-12-31"),
        amountMin: 100,
        amountMax: 1000,
        page: 1,
        limit: 10,
        status: "complete",
      };
      const result = getQueryWithoutFilterFields(query);
      expect(result).toEqual({ status: "complete" });
    });

    it("should handle empty query", () => {
      const query = {};
      const result = getQueryWithoutFilterFields(query);
      expect(result).toEqual({});
    });
  });

  describe("getPaginatedItems", () => {
    it("should paginate items correctly", () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = getPaginatedItems(1, 3, items);
      expect(result.data).toEqual([1, 2, 3]);
      expect(result.totalPages).toBe(4);
    });

    it("should handle page 2", () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = getPaginatedItems(2, 3, items);
      expect(result.data).toEqual([4, 5, 6]);
      expect(result.totalPages).toBe(4);
    });

    it("should handle last page with fewer items", () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = getPaginatedItems(4, 3, items);
      expect(result.data).toEqual([10]);
      expect(result.totalPages).toBe(4);
    });

    it("should handle empty items array", () => {
      const items: any[] = [];
      const result = getPaginatedItems(1, 10, items);
      expect(result.data).toEqual([]);
      expect(result.totalPages).toBe(0);
    });

    it("should handle page beyond total pages", () => {
      const items = [1, 2, 3];
      const result = getPaginatedItems(5, 10, items);
      expect(result.data).toEqual([]);
      expect(result.totalPages).toBe(1);
    });

    it("should handle zero limit", () => {
      const items = [1, 2, 3, 4, 5];
      const result = getPaginatedItems(1, 0, items);
      expect(result.data).toEqual([]);
      expect(result.totalPages).toBe(Infinity);
    });
  });

  describe("date conversion utilities", () => {
    describe("isoStringToLocalMidnightStart", () => {
      it("should convert ISO string to local midnight start", () => {
        const isoString = "2023-06-15T14:30:00.000Z";
        const result = isoStringToLocalMidnightStart(isoString);
        expect(result.getHours()).toBe(0);
        expect(result.getMinutes()).toBe(0);
        expect(result.getSeconds()).toBe(0);
        expect(result.getMilliseconds()).toBe(0);
      });

      it("should handle invalid ISO string", () => {
        const isoString = "invalid-date";
        expect(() => isoStringToLocalMidnightStart(isoString)).toThrow();
      });
    });

    describe("isoStringToLocalMidnightEnd", () => {
      it("should convert ISO string to local midnight end", () => {
        const isoString = "2023-06-15T14:30:00.000Z";
        const result = isoStringToLocalMidnightEnd(isoString);
        expect(result.getHours()).toBe(23);
        expect(result.getMinutes()).toBe(59);
        expect(result.getSeconds()).toBe(59);
        expect(result.getMilliseconds()).toBe(999);
      });

      it("should handle invalid ISO string", () => {
        const isoString = "invalid-date";
        expect(() => isoStringToLocalMidnightEnd(isoString)).toThrow();
      });
    });

    describe("isoStringToLocalDateFull", () => {
      it("should convert ISO string to local date with full time", () => {
        const isoString = "2023-06-15T14:30:45.123Z";
        const result = isoStringToLocalDateFull(isoString);
        expect(result).toBeInstanceOf(Date);
      });

      it("should handle invalid ISO string", () => {
        const isoString = "invalid-date";
        expect(() => isoStringToLocalDateFull(isoString)).toThrow();
      });
    });

    describe("localDateToIsoString", () => {
      it("should convert local date to ISO string", () => {
        const date = new Date("2023-06-15T14:30:00.000Z");
        const result = localDateToIsoString(date);
        expect(result).toContain("2023");
        expect(result).toContain("T");
        expect(result).toContain("Z");
      });
    });

    describe("localDateToUTCISOString", () => {
      it("should convert local date to UTC ISO string", () => {
        const date = new Date(2023, 5, 15, 14, 30, 0, 0);
        const result = localDateToUTCISOString(date);
        expect(result).toContain("2023");
        expect(result).toContain("T");
        expect(result).toContain("Z");
      });

      it("should handle null input", () => {
        const result = localDateToUTCISOString(null);
        expect(result).toContain("T");
        expect(result).toContain("Z");
      });

      it("should handle undefined input", () => {
        const result = localDateToUTCISOString(undefined);
        expect(result).toContain("T");
        expect(result).toContain("Z");
      });
    });
  });
});
