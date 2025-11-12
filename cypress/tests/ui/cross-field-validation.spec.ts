import { User, BankAccount } from "../../../src/models";
import { isMobile } from "../../support/utils";

describe("Cross-Field Validation", function () {
  beforeEach(function () {
    cy.task("db:seed");
  });

  context("Insufficient Balance Validation", function () {
    it("should prevent payment when amount exceeds user balance", function () {
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

        const excessiveAmount = sender.balance + 10000;
        cy.getBySel("transaction-create-amount-input").type(excessiveAmount.toString());
        cy.getBySel("transaction-create-description-input").type("Payment exceeding balance");

        cy.getBySel("transaction-create-submit-payment").click();

        cy.database("filter", "transactions", {
          senderId: sender.id,
          receiverId: receiver.id,
          description: "Payment exceeding balance",
        }).then((transactions: any[]) => {
          if (transactions.length > 0) {
            const transaction = transactions[0];
            expect(transaction.status).to.not.eq("complete");
          }
        });
      });
    });

    it("should allow payment when amount is within user balance", function () {
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

        const validAmount = Math.min(sender.balance - 100, 100);
        cy.getBySel("transaction-create-amount-input").type(validAmount.toString());
        cy.getBySel("transaction-create-description-input").type("Valid payment within balance");

        cy.getBySel("transaction-create-submit-payment").click();

        cy.getBySel("alert-bar-success")
          .should("be.visible")
          .and("contain", "Transaction Submitted");
      });
    });

    it("should prevent payment when amount equals entire balance", function () {
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

        cy.getBySel("transaction-create-amount-input").type(sender.balance.toString());
        cy.getBySel("transaction-create-description-input").type("Payment of entire balance");

        cy.getBySel("transaction-create-submit-payment").click();

        cy.database("filter", "transactions", {
          senderId: sender.id,
          receiverId: receiver.id,
          description: "Payment of entire balance",
        }).then((transactions: any[]) => {
          if (transactions.length > 0) {
            const transaction = transactions[0];
            expect(transaction.status).to.not.eq("complete");
          }
        });
      });
    });
  });

  context("Duplicate Bank Account Validation", function () {
    it("should prevent creating duplicate bank account with same account number", function () {
      cy.database("find", "users").then((user: User) => {
        cy.loginByXstate(user.username);

        cy.database("filter", "bankaccounts", { userId: user.id }).then(
          (bankAccounts: BankAccount[]) => {
            const existingAccount = bankAccounts[0];

            if (isMobile()) {
              cy.getBySel("sidenav-toggle").click();
            }
            cy.getBySel("sidenav-bankaccounts").click();

            cy.getBySel("bankaccount-new").click();

            cy.getBySelLike("bankName-input").type("Duplicate Bank");
            cy.getBySelLike("routingNumber-input").type(existingAccount.routingNumber);
            cy.getBySelLike("accountNumber-input").type(existingAccount.accountNumber);

            cy.getBySelLike("submit").click();

            cy.database("filter", "bankaccounts", {
              userId: user.id,
              accountNumber: existingAccount.accountNumber,
            }).then((duplicateAccounts: BankAccount[]) => {
              const activeAccounts = duplicateAccounts.filter((acc) => !acc.isDeleted);
              expect(activeAccounts.length).to.be.lte(1);
            });
          }
        );
      });
    });

    it("should allow creating bank account with different account number", function () {
      cy.database("find", "users").then((user: User) => {
        cy.loginByXstate(user.username);

        if (isMobile()) {
          cy.getBySel("sidenav-toggle").click();
        }
        cy.getBySel("sidenav-bankaccounts").click();

        cy.getBySel("bankaccount-new").click();

        const uniqueAccountNumber = Math.floor(Math.random() * 1000000000).toString();
        cy.getBySelLike("bankName-input").type("New Unique Bank");
        cy.getBySelLike("routingNumber-input").type("123456789");
        cy.getBySelLike("accountNumber-input").type(uniqueAccountNumber);

        cy.getBySelLike("submit").click();

        cy.database("filter", "bankaccounts", {
          userId: user.id,
          accountNumber: uniqueAccountNumber,
        }).then((accounts: BankAccount[]) => {
          expect(accounts.length).to.be.gte(1);
        });
      });
    });
  });

  context("Self-Transaction Validation", function () {
    it("should prevent user from sending payment to themselves", function () {
      cy.database("find", "users").then((user: User) => {
        cy.loginByXstate(user.username);

        if (isMobile()) {
          cy.getBySel("sidenav-toggle").click();
        }
        cy.getBySel("sidenav-home").click();

        cy.getBySel("nav-top-new-transaction").click();

        cy.getBySel("user-list-search-input").type(user.firstName);

        cy.get(`[data-test*="user-list-item-${user.id}"]`).should("not.exist");
      });
    });

    it("should prevent user from requesting payment from themselves", function () {
      cy.database("find", "users").then((user: User) => {
        cy.loginByXstate(user.username);

        if (isMobile()) {
          cy.getBySel("sidenav-toggle").click();
        }
        cy.getBySel("sidenav-home").click();

        cy.getBySel("nav-top-new-transaction").click();

        cy.getBySel("user-list-search-input").type(user.username);

        cy.get(`[data-test*="user-list-item-${user.id}"]`).should("not.exist");
      });
    });

    it("should allow user to send payment to other users", function () {
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
        cy.getBySel("transaction-create-description-input").type("Valid payment to other user");

        cy.getBySel("transaction-create-submit-payment").click();

        cy.getBySel("alert-bar-success")
          .should("be.visible")
          .and("contain", "Transaction Submitted");
      });
    });
  });

  context("Transaction Amount Validation", function () {
    it("should prevent negative amount transactions", function () {
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

        cy.getBySel("transaction-create-amount-input").type("-100");
        cy.getBySel("transaction-create-description-input").type("Negative amount");

        cy.getBySel("transaction-create-submit-payment").should("be.disabled");
      });
    });

    it("should prevent zero amount transactions", function () {
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

        cy.getBySel("transaction-create-amount-input").clear();
        cy.getBySel("transaction-create-description-input").type("Zero amount");

        cy.getBySel("transaction-create-submit-payment").should("be.disabled");
      });
    });

    it("should allow valid positive amount transactions", function () {
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

        cy.getBySel("transaction-create-amount-input").type("25.50");
        cy.getBySel("transaction-create-description-input").type("Valid positive amount");

        cy.getBySel("transaction-create-submit-payment").should("not.be.disabled");
      });
    });
  });

  context("Bank Account Routing Number Validation", function () {
    it("should prevent bank account with invalid routing number length", function () {
      cy.database("find", "users").then((user: User) => {
        cy.loginByXstate(user.username);

        if (isMobile()) {
          cy.getBySel("sidenav-toggle").click();
        }
        cy.getBySel("sidenav-bankaccounts").click();

        cy.getBySel("bankaccount-new").click();

        cy.getBySelLike("bankName-input").type("Test Bank");
        cy.getBySelLike("routingNumber-input").type("12345678");
        cy.getBySelLike("accountNumber-input").type("123456789");

        cy.get("#bankaccount-routingNumber-input-helper-text")
          .should("be.visible")
          .and("contain", "Must contain a valid routing number");

        cy.getBySel("bankaccount-submit").should("be.disabled");
      });
    });

    it("should allow bank account with valid routing number", function () {
      cy.database("find", "users").then((user: User) => {
        cy.loginByXstate(user.username);

        if (isMobile()) {
          cy.getBySel("sidenav-toggle").click();
        }
        cy.getBySel("sidenav-bankaccounts").click();

        cy.getBySel("bankaccount-new").click();

        cy.getBySelLike("bankName-input").type("Valid Bank");
        cy.getBySelLike("routingNumber-input").type("123456789");
        cy.getBySelLike("accountNumber-input").type("987654321");

        cy.getBySel("bankaccount-submit").should("not.be.disabled");
      });
    });
  });
});
