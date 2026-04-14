import "../../support/auth-provider-commands/cognito";
import { isMobile } from "../../support/utils";
const apiGraphQL = `${Cypress.env("apiUrl")}/graphql`;

if (Cypress.env("cognito_username")) {
  // Sign in with AWS
  if (Cypress.env("cognito_programmatic_login")) {
    describe("AWS Cognito, programmatic login (cypress.config.ts#cognito_programmatic_login: true)", function () {
      beforeEach(function () {
        cy.task("db:seed");

        cy.intercept("POST", apiGraphQL).as("createBankAccount");

        cy.loginByCognitoApi(Cypress.env("cognito_username"), Cypress.env("cognito_password"));
      });

      it("should allow a visitor to login, onboard and logout", function () {
        cy.contains("Get Started").should("be.visible");

        // Onboarding
        cy.getBySel("user-onboarding-dialog").should("be.visible");
        cy.getBySel("user-onboarding-next").click();

        cy.getBySel("user-onboarding-dialog-title").should("contain", "Create Bank Account");

        cy.getBySelLike("bankName-input").type("The Best Bank");
        cy.getBySelLike("accountNumber-input").type("123456789");
        cy.getBySelLike("routingNumber-input").type("987654321");
        cy.getBySelLike("submit").click();

        cy.wait("@createBankAccount");

        cy.getBySel("user-onboarding-dialog-title").should("contain", "Finished");
        cy.getBySel("user-onboarding-dialog-content").should("contain", "You're all set!");
        cy.getBySel("user-onboarding-next").click();

        cy.getBySel("transaction-list").should("be.visible");

        // Logout User
        if (isMobile()) {
          cy.getBySel("sidenav-toggle").click();
        }
        cy.getBySel("sidenav-signout").click();

        cy.location("pathname").should("eq", "/");
      });

      it("shows onboarding", function () {
        cy.contains("Get Started").should("be.visible");
      });

      it("should persist auth state in localStorage after login", function () {
        cy.window().its("localStorage").invoke("getItem", "authState").should("exist");
        cy.window()
          .its("localStorage")
          .invoke("getItem", "authState")
          .then((authState) => {
            const parsed = JSON.parse(authState!);
            expect(parsed).to.have.property("value");
          });
      });

      it("should navigate to user settings after login", function () {
        if (isMobile()) {
          cy.getBySel("sidenav-toggle").click();
        }
        cy.getBySel("sidenav-user-settings").click();
        cy.location("pathname").should("contain", "/user/settings");
        cy.getBySel("user-settings-form").should("be.visible");
      });

      it("should navigate to bank accounts after login", function () {
        if (isMobile()) {
          cy.getBySel("sidenav-toggle").click();
        }
        cy.getBySel("sidenav-bankaccounts").click();
        cy.location("pathname").should("contain", "/bankaccounts");
      });

      it("should allow logout during onboarding", function () {
        cy.getBySel("user-onboarding-dialog").should("be.visible");
        cy.getBySel("user-onboarding-logout").click();
        cy.location("pathname").should("eq", "/");
      });
    });
  } else {
    describe("AWS Cognito, cy.origin() login (cypress.config.ts#cognito_programmatic_login: false)", function () {
      beforeEach(function () {
        cy.task("db:seed");
        cy.loginByCognito(Cypress.env("cognito_username"), Cypress.env("cognito_password"));
        cy.visit("/");
      });

      it("shows onboarding", function () {
        cy.contains("Get Started").should("be.visible");
      });

      it("should allow a visitor to login, onboard and logout", function () {
        cy.contains("Get Started").should("be.visible");

        // Onboarding
        cy.getBySel("user-onboarding-dialog").should("be.visible");
        cy.getBySel("user-onboarding-next").click();

        cy.getBySel("user-onboarding-dialog-title").should("contain", "Create Bank Account");

        cy.getBySelLike("bankName-input").type("The Best Bank");
        cy.getBySelLike("accountNumber-input").type("123456789");
        cy.getBySelLike("routingNumber-input").type("987654321");
        cy.getBySelLike("submit").click();

        cy.getBySel("user-onboarding-dialog-title").should("contain", "Finished");
        cy.getBySel("user-onboarding-dialog-content").should("contain", "You're all set!");
        cy.getBySel("user-onboarding-next").click();

        cy.getBySel("transaction-list").should("be.visible");
      });

      it("should persist auth state in localStorage after login", function () {
        cy.window().its("localStorage").invoke("getItem", "authState").should("exist");
      });

      it("should navigate to notifications after login", function () {
        if (isMobile()) {
          cy.getBySel("sidenav-toggle").click();
        }
        cy.getBySel("sidenav-notifications").click();
        cy.location("pathname").should("contain", "/notifications");
      });

      it("should allow logout during onboarding", function () {
        cy.getBySel("user-onboarding-dialog").should("be.visible");
        cy.getBySel("user-onboarding-logout").click();
        cy.location("pathname").should("eq", "/");
      });
    });
  }
}
