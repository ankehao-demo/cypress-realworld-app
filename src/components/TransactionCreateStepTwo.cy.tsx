import React from "react";
import TransactionCreateStepTwo from "./TransactionCreateStepTwo";
import { User, DefaultPrivacyLevel } from "../models";

const sender: User = {
  id: "sender-id",
  uuid: "sender-uuid",
  firstName: "Alice",
  lastName: "Smith",
  username: "alicesmith",
  password: "s3cret",
  email: "alice@example.com",
  phoneNumber: "555-000-1111",
  balance: 50000,
  avatar: "https://example.com/alice.svg",
  defaultPrivacyLevel: DefaultPrivacyLevel.public,
  createdAt: new Date("2024-01-01"),
  modifiedAt: new Date("2024-01-01"),
};

const receiver: User = {
  id: "receiver-id",
  uuid: "receiver-uuid",
  firstName: "Bob",
  lastName: "Jones",
  username: "bobjones",
  password: "s3cret",
  email: "bob@example.com",
  phoneNumber: "555-000-2222",
  balance: 30000,
  avatar: "https://example.com/bob.svg",
  defaultPrivacyLevel: DefaultPrivacyLevel.public,
  createdAt: new Date("2024-01-01"),
  modifiedAt: new Date("2024-01-01"),
};

describe("TransactionCreateStepTwo", () => {
  it("renders the receiver's full name and avatar", () => {
    const createTransaction = cy.stub();
    const showSnackbar = cy.stub();

    cy.mount(
      <TransactionCreateStepTwo
        receiver={receiver}
        sender={sender}
        createTransaction={createTransaction}
        showSnackbar={showSnackbar}
      />
    );

    cy.contains(`${receiver.firstName} ${receiver.lastName}`).should("be.visible");
    cy.get("img").should("have.attr", "src", receiver.avatar);
  });

  it("renders the amount and description input fields", () => {
    const createTransaction = cy.stub();
    const showSnackbar = cy.stub();

    cy.mount(
      <TransactionCreateStepTwo
        receiver={receiver}
        sender={sender}
        createTransaction={createTransaction}
        showSnackbar={showSnackbar}
      />
    );

    cy.get("[data-test=transaction-create-amount-input]").should("exist");
    cy.get("[data-test=transaction-create-description-input]").should("exist");
  });

  it("renders Request and Pay buttons", () => {
    const createTransaction = cy.stub();
    const showSnackbar = cy.stub();

    cy.mount(
      <TransactionCreateStepTwo
        receiver={receiver}
        sender={sender}
        createTransaction={createTransaction}
        showSnackbar={showSnackbar}
      />
    );

    cy.get("[data-test=transaction-create-submit-request]")
      .should("exist")
      .and("contain", "Request");
    cy.get("[data-test=transaction-create-submit-payment]")
      .should("exist")
      .and("contain", "Pay");
  });

  it("disables Request and Pay buttons when the form is empty (invalid)", () => {
    const createTransaction = cy.stub();
    const showSnackbar = cy.stub();

    cy.mount(
      <TransactionCreateStepTwo
        receiver={receiver}
        sender={sender}
        createTransaction={createTransaction}
        showSnackbar={showSnackbar}
      />
    );

    cy.get("[data-test=transaction-create-submit-request]").should("be.disabled");
    cy.get("[data-test=transaction-create-submit-payment]").should("be.disabled");
  });

  it("enables buttons when both amount and description are filled in", () => {
    const createTransaction = cy.stub();
    const showSnackbar = cy.stub();

    cy.mount(
      <TransactionCreateStepTwo
        receiver={receiver}
        sender={sender}
        createTransaction={createTransaction}
        showSnackbar={showSnackbar}
      />
    );

    cy.get("#amount").type("50");
    cy.get("[data-test=transaction-create-description-input]").type("Test payment");

    cy.get("[data-test=transaction-create-submit-request]").should("not.be.disabled");
    cy.get("[data-test=transaction-create-submit-payment]").should("not.be.disabled");
  });

  it("keeps buttons disabled when only amount is provided (missing description)", () => {
    const createTransaction = cy.stub();
    const showSnackbar = cy.stub();

    cy.mount(
      <TransactionCreateStepTwo
        receiver={receiver}
        sender={sender}
        createTransaction={createTransaction}
        showSnackbar={showSnackbar}
      />
    );

    cy.get("#amount").type("25");

    cy.get("[data-test=transaction-create-submit-request]").should("be.disabled");
    cy.get("[data-test=transaction-create-submit-payment]").should("be.disabled");
  });

  it("keeps buttons disabled when only description is provided (missing amount)", () => {
    const createTransaction = cy.stub();
    const showSnackbar = cy.stub();

    cy.mount(
      <TransactionCreateStepTwo
        receiver={receiver}
        sender={sender}
        createTransaction={createTransaction}
        showSnackbar={showSnackbar}
      />
    );

    cy.get("[data-test=transaction-create-description-input]").type("A note");

    cy.get("[data-test=transaction-create-submit-request]").should("be.disabled");
    cy.get("[data-test=transaction-create-submit-payment]").should("be.disabled");
  });

  it("calls createTransaction with transactionType 'request' when Request is clicked", () => {
    const createTransaction = cy.stub().as("createTransaction");
    const showSnackbar = cy.stub().as("showSnackbar");

    cy.mount(
      <TransactionCreateStepTwo
        receiver={receiver}
        sender={sender}
        createTransaction={createTransaction}
        showSnackbar={showSnackbar}
      />
    );

    cy.get("#amount").type("100");
    cy.get("[data-test=transaction-create-description-input]").type("Lunch money");
    cy.get("[data-test=transaction-create-submit-request]").click();

    cy.get("@createTransaction").should("have.been.calledOnce");
    cy.get("@createTransaction")
      .its("firstCall.args.0")
      .should("deep.include", {
        transactionType: "request",
        amount: "100",
        description: "Lunch money",
        senderId: sender.id,
        receiverId: receiver.id,
      });
  });

  it("calls createTransaction with transactionType 'payment' when Pay is clicked", () => {
    const createTransaction = cy.stub().as("createTransaction");
    const showSnackbar = cy.stub().as("showSnackbar");

    cy.mount(
      <TransactionCreateStepTwo
        receiver={receiver}
        sender={sender}
        createTransaction={createTransaction}
        showSnackbar={showSnackbar}
      />
    );

    cy.get("#amount").type("75");
    cy.get("[data-test=transaction-create-description-input]").type("Coffee");
    cy.get("[data-test=transaction-create-submit-payment]").click();

    cy.get("@createTransaction").should("have.been.calledOnce");
    cy.get("@createTransaction")
      .its("firstCall.args.0")
      .should("deep.include", {
        transactionType: "payment",
        amount: "75",
        description: "Coffee",
        senderId: sender.id,
        receiverId: receiver.id,
      });
  });

  it("calls showSnackbar with success message on form submission", () => {
    const createTransaction = cy.stub().as("createTransaction");
    const showSnackbar = cy.stub().as("showSnackbar");

    cy.mount(
      <TransactionCreateStepTwo
        receiver={receiver}
        sender={sender}
        createTransaction={createTransaction}
        showSnackbar={showSnackbar}
      />
    );

    cy.get("#amount").type("50");
    cy.get("[data-test=transaction-create-description-input]").type("Groceries");
    cy.get("[data-test=transaction-create-submit-payment]").click();

    cy.get("@showSnackbar").should("have.been.calledWith", {
      severity: "success",
      message: "Transaction Submitted!",
    });
  });

  it("renders the form with data-test attribute 'transaction-create-form'", () => {
    const createTransaction = cy.stub();
    const showSnackbar = cy.stub();

    cy.mount(
      <TransactionCreateStepTwo
        receiver={receiver}
        sender={sender}
        createTransaction={createTransaction}
        showSnackbar={showSnackbar}
      />
    );

    cy.get("[data-test=transaction-create-form]").should("exist");
  });

  it("displays the amount field with a dollar-sign prefix via NumberFormat", () => {
    const createTransaction = cy.stub();
    const showSnackbar = cy.stub();

    cy.mount(
      <TransactionCreateStepTwo
        receiver={receiver}
        sender={sender}
        createTransaction={createTransaction}
        showSnackbar={showSnackbar}
      />
    );

    cy.get("#amount").type("1234");
    cy.get("#amount").should("have.value", "$1,234");
  });

  it("does not call createTransaction if the form has not been submitted", () => {
    const createTransaction = cy.stub().as("createTransaction");
    const showSnackbar = cy.stub().as("showSnackbar");

    cy.mount(
      <TransactionCreateStepTwo
        receiver={receiver}
        sender={sender}
        createTransaction={createTransaction}
        showSnackbar={showSnackbar}
      />
    );

    cy.get("#amount").type("50");
    cy.get("[data-test=transaction-create-description-input]").type("Note");

    // Buttons should be enabled but not clicked
    cy.get("[data-test=transaction-create-submit-request]").should("not.be.disabled");
    cy.get("@createTransaction").should("not.have.been.called");
    cy.get("@showSnackbar").should("not.have.been.called");
  });
});
