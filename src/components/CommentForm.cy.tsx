import * as React from "react";
import CommentForm from "./CommentForm";

const transactionId = "si_aNEMbyCA";

describe("CommentForm", () => {
  it("renders the comment input field", () => {
    const transactionComment = cy.stub();
    cy.mount(<CommentForm transactionId={transactionId} transactionComment={transactionComment} />);
    cy.get(`[data-test=transaction-comment-input-${transactionId}]`).should("be.visible");
  });

  it("has an empty input field by default", () => {
    const transactionComment = cy.stub();
    cy.mount(<CommentForm transactionId={transactionId} transactionComment={transactionComment} />);
    cy.get(`[data-test=transaction-comment-input-${transactionId}]`).should("have.value", "");
  });

  it("submits the form with the correct payload when text is typed", () => {
    const transactionComment = cy.stub().as("transactionComment");
    cy.mount(<CommentForm transactionId={transactionId} transactionComment={transactionComment} />);
    const commentText = "This is a test comment";
    cy.get(`[data-test=transaction-comment-input-${transactionId}]`).type(commentText);
    cy.get("form").submit();
    cy.get("@transactionComment").should("have.been.calledWith", {
      transactionId,
      content: commentText,
    });
  });
});
