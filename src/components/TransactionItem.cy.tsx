import React from "react";
import { MemoryRouter } from "react-router-dom";
import TransactionItem from "./TransactionItem";
import { TransactionResponseItem, TransactionStatus, DefaultPrivacyLevel } from "../models";

describe("TransactionItem", () => {
  const paymentTransaction: TransactionResponseItem = {
    id: "tx-payment-1",
    uuid: "tx-uuid-1",
    source: "bank-1",
    amount: 5000,
    description: "Payment for lunch",
    privacyLevel: DefaultPrivacyLevel.public,
    receiverId: "user-2",
    senderId: "user-1",
    balanceAtCompletion: 95000,
    status: TransactionStatus.complete,
    requestStatus: "",
    createdAt: new Date("2024-01-15"),
    modifiedAt: new Date("2024-01-15"),
    likes: [
      {
        id: "like-1",
        uuid: "like-uuid-1",
        userId: "user-3",
        transactionId: "tx-payment-1",
        createdAt: new Date("2024-01-16"),
        modifiedAt: new Date("2024-01-16"),
      },
    ],
    comments: [
      {
        id: "comment-1",
        uuid: "comment-uuid-1",
        content: "Nice!",
        userId: "user-3",
        transactionId: "tx-payment-1",
        createdAt: new Date("2024-01-16"),
        modifiedAt: new Date("2024-01-16"),
      },
      {
        id: "comment-2",
        uuid: "comment-uuid-2",
        content: "Thanks!",
        userId: "user-2",
        transactionId: "tx-payment-1",
        createdAt: new Date("2024-01-17"),
        modifiedAt: new Date("2024-01-17"),
      },
    ],
    receiverName: "Bob Smith",
    receiverAvatar: "https://example.com/bob.svg",
    senderName: "Alice Johnson",
    senderAvatar: "https://example.com/alice.svg",
  };

  const requestTransaction: TransactionResponseItem = {
    ...paymentTransaction,
    id: "tx-request-1",
    source: "",
    requestStatus: "pending",
    description: "Charge for dinner",
    likes: [],
    comments: [],
  };

  it("renders the transaction item with description and sender info", () => {
    cy.mount(
      <MemoryRouter>
        <TransactionItem transaction={paymentTransaction} />
      </MemoryRouter>
    );

    cy.getBySel(`transaction-item-${paymentTransaction.id}`).should("be.visible");
    cy.getBySel(`transaction-item-${paymentTransaction.id}`).should(
      "contain",
      paymentTransaction.description
    );
  });

  it("displays the like count", () => {
    cy.mount(
      <MemoryRouter>
        <TransactionItem transaction={paymentTransaction} />
      </MemoryRouter>
    );

    cy.getBySel("transaction-like-count").should(
      "contain",
      paymentTransaction.likes.length.toString()
    );
  });

  it("displays the comment count", () => {
    cy.mount(
      <MemoryRouter>
        <TransactionItem transaction={paymentTransaction} />
      </MemoryRouter>
    );

    cy.getBySel("transaction-comment-count").should(
      "contain",
      paymentTransaction.comments.length.toString()
    );
  });

  it("displays the transaction amount", () => {
    cy.mount(
      <MemoryRouter>
        <TransactionItem transaction={paymentTransaction} />
      </MemoryRouter>
    );

    cy.getBySel(`transaction-amount-${paymentTransaction.id}`).should("be.visible");
  });

  it("renders zero counts for a transaction with no likes or comments", () => {
    cy.mount(
      <MemoryRouter>
        <TransactionItem transaction={requestTransaction} />
      </MemoryRouter>
    );

    cy.getBySel("transaction-like-count").should("contain", "0");
    cy.getBySel("transaction-comment-count").should("contain", "0");
  });

  it("displays the sender name in the transaction title", () => {
    cy.mount(
      <MemoryRouter>
        <TransactionItem transaction={paymentTransaction} />
      </MemoryRouter>
    );

    cy.get("[data-test*=transaction-sender]").should("contain", paymentTransaction.senderName);
  });
});
