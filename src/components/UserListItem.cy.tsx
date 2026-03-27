import * as React from "react";
import UserListItem from "./UserListItem";
import { User } from "../models";

const user: User = {
  id: "t45AiwidW",
  uuid: "6383f84e-b511-44c5-a835-3ece1d781fa8",
  firstName: "Edgar",
  lastName: "Johns",
  username: "Katharina_Bernier",
  password: "$2a$10$5PXHGtcsckWtAprT5/JmluhR13f16BL8SIGhvAKNP.Dhxkt69FfzW",
  email: "Norene39@yahoo.com",
  phoneNumber: "625-316-9882",
  balance: 168137,
  avatar: "https://cypress-realworld-app-svgs.s3.amazonaws.com/t45AiwidW.svg",
  defaultPrivacyLevel: "public" as const,
  createdAt: new Date("2019-08-27T23:47:05.637Z"),
  modifiedAt: new Date("2020-05-21T11:02:22.857Z"),
};

describe("UserListItem", () => {
  it("renders the user's first and last name", () => {
    const setReceiver = cy.stub();
    cy.mount(<UserListItem user={user} setReceiver={setReceiver} index={0} />);
    cy.get(`[data-test=user-list-item-${user.id}]`)
      .should("contain", user.firstName)
      .and("contain", user.lastName);
  });

  it("renders within a user-list-item selector", () => {
    const setReceiver = cy.stub();
    cy.mount(<UserListItem user={user} setReceiver={setReceiver} index={0} />);
    cy.get("[data-test^=user-list-item-]").should("be.visible");
  });

  it("calls setReceiver with the user object when clicked", () => {
    const setReceiver = cy.stub().as("setReceiver");
    cy.mount(<UserListItem user={user} setReceiver={setReceiver} index={0} />);
    cy.get(`[data-test=user-list-item-${user.id}]`).click();
    cy.get("@setReceiver").should("have.been.calledWith", user);
  });
});
