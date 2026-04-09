import React from "react";
import UserSettingsForm from "./UserSettingsForm";
import { User, DefaultPrivacyLevel } from "../models";

describe("UserSettingsForm", () => {
  const userProfile: User = {
    id: "t45AiwidW",
    uuid: "6383f84e-b511-44c5-a835-3ece1d781fa8",
    firstName: "Edgar",
    lastName: "Johns",
    username: "Katharina_Bernier",
    password: "$2a$10$5PXHGtcsckWtAprT5/JmluhR13f16BL8SIGhvAKNP.Dhxkt69FfzW",
    email: "Norene39@yahoo.com",
    phoneNumber: "625-316-9882",
    avatar: "https://cypress-realworld-app-svgs.s3.amazonaws.com/t45AiwidW.svg",
    defaultPrivacyLevel: DefaultPrivacyLevel.public,
    balance: 168137,
    createdAt: new Date("2019-08-27T23:47:05.637Z"),
    modifiedAt: new Date("2020-05-21T11:02:22.857Z"),
  };

  it("renders the form with user profile data pre-filled", () => {
    const updateUserStub = cy.stub().as("updateUser");

    cy.mount(<UserSettingsForm userProfile={userProfile} updateUser={updateUserStub} />);

    cy.getBySel("user-settings-form").should("be.visible");
    cy.getBySel("user-settings-firstName-input").should("have.value", userProfile.firstName);
    cy.getBySel("user-settings-lastName-input").should("have.value", userProfile.lastName);
    cy.getBySel("user-settings-email-input").should("have.value", userProfile.email);
    cy.getBySel("user-settings-phoneNumber-input").should("have.value", userProfile.phoneNumber);
  });

  it("renders save button that is initially enabled", () => {
    const updateUserStub = cy.stub().as("updateUser");

    cy.mount(<UserSettingsForm userProfile={userProfile} updateUser={updateUserStub} />);

    cy.getBySel("user-settings-submit").should("be.visible").and("be.enabled");
  });

  it("calls updateUser with form values on submit", () => {
    const updateUserStub = cy.stub().as("updateUser");

    cy.mount(<UserSettingsForm userProfile={userProfile} updateUser={updateUserStub} />);

    cy.getBySel("user-settings-firstName-input").clear();
    cy.getBySel("user-settings-firstName-input").type("Updated");
    cy.getBySel("user-settings-submit").click();

    cy.get("@updateUser").should("have.been.calledOnce");
    cy.get("@updateUser").should(
      "have.been.calledWith",
      Cypress.sinon.match({
        id: userProfile.id,
        firstName: "Updated",
        lastName: userProfile.lastName,
        email: userProfile.email,
        phoneNumber: userProfile.phoneNumber,
      })
    );
  });

  it("shows validation error for empty first name", () => {
    const updateUserStub = cy.stub().as("updateUser");

    cy.mount(<UserSettingsForm userProfile={userProfile} updateUser={updateUserStub} />);

    cy.getBySel("user-settings-firstName-input").clear();
    cy.getBySel("user-settings-firstName-input").blur();
    cy.get("#user-settings-firstName-input-helper-text").should(
      "contain",
      "Enter a first name"
    );
    cy.getBySel("user-settings-submit").should("be.disabled");
  });

  it("shows validation error for invalid email", () => {
    const updateUserStub = cy.stub().as("updateUser");

    cy.mount(<UserSettingsForm userProfile={userProfile} updateUser={updateUserStub} />);

    cy.getBySel("user-settings-email-input").clear();
    cy.getBySel("user-settings-email-input").type("not-an-email");
    cy.getBySel("user-settings-email-input").blur();
    cy.get("#user-settings-email-input-helper-text").should(
      "contain",
      "Must contain a valid email address"
    );
    cy.getBySel("user-settings-submit").should("be.disabled");
  });

  it("shows validation error for invalid phone number", () => {
    const updateUserStub = cy.stub().as("updateUser");

    cy.mount(<UserSettingsForm userProfile={userProfile} updateUser={updateUserStub} />);

    cy.getBySel("user-settings-phoneNumber-input").clear();
    cy.getBySel("user-settings-phoneNumber-input").type("abc");
    cy.getBySel("user-settings-phoneNumber-input").blur();
    cy.get("#user-settings-phoneNumber-input-helper-text").should(
      "contain",
      "Phone number is not valid"
    );
    cy.getBySel("user-settings-submit").should("be.disabled");
  });
});
