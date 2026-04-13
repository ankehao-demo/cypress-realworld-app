import * as React from "react";
import CommentForm from "./CommentForm";

describe("CommentForm", () => {
  const transactionId = "test-tx-id";

  it("renders the comment input field", () => {
    const transactionCommentStub = cy.stub().as("transactionComment");

    cy.mount(
      <CommentForm transactionId={transactionId} transactionComment={transactionCommentStub} />
    );

    cy.get(`[data-test=transaction-comment-input-${transactionId}]`)
      .should("exist")
      .and("have.attr", "placeholder", "Write a comment...");
  });

  it("calls transactionComment with empty content when submitted without typing", () => {
    const transactionCommentStub = cy.stub().as("transactionComment");

    cy.mount(
      <CommentForm transactionId={transactionId} transactionComment={transactionCommentStub} />
    );

    cy.get(`[data-test=transaction-comment-input-${transactionId}]`).type("{enter}");
    cy.get("@transactionComment").should("have.been.calledWith", {
      transactionId,
      content: "",
    });
  });

  it("calls transactionComment with correct payload on submit", () => {
    const transactionCommentStub = cy.stub().as("transactionComment");

    cy.mount(
      <CommentForm transactionId={transactionId} transactionComment={transactionCommentStub} />
    );

    cy.get(`[data-test=transaction-comment-input-${transactionId}]`).type(
      "Great transaction!{enter}"
    );
    cy.get("@transactionComment").should("have.been.calledWith", {
      transactionId,
      content: "Great transaction!",
    });
  });
});
