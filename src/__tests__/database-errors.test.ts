import { describe, expect, it, beforeEach } from "vitest";
import {
  seedDatabase,
  getUserById,
  getTransactionById,
  getBankAccountById,
  getContactBy,
  getNotificationById,
  updateUserById,
  updateTransactionById,
  createTransaction,
  createBankAccountForUser,
  createContactForUser,
  getAllUsers,
  getBankAccountsByUserId,
} from "../../backend/database";
import { User, TransactionPayload, TransactionStatus, DefaultPrivacyLevel } from "../models";
import { getFakeAmount } from "../utils/transactionUtils";

describe("Database Error Handling", () => {
  beforeEach(() => {
    seedDatabase();
  });

  describe("getUserById", () => {
    it("should return undefined for non-existent user ID", () => {
      const result = getUserById("non-existent-id");
      expect(result).toBeUndefined();
    });

    it("should return undefined for empty string ID", () => {
      const result = getUserById("");
      expect(result).toBeUndefined();
    });

    it("should return undefined for null ID", () => {
      const result = getUserById(null as any);
      expect(result).toBeUndefined();
    });
  });

  describe("getTransactionById", () => {
    it("should return undefined for non-existent transaction ID", () => {
      const result = getTransactionById("non-existent-transaction-id");
      expect(result).toBeUndefined();
    });

    it("should return undefined for empty string ID", () => {
      const result = getTransactionById("");
      expect(result).toBeUndefined();
    });
  });

  describe("getBankAccountById", () => {
    it("should return undefined for non-existent bank account ID", () => {
      const result = getBankAccountById("non-existent-account-id");
      expect(result).toBeUndefined();
    });

    it("should return undefined for empty string ID", () => {
      const result = getBankAccountById("");
      expect(result).toBeUndefined();
    });
  });

  describe("getContactBy", () => {
    it("should return undefined for non-existent contact ID", () => {
      const result = getContactBy("id", "non-existent-contact-id");
      expect(result).toBeUndefined();
    });
  });

  describe("getNotificationById", () => {
    it("should return undefined for non-existent notification ID", () => {
      const result = getNotificationById("non-existent-notification-id");
      expect(result).toBeUndefined();
    });
  });

  describe("updateUserById", () => {
    it("should handle updates to non-existent user gracefully", () => {
      expect(() => {
        updateUserById("non-existent-user-id", { firstName: "Test" });
      }).not.toThrow();
    });

    it("should handle empty edits object", () => {
      const user: User = getAllUsers()[0];
      const originalFirstName = user.firstName;

      updateUserById(user.id, {});

      const updatedUser = getUserById(user.id);
      expect(updatedUser.firstName).toBe(originalFirstName);
    });
  });

  describe("updateTransactionById", () => {
    it("should throw error when updating non-existent transaction", () => {
      expect(() => {
        updateTransactionById("non-existent-transaction-id", {
          status: TransactionStatus.complete,
        });
      }).toThrow();
    });
  });

  describe("createTransaction with invalid data", () => {
    it("should handle transaction creation with non-existent sender", () => {
      const receiver: User = getAllUsers()[0];
      const receiverBankAccount = getBankAccountsByUserId(receiver.id)[0];

      const transactionDetails: TransactionPayload = {
        source: receiverBankAccount.id!,
        senderId: "non-existent-sender-id",
        receiverId: receiver.id,
        description: "Test payment",
        amount: getFakeAmount(),
        privacyLevel: DefaultPrivacyLevel.public,
        status: TransactionStatus.pending,
      };

      expect(() => {
        createTransaction("non-existent-sender-id", "payment", transactionDetails);
      }).toThrow();
    });

    it("should handle transaction creation with non-existent receiver", () => {
      const sender: User = getAllUsers()[0];
      const senderBankAccount = getBankAccountsByUserId(sender.id)[0];

      const transactionDetails: TransactionPayload = {
        source: senderBankAccount.id!,
        senderId: sender.id,
        receiverId: "non-existent-receiver-id",
        description: "Test payment",
        amount: getFakeAmount(),
        privacyLevel: DefaultPrivacyLevel.public,
        status: TransactionStatus.pending,
      };

      expect(() => {
        createTransaction(sender.id, "payment", transactionDetails);
      }).toThrow();
    });

    it("should handle transaction with zero amount", () => {
      const sender: User = getAllUsers()[0];
      const receiver: User = getAllUsers()[1];
      const senderBankAccount = getBankAccountsByUserId(sender.id)[0];

      const transactionDetails: TransactionPayload = {
        source: senderBankAccount.id!,
        senderId: sender.id,
        receiverId: receiver.id,
        description: "Zero amount transaction",
        amount: 0,
        privacyLevel: DefaultPrivacyLevel.public,
        status: TransactionStatus.pending,
      };

      const result = createTransaction(sender.id, "payment", transactionDetails);
      expect(result.amount).toBe(0);
    });

    it("should handle transaction with negative amount", () => {
      const sender: User = getAllUsers()[0];
      const receiver: User = getAllUsers()[1];
      const senderBankAccount = getBankAccountsByUserId(sender.id)[0];

      const transactionDetails: TransactionPayload = {
        source: senderBankAccount.id!,
        senderId: sender.id,
        receiverId: receiver.id,
        description: "Negative amount transaction",
        amount: -100,
        privacyLevel: DefaultPrivacyLevel.public,
        status: TransactionStatus.pending,
      };

      const result = createTransaction(sender.id, "payment", transactionDetails);
      expect(result.amount).toBe(-10000);
    });
  });

  describe("createBankAccountForUser with invalid data", () => {
    it("should handle bank account creation with non-existent user", () => {
      expect(() => {
        createBankAccountForUser("non-existent-user-id", {
          bankName: "Test Bank",
          accountNumber: "1234567890",
          routingNumber: "123456789",
        });
      }).not.toThrow();
    });

    it("should handle bank account creation with empty strings", () => {
      const user: User = getAllUsers()[0];

      const result = createBankAccountForUser(user.id, {
        bankName: "",
        accountNumber: "",
        routingNumber: "",
      });

      expect(result.bankName).toBe("");
      expect(result.accountNumber).toBe("");
      expect(result.routingNumber).toBe("");
    });
  });

  describe("createContactForUser with invalid data", () => {
    it("should handle contact creation with non-existent user", () => {
      const contactUser: User = getAllUsers()[0];

      expect(() => {
        createContactForUser("non-existent-user-id", contactUser.id);
      }).not.toThrow();
    });

    it("should handle contact creation with non-existent contact user", () => {
      const user: User = getAllUsers()[0];

      expect(() => {
        createContactForUser(user.id, "non-existent-contact-user-id");
      }).not.toThrow();
    });

    it("should allow creating duplicate contacts", () => {
      const user: User = getAllUsers()[0];
      const contactUser: User = getAllUsers()[1];

      const contact1 = createContactForUser(user.id, contactUser.id);
      const contact2 = createContactForUser(user.id, contactUser.id);

      expect(contact1.id).not.toBe(contact2.id);
      expect(contact1.contactUserId).toBe(contact2.contactUserId);
    });
  });
});
