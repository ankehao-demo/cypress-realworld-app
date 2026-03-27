import * as React from "react";
import BankAccountListItem from "./BankAccountItem";

describe("BankAccountItem", () => {
  const bankAccount = {
    id: "RskoB7r4Bic",
    uuid: "a]5a0e5e-1a2b-3c4d-5e6f-7a8b9c0d1e2f",
    userId: "t45AiwidW",
    bankName: "Best Bank",
    accountNumber: "1234567890",
    routingNumber: "987654321",
    isDeleted: false,
    createdAt: new Date("2024-01-15"),
    modifiedAt: new Date("2024-01-15"),
  };

  it("renders bank name from bankAccount.bankName", () => {
    const deleteBankAccountStub = cy.stub().as("deleteBankAccount");

    cy.mount(
      <BankAccountListItem bankAccount={bankAccount} deleteBankAccount={deleteBankAccountStub} />
    );

    cy.get(`[data-test=bankaccount-list-item-${bankAccount.id}]`).should(
      "contain",
      bankAccount.bankName
    );
  });

  it("when bankAccount.isDeleted is false, renders a Delete button and clicking it calls deleteBankAccount", () => {
    const deleteBankAccountStub = cy.stub().as("deleteBankAccount");

    cy.mount(
      <BankAccountListItem
        bankAccount={{ ...bankAccount, isDeleted: false }}
        deleteBankAccount={deleteBankAccountStub}
      />
    );

    cy.get("[data-test=bankaccount-delete]").should("be.visible").click();
    cy.get("@deleteBankAccount").should("have.been.calledWith", { id: bankAccount.id });
  });

  it("when bankAccount.isDeleted is true, does NOT render the Delete button and shows '(Deleted)' text", () => {
    const deleteBankAccountStub = cy.stub().as("deleteBankAccount");

    cy.mount(
      <BankAccountListItem
        bankAccount={{ ...bankAccount, isDeleted: true }}
        deleteBankAccount={deleteBankAccountStub}
      />
    );

    cy.get("[data-test=bankaccount-delete]").should("not.exist");
    cy.get(`[data-test=bankaccount-list-item-${bankAccount.id}]`).should("contain", "(Deleted)");
  });
});
