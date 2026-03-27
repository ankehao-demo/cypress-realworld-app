import * as React from "react";
import BankAccountItem from "./BankAccountItem";
import { BankAccount } from "../models";

const bankAccount: BankAccount = {
  id: "RskoB7r4Bic",
  uuid: "a5e8a3f2-1b4c-4c6e-bb5a-5a0e13f37c99",
  userId: "t45AiwidW",
  bankName: "Test Bank",
  accountNumber: "1234567890",
  routingNumber: "987654321",
  isDeleted: false,
  createdAt: new Date("2019-08-27T23:47:05.637Z"),
  modifiedAt: new Date("2020-05-21T11:02:22.857Z"),
};

describe("BankAccountItem", () => {
  it("renders bank name", () => {
    const deleteBankAccount = cy.stub();
    cy.mount(<BankAccountItem bankAccount={bankAccount} deleteBankAccount={deleteBankAccount} />);
    cy.get(`[data-test=bankaccount-list-item-${bankAccount.id}]`).should(
      "contain",
      bankAccount.bankName
    );
  });

  it("renders Delete button and calls deleteBankAccount when clicked", () => {
    const deleteBankAccount = cy.stub().as("deleteBankAccount");
    cy.mount(<BankAccountItem bankAccount={bankAccount} deleteBankAccount={deleteBankAccount} />);
    cy.get("[data-test=bankaccount-delete]").should("be.visible").click();
    cy.get("@deleteBankAccount").should("have.been.calledWith", { id: bankAccount.id });
  });

  it("does not render Delete button and shows (Deleted) when isDeleted is true", () => {
    const deletedBankAccount: BankAccount = { ...bankAccount, isDeleted: true };
    const deleteBankAccount = cy.stub();
    cy.mount(
      <BankAccountItem bankAccount={deletedBankAccount} deleteBankAccount={deleteBankAccount} />
    );
    cy.get("[data-test=bankaccount-delete]").should("not.exist");
    cy.get(`[data-test=bankaccount-list-item-${bankAccount.id}]`).should("contain", "(Deleted)");
  });
});
