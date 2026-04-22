import { User } from "../../../src/models";

const apiUrl = Cypress.env("apiUrl");

describe("Auth API", function () {
  beforeEach(function () {
    cy.task("db:seed");
  });

  before(() => {
    cy.request("GET", "/");
  });

  context("POST /login", function () {
    it("logs in with valid credentials", function () {
      cy.database("find", "users").then((user: User) => {
        cy.request("POST", `${apiUrl}/login`, {
          username: user.username,
          password: Cypress.env("defaultPassword"),
        }).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.user).to.have.property("id");
          expect(response.body.user.username).to.eq(user.username);
        });
      });
    });

    it("returns 401 for invalid username", function () {
      cy.request({
        method: "POST",
        url: `${apiUrl}/login`,
        body: { username: "nonexistentUser", password: "s3cret" },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });

    it("returns 401 for invalid password", function () {
      cy.database("find", "users").then((user: User) => {
        cy.request({
          method: "POST",
          url: `${apiUrl}/login`,
          body: { username: user.username, password: "WRONG_PASSWORD" },
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(401);
        });
      });
    });

    it("sets session cookie without expiry when remember is not checked", function () {
      cy.database("find", "users").then((user: User) => {
        cy.request("POST", `${apiUrl}/login`, {
          username: user.username,
          password: Cypress.env("defaultPassword"),
          remember: false,
        }).then(() => {
          cy.getCookie("connect.sid").should("exist");
          cy.getCookie("connect.sid").should("not.have.property", "expiry");
        });
      });
    });

    it("sets session cookie with expiry when remember is checked", function () {
      cy.database("find", "users").then((user: User) => {
        cy.request("POST", `${apiUrl}/login`, {
          username: user.username,
          password: Cypress.env("defaultPassword"),
          remember: true,
        }).then(() => {
          cy.getCookie("connect.sid").should("exist");
          cy.getCookie("connect.sid").should("have.property", "expiry");
        });
      });
    });
  });

  context("POST /logout", function () {
    it("logs out an authenticated user", function () {
      cy.database("find", "users").then((user: User) => {
        cy.loginByApi(user.username);
        cy.request("POST", `${apiUrl}/logout`).then((response) => {
          expect(response.status).to.eq(200);
        });
        cy.request({
          method: "GET",
          url: `${apiUrl}/checkAuth`,
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(401);
        });
      });
    });
  });

  context("GET /checkAuth", function () {
    it("returns 200 with user data when authenticated", function () {
      cy.database("find", "users").then((user: User) => {
        cy.loginByApi(user.username);
        cy.request("GET", `${apiUrl}/checkAuth`).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.user).to.have.property("id");
          expect(response.body.user.username).to.eq(user.username);
        });
      });
    });

    it("returns 401 when not authenticated", function () {
      cy.request({
        method: "GET",
        url: `${apiUrl}/checkAuth`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body).to.have.property("error", "User is unauthorized");
      });
    });
  });

  context("Protected endpoints return 401 when unauthenticated", function () {
    it("GET /users returns 401", function () {
      cy.request({
        method: "GET",
        url: `${apiUrl}/users`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });

    it("GET /transactions returns 401", function () {
      cy.request({
        method: "GET",
        url: `${apiUrl}/transactions`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });

    it("GET /transactions/public returns 401", function () {
      cy.request({
        method: "GET",
        url: `${apiUrl}/transactions/public`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });

    it("POST /transactions returns 401", function () {
      cy.request({
        method: "POST",
        url: `${apiUrl}/transactions`,
        failOnStatusCode: false,
        body: {},
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });

    it("GET /users/search returns 401", function () {
      cy.request({
        method: "GET",
        url: `${apiUrl}/users/search`,
        qs: { q: "test" },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });

    it("PATCH /users/:id returns 401", function () {
      cy.request({
        method: "PATCH",
        url: `${apiUrl}/users/someUserId`,
        failOnStatusCode: false,
        body: { firstName: "Test" },
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });
  });

  context("Authorization - user-scoped access", function () {
    it("GET /users/:userId returns 401 when requesting another user's data", function () {
      cy.database("filter", "users").then((users: User[]) => {
        const authenticatedUser = users[0];
        const otherUser = users[1];

        cy.loginByApi(authenticatedUser.username);
        cy.request({
          method: "GET",
          url: `${apiUrl}/users/${otherUser.id}`,
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(401);
          expect(response.body).to.have.property("error", "Unauthorized");
        });
      });
    });

    it("GET /users/:userId returns 200 for own user data", function () {
      cy.database("find", "users").then((user: User) => {
        cy.loginByApi(user.username);
        cy.request("GET", `${apiUrl}/users/${user.id}`).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.user).to.have.property("id", user.id);
        });
      });
    });
  });
});
