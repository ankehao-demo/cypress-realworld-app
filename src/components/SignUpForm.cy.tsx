import { interpret } from "xstate";
import { MemoryRouter } from "react-router-dom";
import SignUpForm from "./SignUpForm";
import { authMachine } from "../machines/authMachine";

describe("SignUpForm", () => {
  let authService;
  beforeEach(() => {
    authService = interpret(authMachine);
    authService.start();

    expect(authService.state.value).to.equal("unauthorized");
    cy.intercept("POST", "http://localhost:3001/users", {
      user: {
        id: "t45AiwidW",
        uuid: "6383f84e-b511-44c5-a835-3ece1d781fa8",
        firstName: "Edgar",
        lastName: "Johns",
        username: "Katharina_Bernier",
        password: "$2a$10$5PXHGtcsckWtAprT5/JmluhR13f16BL8SIGhvAKNP.Dhxkt69FfzW",
        email: "Norene39@yahoo.com",
        phoneNumber: "625-316-9882",
        avatar: "https://cypress-realworld-app-svgs.s3.amazonaws.com/t45AiwidW.svg",
        defaultPrivacyLevel: "public",
        balance: 168137,
        createdAt: "2019-08-27T23:47:05.637Z",
        modifiedAt: "2020-05-21T11:02:22.857Z",
      },
    }).as("signupPost");
  });

  it("should mount and display the sign up form", () => {
    cy.mount(
      <MemoryRouter>
        <SignUpForm authService={authService} />
      </MemoryRouter>
    );
    cy.getBySel("signup-title").should("be.visible").and("contain", "Sign Up");
    cy.getBySel("signup-first-name").should("be.visible");
    cy.getBySel("signup-last-name").should("be.visible");
    cy.getBySel("signup-username").should("be.visible");
    cy.getBySel("signup-password").should("be.visible");
    cy.getBySel("signup-confirmPassword").should("be.visible");
    cy.getBySel("signup-submit").should("be.visible").and("be.disabled");
  });

  it("should require all fields to enable submit button", () => {
    cy.mount(
      <MemoryRouter>
        <SignUpForm authService={authService} />
      </MemoryRouter>
    );
    cy.getBySel("signup-submit").should("be.disabled");

    cy.getBySel("signup-first-name").type("Edgar");
    cy.getBySel("signup-last-name").type("Johns");
    cy.getBySel("signup-username").type("Katharina_Bernier");
    cy.getBySel("signup-password").type("s3cret");
    cy.getBySel("signup-confirmPassword").type("s3cret");
    cy.getBySel("signup-submit").should("be.enabled");
  });

  it("should show error when passwords do not match", () => {
    cy.mount(
      <MemoryRouter>
        <SignUpForm authService={authService} />
      </MemoryRouter>
    );

    cy.getBySel("signup-password").type("s3cret");
    cy.getBySel("signup-confirmPassword").type("different");
    cy.getBySel("signup-first-name").click();
    cy.contains("Password does not match").should("be.visible");
  });

  it("should show error for short password", () => {
    cy.mount(
      <MemoryRouter>
        <SignUpForm authService={authService} />
      </MemoryRouter>
    );

    cy.getBySel("signup-password").type("abc");
    cy.getBySel("signup-first-name").click();
    cy.contains("Password must contain at least 4 characters").should("be.visible");
  });

  it("should contain a link to the sign in page", () => {
    cy.mount(
      <MemoryRouter>
        <SignUpForm authService={authService} />
      </MemoryRouter>
    );

    cy.contains("Have an account? Sign In")
      .should("be.visible")
      .and("have.attr", "href", "/signin");
  });
});
