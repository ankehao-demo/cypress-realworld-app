import * as React from "react";
import BankAccountList from "./BankAccountList";
import { BankAccount } from "../models";

describe("BankAccountList", () => {
  const bankAccounts: BankAccount[] = [
    {
      id: "RskoB7r4Bic",
      uuid: "a5a0e5e1-1a2b-3c4d-5e6f-7a8b9c0d1e2f",
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
      uuid: "b6b1f6f2-2b3c-4d5e-6f7a-8b9c0d1e2f3a",
      userId: "t45AiwidW",
      bankName: "National Trust",
      accountNumber: "0987654321",
      routingNumber: "123456789",
      isDeleted: false,
      createdAt: new Date("2024-02-20"),
      modifiedAt: new Date("2024-02-20"),
    },
    {
      id: "cEkVc5js6P",
      uuid: "c7c2g7g3-3c4d-5e6f-7a8b-9c0d1e2f3a4b",
      userId: "t45AiwidW",
      bankName: "Savings Plus",
      accountNumber: "1122334455",
      routingNumber: "556677889",
      isDeleted: true,
      createdAt: new Date("2024-03-10"),
      modifiedAt: new Date("2024-03-10"),
    },
  ];

  it("renders the list with the correct number of items when bankAccounts has items", () => {
    const deleteBankAccountStub = cy.stub().as("deleteBankAccount");

    cy.mount(
      <BankAccountList bankAccounts={bankAccounts} deleteBankAccount={deleteBankAccountStub} />
    );

    cy.get("[data-test=bankaccount-list]").should("exist");
    cy.get("[data-test^=bankaccount-list-item-]").should("have.length", 3);
  });

  it("renders the EmptyList component when bankAccounts is an empty array", () => {
    const deleteBankAccountStub = cy.stub().as("deleteBankAccount");

    cy.mount(<BankAccountList bankAccounts={[]} deleteBankAccount={deleteBankAccountStub} />);

    cy.get("[data-test=bankaccount-list]").should("not.exist");
    cy.get("[data-test=empty-list-header]").should("contain", "Bank Accounts");
  });
});
