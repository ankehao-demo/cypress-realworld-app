import React from "react";
import { MemoryRouter } from "react-router-dom";
import BankAccountForm from "./BankAccountForm";

describe("BankAccountForm", () => {
  const userId = "t45AiwidW";

  it("renders the bank account form with all input fields and a submit button", () => {
    const createBankAccountStub = cy.stub().as("createBankAccount");

    cy.mount(
      <MemoryRouter>
        <BankAccountForm userId={userId} createBankAccount={createBankAccountStub} />
      </MemoryRouter>
    );

    cy.getBySel("bankaccount-form").should("be.visible");
    cy.getBySel("bankaccount-bankName-input").should("be.visible");
    cy.getBySel("bankaccount-routingNumber-input").should("be.visible");
    cy.getBySel("bankaccount-accountNumber-input").should("be.visible");
    cy.getBySel("bankaccount-submit").should("be.visible").and("be.disabled");
  });

  it("enables the submit button when all fields are filled with valid data", () => {
    const createBankAccountStub = cy.stub().as("createBankAccount");

    cy.mount(
      <MemoryRouter>
        <BankAccountForm userId={userId} createBankAccount={createBankAccountStub} />
      </MemoryRouter>
    );

    cy.getBySel("bankaccount-bankName-input").type("Best Bank");
    cy.getBySel("bankaccount-routingNumber-input").type("123456789");
    cy.getBySel("bankaccount-accountNumber-input").type("987654321");
    cy.getBySel("bankaccount-submit").should("be.enabled");
  });

  it("calls createBankAccount with form values on submit", () => {
    const createBankAccountStub = cy.stub().as("createBankAccount");

    cy.mount(
      <MemoryRouter>
        <BankAccountForm userId={userId} createBankAccount={createBankAccountStub} />
      </MemoryRouter>
    );

    cy.getBySel("bankaccount-bankName-input").type("Best Bank");
    cy.getBySel("bankaccount-routingNumber-input").type("123456789");
    cy.getBySel("bankaccount-accountNumber-input").type("987654321");
    cy.getBySel("bankaccount-submit").click();

    cy.get("@createBankAccount").should("have.been.calledOnce");
    cy.get("@createBankAccount").should(
      "have.been.calledWith",
      Cypress.sinon.match({
        userId,
        bankName: "Best Bank",
        routingNumber: "123456789",
        accountNumber: "987654321",
      })
    );
  });

  it("shows validation error when bank name is too short", () => {
    const createBankAccountStub = cy.stub().as("createBankAccount");

    cy.mount(
      <MemoryRouter>
        <BankAccountForm userId={userId} createBankAccount={createBankAccountStub} />
      </MemoryRouter>
    );

    cy.getBySel("bankaccount-bankName-input").type("AB");
    cy.getBySel("bankaccount-bankName-input").find("input").blur();
    cy.get("#bankaccount-bankName-input-helper-text").should(
      "contain",
      "Must contain at least 5 characters"
    );
    cy.getBySel("bankaccount-submit").should("be.disabled");
  });

  it("shows validation error when routing number is not 9 digits", () => {
    const createBankAccountStub = cy.stub().as("createBankAccount");

    cy.mount(
      <MemoryRouter>
        <BankAccountForm userId={userId} createBankAccount={createBankAccountStub} />
      </MemoryRouter>
    );

    cy.getBySel("bankaccount-routingNumber-input").type("12345");
    cy.getBySel("bankaccount-routingNumber-input").find("input").blur();
    cy.get("#bankaccount-routingNumber-input-helper-text").should(
      "contain",
      "Must contain a valid routing number"
    );
    cy.getBySel("bankaccount-submit").should("be.disabled");
  });

  it("shows validation error when account number is too short", () => {
    const createBankAccountStub = cy.stub().as("createBankAccount");

    cy.mount(
      <MemoryRouter>
        <BankAccountForm userId={userId} createBankAccount={createBankAccountStub} />
      </MemoryRouter>
    );

    cy.getBySel("bankaccount-accountNumber-input").type("1234");
    cy.getBySel("bankaccount-accountNumber-input").find("input").blur();
    cy.get("#bankaccount-accountNumber-input-helper-text").should(
      "contain",
      "Must contain at least 9 digits"
    );
    cy.getBySel("bankaccount-submit").should("be.disabled");
  });
});
