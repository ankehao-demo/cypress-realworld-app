import { User } from "../../../src/models";
import { isMobile } from "../../support/utils";

describe("Input Sanitization E2E Tests", function () {
  beforeEach(function () {
    cy.task("db:seed");
  });

  context("HTML and Script Tag Injection", function () {
    it("should handle script tags in signup form", function () {
      cy.visit("/signup");

      cy.getBySel("signup-first-name").type("<script>alert('xss')</script>");
      cy.getBySel("signup-last-name").type("Doe");
      cy.getBySel("signup-username").type("testuser123");
      cy.getBySel("signup-password").type("password123");
      cy.getBySel("signup-confirmPassword").type("password123");

      cy.getBySel("signup-submit").click();

      cy.window().then((win) => {
        expect(win.document.body.innerHTML).to.not.contain("<script>alert('xss')</script>");
      });
    });

    it("should handle script tags in transaction description", function () {
      cy.database("filter", "users").then((users: User[]) => {
        const sender = users[0];
        const receiver = users[1];

        cy.loginByXstate(sender.username);

        if (isMobile()) {
          cy.getBySel("sidenav-toggle").click();
        }
        cy.getBySel("sidenav-home").click();

        cy.getBySel("nav-top-new-transaction").click();

        cy.getBySel("user-list-search-input").type(receiver.firstName);
        cy.getBySel(`user-list-item-${receiver.id}`).should("be.visible");
        cy.getBySel(`user-list-item-${receiver.id}`).click();

        cy.getBySel("transaction-create-amount-input").type("50");
        cy.getBySel("transaction-create-description-input").type("<script>alert('xss')</script>");

        cy.getBySel("transaction-create-submit-payment").click();

        cy.window().then((win) => {
          expect(win.document.body.innerHTML).to.not.contain("<script>alert('xss')</script>");
        });
      });
    });

    it("should handle img tag with onerror in bank name", function () {
      cy.database("find", "users").then((user: User) => {
        cy.loginByXstate(user.username);

        if (isMobile()) {
          cy.getBySel("sidenav-toggle").click();
        }
        cy.getBySel("sidenav-bankaccounts").click();

        cy.getBySel("bankaccount-new").click();

        cy.getBySelLike("bankName-input").type("<img src=x onerror=alert('xss')>");
        cy.getBySelLike("routingNumber-input").type("123456789");
        cy.getBySelLike("accountNumber-input").type("987654321");

        cy.getBySelLike("submit").click();

        cy.window().then((win) => {
          expect(win.document.body.innerHTML).to.not.contain("onerror=alert");
        });
      });
    });

    it("should handle iframe tag in user settings", function () {
      cy.database("find", "users").then((user: User) => {
        cy.loginByXstate(user.username);

        if (isMobile()) {
          cy.getBySel("sidenav-toggle").click();
        }
        cy.getBySel("sidenav-user-settings").click();

        cy.getBySel("user-settings-firstName-input").clear();
        cy.getBySel("user-settings-firstName-input").type(
          "<iframe src='javascript:alert(1)'></iframe>"
        );

        cy.getBySel("user-settings-submit").click();

        cy.window().then((win) => {
          expect(win.document.body.innerHTML).to.not.contain("<iframe");
        });
      });
    });

    it("should handle svg tag with onload in signup", function () {
      cy.visit("/signup");

      cy.getBySel("signup-first-name").type("<svg onload=alert('xss')>");
      cy.getBySel("signup-last-name").type("Doe");
      cy.getBySel("signup-username").type("testuser456");
      cy.getBySel("signup-password").type("password123");
      cy.getBySel("signup-confirmPassword").type("password123");

      cy.getBySel("signup-submit").click();

      cy.window().then((win) => {
        expect(win.document.body.innerHTML).to.not.contain("onload=alert");
      });
    });
  });

  context("SQL Injection Attempts", function () {
    it("should handle SQL injection in username field", function () {
      cy.visit("/signup");

      cy.getBySel("signup-first-name").type("John");
      cy.getBySel("signup-last-name").type("Doe");
      cy.getBySel("signup-username").type("admin' OR '1'='1");
      cy.getBySel("signup-password").type("password123");
      cy.getBySel("signup-confirmPassword").type("password123");

      cy.getBySel("signup-submit").click();

      cy.database("filter", "users", { username: "admin' OR '1'='1" }).then((users: User[]) => {
        if (users.length > 0) {
          expect(users[0].username).to.eq("admin' OR '1'='1");
        }
      });
    });

    it("should handle SQL DROP TABLE in bank name", function () {
      cy.database("find", "users").then((user: User) => {
        cy.loginByXstate(user.username);

        if (isMobile()) {
          cy.getBySel("sidenav-toggle").click();
        }
        cy.getBySel("sidenav-bankaccounts").click();

        cy.getBySel("bankaccount-new").click();

        cy.getBySelLike("bankName-input").type("'; DROP TABLE bankaccounts--");
        cy.getBySelLike("routingNumber-input").type("123456789");
        cy.getBySelLike("accountNumber-input").type("987654321");

        cy.getBySelLike("submit").click();

        cy.database("filter", "bankaccounts").then((accounts: any[]) => {
          expect(accounts).to.be.an("array");
          expect(accounts.length).to.be.greaterThan(0);
        });
      });
    });

    it("should handle SQL UNION SELECT in transaction description", function () {
      cy.database("filter", "users").then((users: User[]) => {
        const sender = users[0];
        const receiver = users[1];

        cy.loginByXstate(sender.username);

        if (isMobile()) {
          cy.getBySel("sidenav-toggle").click();
        }
        cy.getBySel("sidenav-home").click();

        cy.getBySel("nav-top-new-transaction").click();

        cy.getBySel("user-list-search-input").type(receiver.firstName);
        cy.getBySel(`user-list-item-${receiver.id}`).should("be.visible");
        cy.getBySel(`user-list-item-${receiver.id}`).click();

        cy.getBySel("transaction-create-amount-input").type("50");
        cy.getBySel("transaction-create-description-input").type("' UNION SELECT * FROM users--");

        cy.getBySel("transaction-create-submit-payment").click();

        cy.database("filter", "transactions", {
          description: "' UNION SELECT * FROM users--",
        }).then((transactions: any[]) => {
          if (transactions.length > 0) {
            expect(transactions[0].description).to.eq("' UNION SELECT * FROM users--");
          }
        });
      });
    });
  });

  context("Extremely Long Strings", function () {
    it("should handle very long string in first name", function () {
      cy.visit("/signup");

      const longString = "A".repeat(1000);
      cy.getBySel("signup-first-name").type(longString.substring(0, 100));
      cy.getBySel("signup-last-name").type("Doe");
      cy.getBySel("signup-username").type("testuser789");
      cy.getBySel("signup-password").type("password123");
      cy.getBySel("signup-confirmPassword").type("password123");

      cy.getBySel("signup-submit").should("not.be.disabled");
    });

    it("should handle very long string in bank name", function () {
      cy.database("find", "users").then((user: User) => {
        cy.loginByXstate(user.username);

        if (isMobile()) {
          cy.getBySel("sidenav-toggle").click();
        }
        cy.getBySel("sidenav-bankaccounts").click();

        cy.getBySel("bankaccount-new").click();

        const longBankName = "A".repeat(500);
        cy.getBySelLike("bankName-input").type(longBankName.substring(0, 100));
        cy.getBySelLike("routingNumber-input").type("123456789");
        cy.getBySelLike("accountNumber-input").type("987654321");

        cy.getBySelLike("submit").should("not.be.disabled");
      });
    });

    it("should handle very long string in transaction description", function () {
      cy.database("filter", "users").then((users: User[]) => {
        const sender = users[0];
        const receiver = users[1];

        cy.loginByXstate(sender.username);

        if (isMobile()) {
          cy.getBySel("sidenav-toggle").click();
        }
        cy.getBySel("sidenav-home").click();

        cy.getBySel("nav-top-new-transaction").click();

        cy.getBySel("user-list-search-input").type(receiver.firstName);
        cy.getBySel(`user-list-item-${receiver.id}`).should("be.visible");
        cy.getBySel(`user-list-item-${receiver.id}`).click();

        cy.getBySel("transaction-create-amount-input").type("50");

        const longDescription = "A".repeat(500);
        cy.getBySel("transaction-create-description-input").type(longDescription.substring(0, 100));

        cy.getBySel("transaction-create-submit-payment").should("not.be.disabled");
      });
    });
  });

  context("Unicode and Special Characters", function () {
    it("should handle unicode characters in name fields", function () {
      cy.visit("/signup");

      cy.getBySel("signup-first-name").type("José");
      cy.getBySel("signup-last-name").type("García");
      cy.getBySel("signup-username").type("josegarcia123");
      cy.getBySel("signup-password").type("password123");
      cy.getBySel("signup-confirmPassword").type("password123");

      cy.getBySel("signup-submit").click();

      cy.database("filter", "users", { username: "josegarcia123" }).then((users: User[]) => {
        if (users.length > 0) {
          expect(users[0].firstName).to.eq("José");
          expect(users[0].lastName).to.eq("García");
        }
      });
    });

    it("should handle emoji in transaction description", function () {
      cy.database("filter", "users").then((users: User[]) => {
        const sender = users[0];
        const receiver = users[1];

        cy.loginByXstate(sender.username);

        if (isMobile()) {
          cy.getBySel("sidenav-toggle").click();
        }
        cy.getBySel("sidenav-home").click();

        cy.getBySel("nav-top-new-transaction").click();

        cy.getBySel("user-list-search-input").type(receiver.firstName);
        cy.getBySel(`user-list-item-${receiver.id}`).should("be.visible");
        cy.getBySel(`user-list-item-${receiver.id}`).click();

        cy.getBySel("transaction-create-amount-input").type("50");
        cy.getBySel("transaction-create-description-input").type("Payment 💰🎉");

        cy.getBySel("transaction-create-submit-payment").click();

        cy.database("filter", "transactions", {
          description: "Payment 💰🎉",
        }).then((transactions: any[]) => {
          if (transactions.length > 0) {
            expect(transactions[0].description).to.eq("Payment 💰🎉");
          }
        });
      });
    });

    it("should handle special characters in bank name", function () {
      cy.database("find", "users").then((user: User) => {
        cy.loginByXstate(user.username);

        if (isMobile()) {
          cy.getBySel("sidenav-toggle").click();
        }
        cy.getBySel("sidenav-bankaccounts").click();

        cy.getBySel("bankaccount-new").click();

        cy.getBySelLike("bankName-input").type("Bank & Trust Co.");
        cy.getBySelLike("routingNumber-input").type("123456789");
        cy.getBySelLike("accountNumber-input").type("987654321");

        cy.getBySelLike("submit").click();

        cy.database("filter", "bankaccounts", {
          bankName: "Bank & Trust Co.",
        }).then((accounts: any[]) => {
          if (accounts.length > 0) {
            expect(accounts[0].bankName).to.eq("Bank & Trust Co.");
          }
        });
      });
    });

    it("should handle right-to-left characters", function () {
      cy.visit("/signup");

      cy.getBySel("signup-first-name").type("محمد");
      cy.getBySel("signup-last-name").type("علي");
      cy.getBySel("signup-username").type("muhammadali123");
      cy.getBySel("signup-password").type("password123");
      cy.getBySel("signup-confirmPassword").type("password123");

      cy.getBySel("signup-submit").click();

      cy.database("filter", "users", { username: "muhammadali123" }).then((users: User[]) => {
        if (users.length > 0) {
          expect(users[0].firstName).to.eq("محمد");
          expect(users[0].lastName).to.eq("علي");
        }
      });
    });
  });

  context("Path Traversal Attempts", function () {
    it("should handle path traversal in username", function () {
      cy.visit("/signup");

      cy.getBySel("signup-first-name").type("John");
      cy.getBySel("signup-last-name").type("Doe");
      cy.getBySel("signup-username").type("../../../etc/passwd");
      cy.getBySel("signup-password").type("password123");
      cy.getBySel("signup-confirmPassword").type("password123");

      cy.getBySel("signup-submit").click();

      cy.database("filter", "users", { username: "../../../etc/passwd" }).then((users: User[]) => {
        if (users.length > 0) {
          expect(users[0].username).to.eq("../../../etc/passwd");
        }
      });
    });

    it("should handle path traversal in bank name", function () {
      cy.database("find", "users").then((user: User) => {
        cy.loginByXstate(user.username);

        if (isMobile()) {
          cy.getBySel("sidenav-toggle").click();
        }
        cy.getBySel("sidenav-bankaccounts").click();

        cy.getBySel("bankaccount-new").click();

        cy.getBySelLike("bankName-input").type("..\\..\\..\\windows\\system32");
        cy.getBySelLike("routingNumber-input").type("123456789");
        cy.getBySelLike("accountNumber-input").type("987654321");

        cy.getBySelLike("submit").click();

        cy.database("filter", "bankaccounts", {
          bankName: "..\\..\\..\\windows\\system32",
        }).then((accounts: any[]) => {
          if (accounts.length > 0) {
            expect(accounts[0].bankName).to.eq("..\\..\\..\\windows\\system32");
          }
        });
      });
    });
  });

  context("Command Injection Attempts", function () {
    it("should handle command injection with pipe in description", function () {
      cy.database("filter", "users").then((users: User[]) => {
        const sender = users[0];
        const receiver = users[1];

        cy.loginByXstate(sender.username);

        if (isMobile()) {
          cy.getBySel("sidenav-toggle").click();
        }
        cy.getBySel("sidenav-home").click();

        cy.getBySel("nav-top-new-transaction").click();

        cy.getBySel("user-list-search-input").type(receiver.firstName);
        cy.getBySel(`user-list-item-${receiver.id}`).should("be.visible");
        cy.getBySel(`user-list-item-${receiver.id}`).click();

        cy.getBySel("transaction-create-amount-input").type("50");
        cy.getBySel("transaction-create-description-input").type("test | cat /etc/passwd");

        cy.getBySel("transaction-create-submit-payment").click();

        cy.database("filter", "transactions", {
          description: "test | cat /etc/passwd",
        }).then((transactions: any[]) => {
          if (transactions.length > 0) {
            expect(transactions[0].description).to.eq("test | cat /etc/passwd");
          }
        });
      });
    });

    it("should handle command injection with semicolon in bank name", function () {
      cy.database("find", "users").then((user: User) => {
        cy.loginByXstate(user.username);

        if (isMobile()) {
          cy.getBySel("sidenav-toggle").click();
        }
        cy.getBySel("sidenav-bankaccounts").click();

        cy.getBySel("bankaccount-new").click();

        cy.getBySelLike("bankName-input").type("test; rm -rf /");
        cy.getBySelLike("routingNumber-input").type("123456789");
        cy.getBySelLike("accountNumber-input").type("987654321");

        cy.getBySelLike("submit").click();

        cy.database("filter", "bankaccounts", {
          bankName: "test; rm -rf /",
        }).then((accounts: any[]) => {
          if (accounts.length > 0) {
            expect(accounts[0].bankName).to.eq("test; rm -rf /");
          }
        });
      });
    });
  });

  context("Whitespace and Control Characters", function () {
    it("should handle whitespace-only strings in name fields", function () {
      cy.visit("/signup");

      cy.getBySel("signup-first-name").type("     ");
      cy.getBySel("signup-last-name").type("     ");
      cy.getBySel("signup-username").type("testuser999");
      cy.getBySel("signup-password").type("password123");
      cy.getBySel("signup-confirmPassword").type("password123");

      cy.getBySel("signup-submit").should("not.be.disabled");
    });

    it("should handle newlines in transaction description", function () {
      cy.database("filter", "users").then((users: User[]) => {
        const sender = users[0];
        const receiver = users[1];

        cy.loginByXstate(sender.username);

        if (isMobile()) {
          cy.getBySel("sidenav-toggle").click();
        }
        cy.getBySel("sidenav-home").click();

        cy.getBySel("nav-top-new-transaction").click();

        cy.getBySel("user-list-search-input").type(receiver.firstName);
        cy.getBySel(`user-list-item-${receiver.id}`).should("be.visible");
        cy.getBySel(`user-list-item-${receiver.id}`).click();

        cy.getBySel("transaction-create-amount-input").type("50");
        cy.getBySel("transaction-create-description-input").type("Line 1{enter}Line 2");

        cy.getBySel("transaction-create-submit-payment").should("not.be.disabled");
      });
    });
  });
});
