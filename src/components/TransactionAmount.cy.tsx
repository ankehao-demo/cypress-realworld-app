import * as React from "react";
import TransactionAmount from "./TransactionAmount";

describe("TransactionAmount", () => {
  it("renders with + prefix for a request transaction", () => {
    cy.fixture("public-transactions.json").then((data) => {
      // results[2] has requestStatus: "pending" -> isRequestTransaction returns true
      const requestTransaction = data.results[2];
      cy.mount(<TransactionAmount transaction={requestTransaction} />);
      cy.get(`[data-test=transaction-amount-${requestTransaction.id}]`)
        .should("contain", "+")
        .and("have.class", "TransactionAmount-amountPositive");
    });
  });

  it("renders with - prefix for a payment transaction", () => {
    cy.fixture("public-transactions.json").then((data) => {
      // results[0] has requestStatus: "" -> isRequestTransaction returns false
      const paymentTransaction = data.results[0];
      cy.mount(<TransactionAmount transaction={paymentTransaction} />);
      cy.get(`[data-test=transaction-amount-${paymentTransaction.id}]`)
        .should("contain", "-")
        .and("have.class", "TransactionAmount-amountNegative");
    });
  });

  it("renders the correctly formatted amount", () => {
    cy.fixture("public-transactions.json").then((data) => {
      const transaction = data.results[0];
      cy.mount(<TransactionAmount transaction={transaction} />);
      cy.get(`[data-test^=transaction-amount-]`).should("contain", "$");
    });
  });
});
