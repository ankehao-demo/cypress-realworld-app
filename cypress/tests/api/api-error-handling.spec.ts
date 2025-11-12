import { User } from "../../../src/models";

const apiUrl = Cypress.env("apiUrl");

type TestErrorHandlingCtx = {
  authenticatedUser?: User;
};

describe("API Error Handling", function () {
  let ctx: TestErrorHandlingCtx = {};

  before(() => {
    cy.request("GET", "/");
  });

  beforeEach(function () {
    cy.task("db:seed");

    cy.database("filter", "users").then((users: User[]) => {
      ctx.authenticatedUser = users[0];
      return cy.loginByApi(ctx.authenticatedUser.username);
    });
  });

  context("Network Error Handling", function () {
    it("should handle 500 server error gracefully", function () {
      cy.intercept("GET", `${apiUrl}/transactions*`, {
        statusCode: 500,
        body: { error: "Internal Server Error" },
      }).as("serverError");

      cy.request({
        method: "GET",
        url: `${apiUrl}/transactions`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(500);
        expect(response.body).to.have.property("error");
      });
    });

    it("should handle 503 service unavailable error", function () {
      cy.intercept("GET", `${apiUrl}/users*`, {
        statusCode: 503,
        body: { error: "Service Unavailable" },
      }).as("serviceUnavailable");

      cy.request({
        method: "GET",
        url: `${apiUrl}/users`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(503);
        expect(response.body).to.have.property("error");
      });
    });

    it("should handle network timeout", function () {
      cy.intercept("GET", `${apiUrl}/transactions*`, (req) => {
        req.reply({
          delay: 30000,
          statusCode: 408,
          body: { error: "Request Timeout" },
        });
      }).as("timeout");

      cy.request({
        method: "GET",
        url: `${apiUrl}/transactions`,
        timeout: 5000,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(408);
      });
    });

    it("should handle malformed JSON response", function () {
      cy.intercept("GET", `${apiUrl}/users*`, {
        statusCode: 200,
        body: "{ invalid json }",
      }).as("malformedJson");

      cy.request({
        method: "GET",
        url: `${apiUrl}/users`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(200);
      });
    });

    it("should handle empty response body", function () {
      cy.intercept("GET", `${apiUrl}/users*`, {
        statusCode: 200,
        body: null,
      }).as("emptyResponse");

      cy.request({
        method: "GET",
        url: `${apiUrl}/users`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(200);
      });
    });

    it("should handle connection refused", function () {
      cy.request({
        method: "GET",
        url: "http://localhost:9999/nonexistent",
        failOnStatusCode: false,
        retryOnNetworkFailure: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([0, 502, 503, 504]);
      });
    });
  });

  context("Form Submission Error Handling", function () {
    it("should handle 500 error during user creation", function () {
      cy.intercept("POST", `${apiUrl}/users`, {
        statusCode: 500,
        body: { error: "Internal Server Error" },
      }).as("createUserError");

      cy.request({
        method: "POST",
        url: `${apiUrl}/users`,
        failOnStatusCode: false,
        body: {
          firstName: "Test",
          lastName: "User",
          username: "testuser",
          password: "password",
          email: "test@example.com",
          phoneNumber: "555-123-4567",
        },
      }).then((response) => {
        expect(response.status).to.eq(500);
        expect(response.body).to.have.property("error");
      });
    });

    it("should handle 500 error during transaction creation", function () {
      cy.intercept("POST", `${apiUrl}/transactions`, {
        statusCode: 500,
        body: { error: "Internal Server Error" },
      }).as("createTransactionError");

      cy.database("filter", "users").then((users: User[]) => {
        cy.request({
          method: "POST",
          url: `${apiUrl}/transactions`,
          failOnStatusCode: false,
          body: {
            transactionType: "payment",
            source: users[0].id,
            senderId: users[0].id,
            receiverId: users[1].id,
            amount: 100,
            description: "Test payment",
            status: "pending",
          },
        }).then((response) => {
          expect(response.status).to.eq(500);
          expect(response.body).to.have.property("error");
        });
      });
    });

    it("should handle 500 error during bank account creation", function () {
      cy.intercept("POST", `${apiUrl}/graphql`, {
        statusCode: 500,
        body: { error: "Internal Server Error" },
      }).as("createBankAccountError");

      cy.request({
        method: "POST",
        url: `${apiUrl}/graphql`,
        failOnStatusCode: false,
        body: {
          query: `
            mutation CreateBankAccount($bankName: String!, $accountNumber: String!, $routingNumber: String!) {
              createBankAccount(bankName: $bankName, accountNumber: $accountNumber, routingNumber: $routingNumber) {
                id
              }
            }
          `,
          variables: {
            bankName: "Test Bank",
            accountNumber: "123456789",
            routingNumber: "987654321",
          },
        },
      }).then((response) => {
        expect(response.status).to.eq(500);
        expect(response.body).to.have.property("error");
      });
    });
  });

  context("Partial Failure Handling", function () {
    it("should handle partial success in bulk operations", function () {
      cy.database("filter", "notifications").then((notifications: any[]) => {
        const notificationIds = notifications.slice(0, 5).map((n) => n.id);

        cy.intercept("PATCH", `${apiUrl}/notifications*`, (req) => {
          req.reply({
            statusCode: 207,
            body: {
              results: [
                { id: notificationIds[0], success: true },
                { id: notificationIds[1], success: false, error: "Not found" },
                { id: notificationIds[2], success: true },
                { id: notificationIds[3], success: false, error: "Permission denied" },
                { id: notificationIds[4], success: true },
              ],
            },
          });
        }).as("bulkUpdate");

        cy.request({
          method: "PATCH",
          url: `${apiUrl}/notifications`,
          failOnStatusCode: false,
          body: {
            ids: notificationIds,
            isRead: true,
          },
        }).then((response) => {
          expect(response.status).to.eq(207);
          expect(response.body.results).to.have.length(5);
          expect(response.body.results.filter((r: any) => r.success)).to.have.length(3);
          expect(response.body.results.filter((r: any) => !r.success)).to.have.length(2);
        });
      });
    });

    it("should handle complete failure in bulk operations", function () {
      cy.intercept("PATCH", `${apiUrl}/notifications*`, {
        statusCode: 500,
        body: { error: "Bulk operation failed" },
      }).as("bulkUpdateFailure");

      cy.request({
        method: "PATCH",
        url: `${apiUrl}/notifications`,
        failOnStatusCode: false,
        body: {
          ids: ["id1", "id2", "id3"],
          isRead: true,
        },
      }).then((response) => {
        expect(response.status).to.eq(500);
        expect(response.body).to.have.property("error");
      });
    });
  });

  context("Rate Limiting and Throttling", function () {
    it("should handle 429 Too Many Requests error", function () {
      cy.intercept("GET", `${apiUrl}/transactions*`, {
        statusCode: 429,
        headers: {
          "Retry-After": "60",
        },
        body: { error: "Too Many Requests" },
      }).as("rateLimited");

      cy.request({
        method: "GET",
        url: `${apiUrl}/transactions`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(429);
        expect(response.headers).to.have.property("retry-after");
        expect(response.body).to.have.property("error");
      });
    });

    it("should handle rapid successive API calls", function () {
      const requests = Array.from({ length: 10 }, (_, i) => {
        return cy.request({
          method: "GET",
          url: `${apiUrl}/users`,
          failOnStatusCode: false,
        });
      });

      cy.wrap(Promise.all(requests)).then((responses: any[]) => {
        responses.forEach((response) => {
          expect(response.status).to.be.oneOf([200, 429]);
        });
      });
    });
  });

  context("Concurrent Request Handling", function () {
    it("should handle concurrent POST requests", function () {
      cy.database("filter", "users").then((users: User[]) => {
        const requests = Array.from({ length: 5 }, (_, i) => {
          return cy.request({
            method: "POST",
            url: `${apiUrl}/transactions`,
            failOnStatusCode: false,
            body: {
              transactionType: "payment",
              source: users[0].id,
              senderId: users[0].id,
              receiverId: users[1].id,
              amount: 10 + i,
              description: `Concurrent payment ${i}`,
              status: "pending",
            },
          });
        });

        cy.wrap(Promise.all(requests)).then((responses: any[]) => {
          responses.forEach((response) => {
            expect(response.status).to.be.oneOf([200, 201, 500, 503]);
          });
        });
      });
    });

    it("should handle concurrent GET requests", function () {
      const requests = Array.from({ length: 10 }, () => {
        return cy.request({
          method: "GET",
          url: `${apiUrl}/transactions`,
          failOnStatusCode: false,
        });
      });

      cy.wrap(Promise.all(requests)).then((responses: any[]) => {
        responses.forEach((response) => {
          expect(response.status).to.be.oneOf([200, 429, 500, 503]);
        });
      });
    });
  });

  context("Invalid Data Handling", function () {
    it("should handle invalid JSON in request body", function () {
      cy.request({
        method: "POST",
        url: `${apiUrl}/users`,
        failOnStatusCode: false,
        headers: {
          "Content-Type": "application/json",
        },
        body: "{ invalid json }",
      }).then((response) => {
        expect(response.status).to.be.oneOf([400, 422, 500]);
      });
    });

    it("should handle missing required fields", function () {
      cy.request({
        method: "POST",
        url: `${apiUrl}/users`,
        failOnStatusCode: false,
        body: {
          firstName: "Test",
        },
      }).then((response) => {
        expect(response.status).to.eq(422);
        expect(response.body.errors).to.be.an("array");
      });
    });

    it("should handle invalid field types", function () {
      cy.request({
        method: "POST",
        url: `${apiUrl}/users`,
        failOnStatusCode: false,
        body: {
          firstName: 123,
          lastName: true,
          username: null,
          password: [],
          email: {},
          phoneNumber: 555,
        },
      }).then((response) => {
        expect(response.status).to.eq(422);
        expect(response.body.errors).to.be.an("array");
      });
    });
  });
});
