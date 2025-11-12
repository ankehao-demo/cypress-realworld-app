import { User } from "../../../src/models";

const apiGraphQL = `${Cypress.env("apiUrl")}/graphql`;

type TestGraphQLErrorCtx = {
  authenticatedUser?: User;
};

describe("GraphQL Error Handling", function () {
  let ctx: TestGraphQLErrorCtx = {};

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

  context("Invalid GraphQL Syntax", function () {
    it("should handle invalid query syntax", function () {
      cy.request({
        method: "POST",
        url: apiGraphQL,
        failOnStatusCode: false,
        body: {
          query: "query { invalid syntax here }",
        },
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 400]);
        if (response.body.errors) {
          expect(response.body.errors).to.be.an("array");
          expect(response.body.errors[0]).to.have.property("message");
        }
      });
    });

    it("should handle malformed query", function () {
      cy.request({
        method: "POST",
        url: apiGraphQL,
        failOnStatusCode: false,
        body: {
          query: "{ listBankAccount {",
        },
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 400]);
        if (response.body.errors) {
          expect(response.body.errors).to.be.an("array");
        }
      });
    });

    it("should handle empty query", function () {
      cy.request({
        method: "POST",
        url: apiGraphQL,
        failOnStatusCode: false,
        body: {
          query: "",
        },
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 400]);
        if (response.body.errors) {
          expect(response.body.errors).to.be.an("array");
        }
      });
    });

    it("should handle missing query field", function () {
      cy.request({
        method: "POST",
        url: apiGraphQL,
        failOnStatusCode: false,
        body: {},
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 400]);
        if (response.body.errors) {
          expect(response.body.errors).to.be.an("array");
        }
      });
    });

    it("should handle query with invalid characters", function () {
      cy.request({
        method: "POST",
        url: apiGraphQL,
        failOnStatusCode: false,
        body: {
          query: "query { listBankAccount @#$%^&* }",
        },
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 400]);
        if (response.body.errors) {
          expect(response.body.errors).to.be.an("array");
        }
      });
    });
  });

  context("Missing Required Fields in Mutations", function () {
    it("should handle createBankAccount mutation with missing bankName", function () {
      cy.request({
        method: "POST",
        url: apiGraphQL,
        failOnStatusCode: false,
        body: {
          query: `
            mutation CreateBankAccount($accountNumber: String!, $routingNumber: String!) {
              createBankAccount(accountNumber: $accountNumber, routingNumber: $routingNumber) {
                id
                bankName
              }
            }
          `,
          variables: {
            accountNumber: "123456789",
            routingNumber: "987654321",
          },
        },
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 400]);
        if (response.body.errors) {
          expect(response.body.errors).to.be.an("array");
          expect(response.body.errors[0].message).to.exist;
        }
      });
    });

    it("should handle createBankAccount mutation with missing accountNumber", function () {
      cy.request({
        method: "POST",
        url: apiGraphQL,
        failOnStatusCode: false,
        body: {
          query: `
            mutation CreateBankAccount($bankName: String!, $routingNumber: String!) {
              createBankAccount(bankName: $bankName, routingNumber: $routingNumber) {
                id
                bankName
              }
            }
          `,
          variables: {
            bankName: "Test Bank",
            routingNumber: "987654321",
          },
        },
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 400]);
        if (response.body.errors) {
          expect(response.body.errors).to.be.an("array");
        }
      });
    });

    it("should handle createBankAccount mutation with missing routingNumber", function () {
      cy.request({
        method: "POST",
        url: apiGraphQL,
        failOnStatusCode: false,
        body: {
          query: `
            mutation CreateBankAccount($bankName: String!, $accountNumber: String!) {
              createBankAccount(bankName: $bankName, accountNumber: $accountNumber) {
                id
                bankName
              }
            }
          `,
          variables: {
            bankName: "Test Bank",
            accountNumber: "123456789",
          },
        },
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 400]);
        if (response.body.errors) {
          expect(response.body.errors).to.be.an("array");
        }
      });
    });

    it("should handle mutation with all fields missing", function () {
      cy.request({
        method: "POST",
        url: apiGraphQL,
        failOnStatusCode: false,
        body: {
          query: `
            mutation CreateBankAccount {
              createBankAccount {
                id
              }
            }
          `,
        },
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 400]);
        if (response.body.errors) {
          expect(response.body.errors).to.be.an("array");
        }
      });
    });
  });

  context("Invalid Field Types", function () {
    it("should handle createBankAccount with invalid bankName type", function () {
      cy.request({
        method: "POST",
        url: apiGraphQL,
        failOnStatusCode: false,
        body: {
          query: `
            mutation CreateBankAccount($bankName: String!, $accountNumber: String!, $routingNumber: String!) {
              createBankAccount(bankName: $bankName, accountNumber: $accountNumber, routingNumber: $routingNumber) {
                id
                bankName
              }
            }
          `,
          variables: {
            bankName: 123,
            accountNumber: "123456789",
            routingNumber: "987654321",
          },
        },
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 400]);
        if (response.body.errors) {
          expect(response.body.errors).to.be.an("array");
        }
      });
    });

    it("should handle createBankAccount with null values", function () {
      cy.request({
        method: "POST",
        url: apiGraphQL,
        failOnStatusCode: false,
        body: {
          query: `
            mutation CreateBankAccount($bankName: String!, $accountNumber: String!, $routingNumber: String!) {
              createBankAccount(bankName: $bankName, accountNumber: $accountNumber, routingNumber: $routingNumber) {
                id
                bankName
              }
            }
          `,
          variables: {
            bankName: null,
            accountNumber: null,
            routingNumber: null,
          },
        },
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 400]);
        if (response.body.errors) {
          expect(response.body.errors).to.be.an("array");
        }
      });
    });

    it("should handle createBankAccount with array instead of string", function () {
      cy.request({
        method: "POST",
        url: apiGraphQL,
        failOnStatusCode: false,
        body: {
          query: `
            mutation CreateBankAccount($bankName: String!, $accountNumber: String!, $routingNumber: String!) {
              createBankAccount(bankName: $bankName, accountNumber: $accountNumber, routingNumber: $routingNumber) {
                id
                bankName
              }
            }
          `,
          variables: {
            bankName: ["Test", "Bank"],
            accountNumber: "123456789",
            routingNumber: "987654321",
          },
        },
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 400]);
        if (response.body.errors) {
          expect(response.body.errors).to.be.an("array");
        }
      });
    });

    it("should handle createBankAccount with object instead of string", function () {
      cy.request({
        method: "POST",
        url: apiGraphQL,
        failOnStatusCode: false,
        body: {
          query: `
            mutation CreateBankAccount($bankName: String!, $accountNumber: String!, $routingNumber: String!) {
              createBankAccount(bankName: $bankName, accountNumber: $accountNumber, routingNumber: $routingNumber) {
                id
                bankName
              }
            }
          `,
          variables: {
            bankName: { name: "Test Bank" },
            accountNumber: "123456789",
            routingNumber: "987654321",
          },
        },
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 400]);
        if (response.body.errors) {
          expect(response.body.errors).to.be.an("array");
        }
      });
    });
  });

  context("Non-existent Fields and Operations", function () {
    it("should handle query for non-existent field", function () {
      cy.request({
        method: "POST",
        url: apiGraphQL,
        failOnStatusCode: false,
        body: {
          query: `
            query {
              listBankAccount {
                id
                nonExistentField
              }
            }
          `,
        },
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 400]);
        if (response.body.errors) {
          expect(response.body.errors).to.be.an("array");
        }
      });
    });

    it("should handle non-existent operation", function () {
      cy.request({
        method: "POST",
        url: apiGraphQL,
        failOnStatusCode: false,
        body: {
          query: `
            query {
              nonExistentOperation {
                id
              }
            }
          `,
        },
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 400]);
        if (response.body.errors) {
          expect(response.body.errors).to.be.an("array");
        }
      });
    });

    it("should handle non-existent mutation", function () {
      cy.request({
        method: "POST",
        url: apiGraphQL,
        failOnStatusCode: false,
        body: {
          query: `
            mutation {
              nonExistentMutation(input: "test") {
                id
              }
            }
          `,
        },
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 400]);
        if (response.body.errors) {
          expect(response.body.errors).to.be.an("array");
        }
      });
    });
  });

  context("Authorization Failures", function () {
    it("should handle GraphQL request without authentication", function () {
      cy.clearCookies();

      cy.request({
        method: "POST",
        url: apiGraphQL,
        failOnStatusCode: false,
        body: {
          query: `
            query {
              listBankAccount {
                id
                bankName
              }
            }
          `,
        },
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 401, 403]);
        if (response.status === 200 && response.body.errors) {
          expect(response.body.errors).to.be.an("array");
        }
      });
    });

    it("should handle createBankAccount mutation without authentication", function () {
      cy.clearCookies();

      cy.request({
        method: "POST",
        url: apiGraphQL,
        failOnStatusCode: false,
        body: {
          query: `
            mutation CreateBankAccount($bankName: String!, $accountNumber: String!, $routingNumber: String!) {
              createBankAccount(bankName: $bankName, accountNumber: $accountNumber, routingNumber: $routingNumber) {
                id
                bankName
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
        expect(response.status).to.be.oneOf([200, 401, 403]);
        if (response.status === 200 && response.body.errors) {
          expect(response.body.errors).to.be.an("array");
        }
      });
    });

    it("should handle deleteBankAccount mutation without authentication", function () {
      cy.clearCookies();

      cy.request({
        method: "POST",
        url: apiGraphQL,
        failOnStatusCode: false,
        body: {
          query: `
            mutation DeleteBankAccount($id: ID!) {
              deleteBankAccount(id: $id)
            }
          `,
          variables: {
            id: "test-id",
          },
        },
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 401, 403]);
        if (response.status === 200 && response.body.errors) {
          expect(response.body.errors).to.be.an("array");
        }
      });
    });
  });

  context("Malformed Requests", function () {
    it("should handle request with invalid JSON", function () {
      cy.request({
        method: "POST",
        url: apiGraphQL,
        failOnStatusCode: false,
        headers: {
          "Content-Type": "application/json",
        },
        body: "{ invalid json }",
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 400, 500]);
      });
    });

    it("should handle request with missing Content-Type", function () {
      cy.request({
        method: "POST",
        url: apiGraphQL,
        failOnStatusCode: false,
        headers: {
          "Content-Type": "text/plain",
        },
        body: JSON.stringify({
          query: "query { listBankAccount { id } }",
        }),
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 400, 415]);
      });
    });

    it("should handle extremely large query", function () {
      const largeQuery = `query { listBankAccount { ${"id ".repeat(10000)} } }`;

      cy.request({
        method: "POST",
        url: apiGraphQL,
        failOnStatusCode: false,
        body: {
          query: largeQuery,
        },
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 400, 413, 500]);
      });
    });

    it("should handle deeply nested query", function () {
      let nestedQuery = "query { listBankAccount { id";
      for (let i = 0; i < 100; i++) {
        nestedQuery += " bankName";
      }
      nestedQuery += " } }";

      cy.request({
        method: "POST",
        url: apiGraphQL,
        failOnStatusCode: false,
        body: {
          query: nestedQuery,
        },
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 400, 500]);
      });
    });
  });

  context("SQL Injection Attempts via GraphQL", function () {
    it("should handle SQL injection in bankName variable", function () {
      cy.request({
        method: "POST",
        url: apiGraphQL,
        failOnStatusCode: false,
        body: {
          query: `
            mutation CreateBankAccount($bankName: String!, $accountNumber: String!, $routingNumber: String!) {
              createBankAccount(bankName: $bankName, accountNumber: $accountNumber, routingNumber: $routingNumber) {
                id
                bankName
              }
            }
          `,
          variables: {
            bankName: "'; DROP TABLE bankaccounts--",
            accountNumber: "123456789",
            routingNumber: "987654321",
          },
        },
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 400]);
        if (response.status === 200) {
          expect(response.body).to.not.have.property("errors");
        }
      });
    });

    it("should handle SQL injection in accountNumber variable", function () {
      cy.request({
        method: "POST",
        url: apiGraphQL,
        failOnStatusCode: false,
        body: {
          query: `
            mutation CreateBankAccount($bankName: String!, $accountNumber: String!, $routingNumber: String!) {
              createBankAccount(bankName: $bankName, accountNumber: $accountNumber, routingNumber: $routingNumber) {
                id
                bankName
              }
            }
          `,
          variables: {
            bankName: "Test Bank",
            accountNumber: "' OR '1'='1",
            routingNumber: "987654321",
          },
        },
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 400]);
        if (response.status === 200) {
          expect(response.body).to.not.have.property("errors");
        }
      });
    });
  });
});
