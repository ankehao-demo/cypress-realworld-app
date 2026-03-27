import React from "react";
import UserListItem from "./UserListItem";

const user = {
  id: "test-user-id",
  uuid: "test-uuid",
  firstName: "John",
  lastName: "Doe",
  username: "johndoe",
  password: "s3cret",
  email: "john@example.com",
  phoneNumber: "555-123-4567",
  balance: 10000,
  avatar: "https://example.com/avatar.png",
  defaultPrivacyLevel: "public" as any,
  createdAt: new Date(),
  modifiedAt: new Date(),
};

describe("UserListItem", () => {
  it("renders the user's first name and last name", () => {
    const setReceiver = cy.stub().as("setReceiver");

    cy.mount(<UserListItem user={user} setReceiver={setReceiver} index={0} />);

    cy.contains(`${user.firstName} ${user.lastName}`).should("be.visible");
  });

  it("renders within a [data-test^=user-list-item-] selector", () => {
    const setReceiver = cy.stub().as("setReceiver");

    cy.mount(<UserListItem user={user} setReceiver={setReceiver} index={0} />);

    cy.get("[data-test^=user-list-item-]").should("exist");
    cy.get(`[data-test="user-list-item-${user.id}"]`).should("exist");
  });

  it("clicking the list item calls setReceiver with the user object", () => {
    const setReceiver = cy.stub().as("setReceiver");

    cy.mount(<UserListItem user={user} setReceiver={setReceiver} index={0} />);

    cy.get("[data-test^=user-list-item-]").click();
    cy.get("@setReceiver").should("have.been.calledWith", user);
  });
});
