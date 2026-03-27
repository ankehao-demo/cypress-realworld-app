import { describe, expect, test } from "vitest";
import {
  isRequestTransaction,
  isPayment,
  getFakeAmount,
  currentUserLikesTransaction,
  getQueryWithoutDateFields,
  getQueryWithoutAmountFields,
  getQueryWithoutFilterFields,
  getTransferAmount,
  hasSufficientFunds,
  hasDateQueryFields,
  getDateQueryFields,
  hasAmountQueryFields,
  startOfDayUTC,
  endOfDayUTC,
} from "../transactionUtils";
import { faker } from "@faker-js/faker";
import {
  Transaction,
  TransactionRequestStatus,
  DefaultPrivacyLevel,
  TransactionStatus,
  TransactionResponseItem,
} from "../../models";
import shortid from "shortid";

const fakeTransaction = (
  requestStatus?: TransactionRequestStatus,
  createdAt?: Date
): Transaction => ({
  id: shortid(),
  uuid: faker.datatype.uuid(),
  source: shortid(),
  amount: getFakeAmount(),
  description: "food",
  privacyLevel: DefaultPrivacyLevel.public,
  receiverId: shortid(),
  senderId: shortid(),
  balanceAtCompletion: getFakeAmount(),
  status: TransactionStatus.pending,
  requestStatus,
  requestResolvedAt: faker.date.future(),
  createdAt: faker.date.past(),
  modifiedAt: createdAt || faker.date.recent(),
});

const createTestUser = (balance: number) => ({
  id: shortid(),
  uuid: faker.datatype.uuid(),
  firstName: "Test",
  lastName: "User",
  username: "testuser",
  password: "password",
  email: "test@example.com",
  phoneNumber: "555-1234",
  avatar: "/avatar.png",
  defaultPrivacyLevel: DefaultPrivacyLevel.public,
  balance,
  createdAt: new Date(),
  modifiedAt: new Date(),
});

const createTestTransaction = (amount: number): Transaction => ({
  id: shortid(),
  uuid: faker.datatype.uuid(),
  source: shortid(),
  amount,
  description: "Test payment",
  privacyLevel: DefaultPrivacyLevel.public,
  receiverId: shortid(),
  senderId: shortid(),
  status: TransactionStatus.pending,
  createdAt: new Date(),
  modifiedAt: new Date(),
});

describe("Transaction Utils", () => {
  describe("isRequestTransaction", () => {
    let transaction;

    test("validates that a transaction is a request", () => {
      for (let s in TransactionRequestStatus) {
        transaction = fakeTransaction(s as TransactionRequestStatus);
        expect(isRequestTransaction(transaction)).toBeTruthy();
      }
    });

    test("validates that a transaction is not a request", () => {
      transaction = fakeTransaction();
      expect(isRequestTransaction(transaction)).toBe(false);
    });

    test("checks if the current user likes a transaction", () => {
      const transactionBase = fakeTransaction();

      const currentUser = {
        id: "9IUK0xpw",
        uuid: faker.datatype.uuid(),
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        username: faker.internet.userName(),
        password: "abc123",
        email: faker.internet.email(),
        phoneNumber: faker.phone.phoneNumber(),
        avatar: faker.internet.avatar(),
        defaultPrivacyLevel: DefaultPrivacyLevel.public,
        balance: faker.datatype.number(),
        createdAt: faker.date.past(),
        modifiedAt: faker.date.recent(),
      };

      const transactionWithLikes: TransactionResponseItem = {
        ...transactionBase,
        receiverName: "Receiver Name",
        receiverAvatar: "/path/to/receiver/avatar.png",
        senderAvatar: "/path/to/sender/avatar.png",
        senderName: "Sender Name",
        likes: [
          {
            id: "ExVksKSH",
            uuid: "c849329f-42f7-4ff5-a792-e01c9cec05b5",
            userId: "9IUK0xpw",
            transactionId: "dKAI-6Ua",
            createdAt: new Date(),
            modifiedAt: new Date(),
          },
        ],
        comments: [],
      };

      expect(currentUserLikesTransaction(currentUser, transactionWithLikes)).toBe(true);

      const otherCurrentUser = {
        ...currentUser,
        id: "ABC123",
      };

      expect(currentUserLikesTransaction(otherCurrentUser, transactionWithLikes)).toBe(false);
    });
  });

  test("gets query with and without date range fields", () => {
    expect(
      getQueryWithoutDateFields({
        dateRangeStart: new Date().toString(),
        dateRangeEnd: new Date().toString(),
        status: TransactionStatus.incomplete,
      })
    ).toMatchObject({ status: "incomplete" });
    expect(
      getQueryWithoutDateFields({
        status: TransactionStatus.incomplete,
      })
    ).toMatchObject({ status: "incomplete" });
  });

  test("gets query with and without amount range fields", () => {
    expect(
      getQueryWithoutAmountFields({
        amountMin: 5,
        amountMax: 10,
        status: TransactionStatus.incomplete,
      })
    ).toMatchObject({ status: "incomplete" });
    expect(
      getQueryWithoutAmountFields({
        status: TransactionStatus.incomplete,
      })
    ).toMatchObject({ status: "incomplete" });
  });

  test("gets query with and without date and amount range fields", () => {
    const query = {
      amountMin: 5,
      amountMax: 10,
      requestStatus: "pending",
      dateRangeStart: "2019-12-01T06:00:00.000Z",
      dateRangeEnd: "2019-12-05T06:00:00.000Z",
    };
    expect(getQueryWithoutFilterFields(query)).toMatchObject({
      requestStatus: "pending",
    });
    expect(
      getQueryWithoutFilterFields({
        status: TransactionStatus.incomplete,
      })
    ).toMatchObject({ status: "incomplete" });
  });

  describe("Date Utilities", () => {
    describe("startOfDayUTC", () => {
      test("converts a date to start of day in UTC", () => {
        const date = new Date(2024, 5, 15, 14, 30, 45, 500);
        const result = startOfDayUTC(date);

        expect(result.getUTCHours()).toBe(0);
        expect(result.getUTCMinutes()).toBe(0);
        expect(result.getUTCSeconds()).toBe(0);
        expect(result.getUTCMilliseconds()).toBe(0);
        expect(result.getUTCFullYear()).toBe(2024);
        expect(result.getUTCMonth()).toBe(5);
        expect(result.getUTCDate()).toBe(15);
      });

      test("handles date at midnight", () => {
        const date = new Date(2024, 0, 1, 0, 0, 0, 0);
        const result = startOfDayUTC(date);

        expect(result.getUTCHours()).toBe(0);
        expect(result.getUTCMinutes()).toBe(0);
        expect(result.getUTCSeconds()).toBe(0);
        expect(result.getUTCMilliseconds()).toBe(0);
      });

      test("handles invalid input by using current date", () => {
        const result = startOfDayUTC("not a date" as unknown as Date);

        expect(result.getUTCHours()).toBe(0);
        expect(result.getUTCMinutes()).toBe(0);
        expect(result.getUTCSeconds()).toBe(0);
        expect(result.getUTCMilliseconds()).toBe(0);
      });
    });

    describe("endOfDayUTC", () => {
      test("converts a date to end of day in UTC", () => {
        const date = new Date(2024, 5, 15, 14, 30, 45, 500);
        const result = endOfDayUTC(date);

        expect(result.getUTCHours()).toBe(23);
        expect(result.getUTCMinutes()).toBe(59);
        expect(result.getUTCSeconds()).toBe(59);
        expect(result.getUTCMilliseconds()).toBe(999);
        expect(result.getUTCFullYear()).toBe(2024);
        expect(result.getUTCMonth()).toBe(5);
        expect(result.getUTCDate()).toBe(15);
      });

      test("handles date at midnight", () => {
        const date = new Date(2024, 0, 1, 0, 0, 0, 0);
        const result = endOfDayUTC(date);

        expect(result.getUTCHours()).toBe(23);
        expect(result.getUTCMinutes()).toBe(59);
        expect(result.getUTCSeconds()).toBe(59);
        expect(result.getUTCMilliseconds()).toBe(999);
      });

      test("handles invalid input by using current date", () => {
        const result = endOfDayUTC("not a date" as unknown as Date);

        expect(result.getUTCHours()).toBe(23);
        expect(result.getUTCMinutes()).toBe(59);
        expect(result.getUTCSeconds()).toBe(59);
        expect(result.getUTCMilliseconds()).toBe(999);
      });
    });
  });

  describe("Transaction Validation Functions", () => {
    describe("isPayment", () => {
      test("returns true for a payment transaction (no requestStatus)", () => {
        const transaction = fakeTransaction();
        expect(isPayment(transaction)).toBe(true);
      });

      test("returns false for a request transaction", () => {
        const transaction = fakeTransaction(TransactionRequestStatus.pending);
        expect(isPayment(transaction)).toBe(false);
      });

      test("returns false for all request statuses", () => {
        for (const status in TransactionRequestStatus) {
          const transaction = fakeTransaction(status as TransactionRequestStatus);
          expect(isPayment(transaction)).toBe(false);
        }
      });
    });

    describe("getTransferAmount", () => {
      test("calculates the transfer amount correctly", () => {
        const sender = createTestUser(10000);
        const transaction = createTestTransaction(3000);
        const result = getTransferAmount(sender, transaction);
        expect(result).toBe(7000);
      });

      test("returns absolute value when balance is less than amount", () => {
        const sender = createTestUser(1000);
        const transaction = createTestTransaction(5000);
        const result = getTransferAmount(sender, transaction);
        expect(result).toBe(4000);
      });
    });

    describe("hasSufficientFunds", () => {
      test("returns true when sender has sufficient funds", () => {
        const sender = createTestUser(10000);
        const transaction = createTestTransaction(5000);
        expect(hasSufficientFunds(sender, transaction)).toBe(true);
      });

      test("returns false when sender has insufficient funds", () => {
        const sender = createTestUser(1000);
        const transaction = createTestTransaction(5000);
        expect(hasSufficientFunds(sender, transaction)).toBe(false);
      });

      test("returns true when balance equals amount (zero remaining is considered sufficient)", () => {
        const sender = createTestUser(5000);
        const transaction = createTestTransaction(5000);
        expect(hasSufficientFunds(sender, transaction)).toBe(true);
      });
    });
  });

  describe("Query Filtering Functions", () => {
    describe("hasDateQueryFields", () => {
      test("returns true when query has both date range fields", () => {
        const query = {
          dateRangeStart: "2024-01-01T00:00:00.000Z",
          dateRangeEnd: "2024-01-31T23:59:59.999Z",
        };
        expect(hasDateQueryFields(query)).toBe(true);
      });

      test("returns false when query has only dateRangeStart", () => {
        const query = {
          dateRangeStart: "2024-01-01T00:00:00.000Z",
        };
        expect(hasDateQueryFields(query)).toBe(false);
      });

      test("returns false when query has only dateRangeEnd", () => {
        const query = {
          dateRangeEnd: "2024-01-31T23:59:59.999Z",
        };
        expect(hasDateQueryFields(query)).toBe(false);
      });

      test("returns false when query has no date fields", () => {
        const query = {
          status: TransactionStatus.pending,
        };
        expect(hasDateQueryFields(query)).toBe(false);
      });

      test("returns true when query has date fields along with other fields", () => {
        const query = {
          dateRangeStart: "2024-01-01T00:00:00.000Z",
          dateRangeEnd: "2024-01-31T23:59:59.999Z",
          status: TransactionStatus.pending,
          amountMin: 100,
        };
        expect(hasDateQueryFields(query)).toBe(true);
      });
    });

    describe("getDateQueryFields", () => {
      test("extracts date fields from query", () => {
        const query = {
          dateRangeStart: "2024-01-01T00:00:00.000Z",
          dateRangeEnd: "2024-01-31T23:59:59.999Z",
          status: TransactionStatus.pending,
          amountMin: 100,
        };
        const result = getDateQueryFields(query);
        expect(result).toEqual({
          dateRangeStart: "2024-01-01T00:00:00.000Z",
          dateRangeEnd: "2024-01-31T23:59:59.999Z",
        });
      });

      test("returns only existing date fields", () => {
        const query = {
          dateRangeStart: "2024-01-01T00:00:00.000Z",
        };
        const result = getDateQueryFields(query);
        expect(result).toEqual({
          dateRangeStart: "2024-01-01T00:00:00.000Z",
        });
      });

      test("returns empty object when no date fields exist", () => {
        const query = {
          status: TransactionStatus.pending,
        };
        const result = getDateQueryFields(query as any);
        expect(result).toEqual({});
      });
    });

    describe("hasAmountQueryFields", () => {
      test("returns true when query has both amount range fields", () => {
        const query = {
          amountMin: 100,
          amountMax: 1000,
        };
        expect(hasAmountQueryFields(query)).toBe(true);
      });

      test("returns false when query has only amountMin", () => {
        const query = {
          amountMin: 100,
        };
        expect(hasAmountQueryFields(query)).toBe(false);
      });

      test("returns false when query has only amountMax", () => {
        const query = {
          amountMax: 1000,
        };
        expect(hasAmountQueryFields(query)).toBe(false);
      });

      test("returns false when query has no amount fields", () => {
        const query = {
          status: TransactionStatus.pending,
        };
        expect(hasAmountQueryFields(query)).toBe(false);
      });

      test("returns true when query has amount fields along with other fields", () => {
        const query = {
          amountMin: 100,
          amountMax: 1000,
          status: TransactionStatus.pending,
          dateRangeStart: "2024-01-01T00:00:00.000Z",
        };
        expect(hasAmountQueryFields(query)).toBe(true);
      });
    });
  });
});
