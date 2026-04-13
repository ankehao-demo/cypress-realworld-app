import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import TransactionAmount from "../components/TransactionAmount";
import {
  TransactionResponseItem,
  TransactionStatus,
  TransactionRequestStatus,
  DefaultPrivacyLevel,
} from "../models";

const theme = createTheme();

const baseTransaction: TransactionResponseItem = {
  id: "tx-001",
  uuid: "uuid-001",
  source: "bank-001",
  amount: 5000,
  description: "Test transaction",
  privacyLevel: DefaultPrivacyLevel.public,
  receiverId: "user-002",
  senderId: "user-001",
  balanceAtCompletion: 10000,
  status: TransactionStatus.complete,
  createdAt: new Date("2024-01-01"),
  modifiedAt: new Date("2024-01-01"),
  likes: [],
  comments: [],
  receiverName: "Jane Doe",
  receiverAvatar: "",
  senderName: "John Doe",
  senderAvatar: "",
};

const renderWithTheme = (transaction: TransactionResponseItem) =>
  render(
    <ThemeProvider theme={theme}>
      <TransactionAmount transaction={transaction} />
    </ThemeProvider>
  );

describe("TransactionAmount", () => {
  describe("payment transactions (no requestStatus)", () => {
    it("renders with a negative sign for payment transactions", () => {
      const paymentTransaction: TransactionResponseItem = {
        ...baseTransaction,
        requestStatus: undefined,
      };

      const { container } = renderWithTheme(paymentTransaction);
      const amountEl = container.querySelector(
        `[data-test="transaction-amount-${paymentTransaction.id}"]`
      );
      expect(amountEl).toBeTruthy();
      expect(amountEl!.textContent).toContain("-");
      expect(amountEl!.textContent).toContain("$50.00");
    });

    it("applies the negative amount CSS class for payments", () => {
      const paymentTransaction: TransactionResponseItem = {
        ...baseTransaction,
        requestStatus: undefined,
      };

      const { container } = renderWithTheme(paymentTransaction);
      const amountEl = container.querySelector(
        `[data-test="transaction-amount-${paymentTransaction.id}"]`
      );
      expect(amountEl).toBeTruthy();
      expect(amountEl!.className).toContain("TransactionAmount-amountNegative");
    });
  });

  describe("request transactions (has requestStatus)", () => {
    it("renders with a positive sign for request transactions", () => {
      const requestTransaction: TransactionResponseItem = {
        ...baseTransaction,
        requestStatus: TransactionRequestStatus.pending,
      };

      const { container } = renderWithTheme(requestTransaction);
      const amountEl = container.querySelector(
        `[data-test="transaction-amount-${requestTransaction.id}"]`
      );
      expect(amountEl).toBeTruthy();
      expect(amountEl!.textContent).toContain("+");
      expect(amountEl!.textContent).toContain("$50.00");
    });

    it("applies the positive amount CSS class for requests", () => {
      const requestTransaction: TransactionResponseItem = {
        ...baseTransaction,
        requestStatus: TransactionRequestStatus.pending,
      };

      const { container } = renderWithTheme(requestTransaction);
      const amountEl = container.querySelector(
        `[data-test="transaction-amount-${requestTransaction.id}"]`
      );
      expect(amountEl).toBeTruthy();
      expect(amountEl!.className).toContain("TransactionAmount-amountPositive");
    });

    it("renders correctly for accepted request transactions", () => {
      const acceptedRequest: TransactionResponseItem = {
        ...baseTransaction,
        requestStatus: TransactionRequestStatus.accepted,
      };

      const { container } = renderWithTheme(acceptedRequest);
      const amountEl = container.querySelector(
        `[data-test="transaction-amount-${acceptedRequest.id}"]`
      );
      expect(amountEl).toBeTruthy();
      expect(amountEl!.textContent).toContain("+");
      expect(amountEl!.className).toContain("TransactionAmount-amountPositive");
    });

    it("renders correctly for rejected request transactions", () => {
      const rejectedRequest: TransactionResponseItem = {
        ...baseTransaction,
        requestStatus: TransactionRequestStatus.rejected,
      };

      const { container } = renderWithTheme(rejectedRequest);
      const amountEl = container.querySelector(
        `[data-test="transaction-amount-${rejectedRequest.id}"]`
      );
      expect(amountEl).toBeTruthy();
      expect(amountEl!.textContent).toContain("+");
      expect(amountEl!.className).toContain("TransactionAmount-amountPositive");
    });
  });

  describe("amount formatting", () => {
    it("formats small amounts correctly", () => {
      const transaction: TransactionResponseItem = {
        ...baseTransaction,
        amount: 100,
        requestStatus: undefined,
      };

      const { container } = renderWithTheme(transaction);
      const amountEl = container.querySelector(
        `[data-test="transaction-amount-${transaction.id}"]`
      );
      expect(amountEl!.textContent).toContain("-");
      expect(amountEl!.textContent).toContain("$1.00");
    });

    it("formats large amounts correctly", () => {
      const transaction: TransactionResponseItem = {
        ...baseTransaction,
        amount: 999999,
        requestStatus: undefined,
      };

      const { container } = renderWithTheme(transaction);
      const amountEl = container.querySelector(
        `[data-test="transaction-amount-${transaction.id}"]`
      );
      expect(amountEl!.textContent).toContain("-");
      expect(amountEl!.textContent).toContain("$9,999.99");
    });

    it("formats zero amounts correctly", () => {
      const transaction: TransactionResponseItem = {
        ...baseTransaction,
        amount: 0,
        requestStatus: undefined,
      };

      const { container } = renderWithTheme(transaction);
      const amountEl = container.querySelector(
        `[data-test="transaction-amount-${transaction.id}"]`
      );
      // When amount is 0/falsy, formatAmount is not called due to short-circuit
      expect(amountEl!.textContent).toContain("-");
    });
  });

  describe("data-test attribute", () => {
    it("includes the transaction id in the data-test attribute", () => {
      const transaction: TransactionResponseItem = {
        ...baseTransaction,
        id: "unique-tx-id-123",
      };

      const { container } = renderWithTheme(transaction);
      const amountEl = container.querySelector(
        '[data-test="transaction-amount-unique-tx-id-123"]'
      );
      expect(amountEl).toBeTruthy();
    });
  });
});
