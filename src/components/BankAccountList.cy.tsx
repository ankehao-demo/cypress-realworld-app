import * as React from "react";
import BankAccountList from "./BankAccountList";
import { BankAccount } from "../models";

const bankAccounts: BankAccount[] = [
  {
    id: "RskoB7r4Bic",
    uuid: "a5e8a3f2-1b4c-4c6e-bb5a-5a0e13f37c99",
    userId: "t45AiwidW",
    bankName: "First National Bank",
    accountNumber: "1234567890",
    routingNumber: "987654321",
    isDeleted: false,
    createdAt: new Date("2019-08-27T23:47:05.637Z"),
    modifiedAt: new Date("2020-05-21T11:02:22.857Z"),
  },
  {
    id: "bDjUb4ir5O",
    uuid: "b6e3d4c1-2a5b-4d7f-aa3c-8b1f24e69d12",
    userId: "t45AiwidW",
    bankName: "Second State Bank",
    accountNumber: "0987654321",
    routingNumber: "123456789",
    isDeleted: false,
    createdAt: new Date("2019-09-15T10:22:33.123Z"),
    modifiedAt: new Date("2020-06-01T14:30:00.000Z"),
  },
];

describe("BankAccountList", () => {
  it("renders a list of bank account items when bankAccounts has items", () => {
    const deleteBankAccount = cy.stub();
    cy.mount(<BankAccountList bankAccounts={bankAccounts} deleteBankAccount={deleteBankAccount} />);
    cy.get("[data-test=bankaccount-list]").should("be.visible");
    cy.get("[data-test^=bankaccount-list-item-]").should("have.length", bankAccounts.length);
  });

  it("renders EmptyList when bankAccounts is an empty array", () => {
    const deleteBankAccount = cy.stub();
    cy.mount(<BankAccountList bankAccounts={[]} deleteBankAccount={deleteBankAccount} />);
    cy.get("[data-test=bankaccount-list]").should("not.exist");
    cy.get("[data-test=empty-list-header]").should("contain", "Bank Accounts");
  });
});
