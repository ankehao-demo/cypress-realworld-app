import * as React from "react";
import TransactionAmount from "./TransactionAmount";

describe("TransactionAmount", () => {
  it("renders with '+' prefix and amountPositive class for a request transaction", () => {
    cy.fixture("public-transactions.json").then((transactions) => {
      const transaction = transactions.results[2]; // requestStatus: "pending"

      cy.mount(<TransactionAmount transaction={transaction} />);

      cy.get(`[data-test=transaction-amount-${transaction.id}]`)
        .should("contain", "+")
        .and("have.class", "TransactionAmount-amountPositive");
    });
  });

  it("renders with '-' prefix and amountNegative class for a payment transaction", () => {
    cy.fixture("public-transactions.json").then((transactions) => {
      const transaction = transactions.results[0]; // requestStatus: ""

      cy.mount(<TransactionAmount transaction={transaction} />);

      cy.get(`[data-test=transaction-amount-${transaction.id}]`)
        .should("contain", "-")
        .and("have.class", "TransactionAmount-amountNegative");
    });
  });

  it("renders the correctly formatted amount", () => {
    cy.fixture("public-transactions.json").then((transactions) => {
      const transaction = transactions.results[0]; // amount: 8647

      cy.mount(<TransactionAmount transaction={transaction} />);

      cy.get(`[data-test=transaction-amount-${transaction.id}]`).should("contain", "$86.47");
    });
  });
});
