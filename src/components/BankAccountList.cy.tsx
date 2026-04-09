import React from "react";
import BankAccountList from "./BankAccountList";
import { BankAccount } from "../models";

describe("BankAccountList", () => {
  const bankAccounts: BankAccount[] = [
    {
      id: "RskoB7r4Bic",
      uuid: "a5a0e5e-1a2b-3c4d-5e6f-7a8b9c0d1e2f",
      userId: "t45AiwidW",
      bankName: "Best Bank",
      accountNumber: "1234567890",
      routingNumber: "987654321",
      isDeleted: false,
      createdAt: new Date("2024-01-15"),
      modifiedAt: new Date("2024-01-15"),
    },
    {
      id: "bDjUb4ir5O",
      uuid: "b6b1f6f-2b3c-4d5e-6f7a-8b9c0d1e2f3a",
      userId: "t45AiwidW",
      bankName: "Second Bank",
      accountNumber: "0987654321",
      routingNumber: "123456789",
      isDeleted: false,
      createdAt: new Date("2024-02-20"),
      modifiedAt: new Date("2024-02-20"),
    },
    {
      id: "cE5kC8s6Dp",
      uuid: "c7c2g7g-3c4d-5e6f-7a8b-9c0d1e2f3a4b",
      userId: "t45AiwidW",
      bankName: "Deleted Bank",
      accountNumber: "1111111111",
      routingNumber: "999999999",
      isDeleted: true,
      createdAt: new Date("2024-03-10"),
      modifiedAt: new Date("2024-03-10"),
    },
  ];

  it("renders a list of bank accounts", () => {
    const deleteBankAccountStub = cy.stub().as("deleteBankAccount");

    cy.mount(
      <BankAccountList bankAccounts={bankAccounts} deleteBankAccount={deleteBankAccountStub} />
    );

    cy.getBySel("bankaccount-list").should("be.visible");
    cy.getBySel(`bankaccount-list-item-${bankAccounts[0].id}`).should("contain", "Best Bank");
    cy.getBySel(`bankaccount-list-item-${bankAccounts[1].id}`).should("contain", "Second Bank");
    cy.getBySel(`bankaccount-list-item-${bankAccounts[2].id}`).should("contain", "Deleted Bank");
  });

  it("renders the correct number of bank account items", () => {
    const deleteBankAccountStub = cy.stub().as("deleteBankAccount");

    cy.mount(
      <BankAccountList bankAccounts={bankAccounts} deleteBankAccount={deleteBankAccountStub} />
    );

    cy.getBySel("bankaccount-list")
      .find("[data-test^=bankaccount-list-item-]")
      .should("have.length", 3);
  });

  it("renders empty state when bankAccounts array is empty", () => {
    const deleteBankAccountStub = cy.stub().as("deleteBankAccount");

    cy.mount(<BankAccountList bankAccounts={[]} deleteBankAccount={deleteBankAccountStub} />);

    cy.getBySel("bankaccount-list").should("not.exist");
    cy.getBySel("empty-list-header").should("contain", "No Bank Accounts");
  });

  it("shows delete button only for non-deleted accounts", () => {
    const deleteBankAccountStub = cy.stub().as("deleteBankAccount");

    cy.mount(
      <BankAccountList bankAccounts={bankAccounts} deleteBankAccount={deleteBankAccountStub} />
    );

    cy.getBySel(`bankaccount-list-item-${bankAccounts[0].id}`)
      .find("[data-test=bankaccount-delete]")
      .should("exist");
    cy.getBySel(`bankaccount-list-item-${bankAccounts[1].id}`)
      .find("[data-test=bankaccount-delete]")
      .should("exist");
    cy.getBySel(`bankaccount-list-item-${bankAccounts[2].id}`)
      .find("[data-test=bankaccount-delete]")
      .should("not.exist");
    cy.getBySel(`bankaccount-list-item-${bankAccounts[2].id}`).should("contain", "(Deleted)");
  });
});
