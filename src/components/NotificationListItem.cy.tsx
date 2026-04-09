import React from "react";
import NotificationListItem from "./NotificationListItem";
import {
  PaymentNotificationStatus,
  NotificationResponseItem,
  CommentNotificationResponseItem,
  LikeNotificationResponseItem,
  PaymentNotificationResponseItem,
} from "../models";

describe("NotificationListItem", () => {
  const baseNotification = {
    id: "noti-1",
    uuid: "noti-uuid-1",
    userId: "user-1",
    transactionId: "tx-1",
    isRead: false,
    createdAt: new Date("2024-01-15"),
    modifiedAt: new Date("2024-01-15"),
    userFullName: "Jane Doe",
  };

  const commentNotification: CommentNotificationResponseItem = {
    ...baseNotification,
    commentId: "comment-1",
  };

  const likeNotification: LikeNotificationResponseItem = {
    ...baseNotification,
    id: "noti-2",
    likeId: "like-1",
  };

  const paymentRequestedNotification: PaymentNotificationResponseItem = {
    ...baseNotification,
    id: "noti-3",
    status: PaymentNotificationStatus.requested,
  };

  const paymentReceivedNotification: PaymentNotificationResponseItem = {
    ...baseNotification,
    id: "noti-4",
    status: PaymentNotificationStatus.received,
  };

  it("renders a comment notification with correct text", () => {
    const updateNotificationStub = cy.stub().as("updateNotification");

    cy.mount(
      <NotificationListItem
        notification={commentNotification}
        updateNotification={updateNotificationStub}
      />
    );

    cy.getBySel(`notification-list-item-${commentNotification.id}`).should(
      "contain",
      "Jane Doe commented on a transaction."
    );
  });

  it("renders a like notification with correct text", () => {
    const updateNotificationStub = cy.stub().as("updateNotification");

    cy.mount(
      <NotificationListItem
        notification={likeNotification}
        updateNotification={updateNotificationStub}
      />
    );

    cy.getBySel(`notification-list-item-${likeNotification.id}`).should(
      "contain",
      "Jane Doe liked a transaction."
    );
  });

  it("renders a payment requested notification with correct text", () => {
    const updateNotificationStub = cy.stub().as("updateNotification");

    cy.mount(
      <NotificationListItem
        notification={paymentRequestedNotification}
        updateNotification={updateNotificationStub}
      />
    );

    cy.getBySel(`notification-list-item-${paymentRequestedNotification.id}`).should(
      "contain",
      "Jane Doe requested payment."
    );
  });

  it("renders a payment received notification with correct text", () => {
    const updateNotificationStub = cy.stub().as("updateNotification");

    cy.mount(
      <NotificationListItem
        notification={paymentReceivedNotification}
        updateNotification={updateNotificationStub}
      />
    );

    cy.getBySel(`notification-list-item-${paymentReceivedNotification.id}`).should(
      "contain",
      "Jane Doe received payment."
    );
  });

  it("renders a Dismiss button and clicking it calls updateNotification", () => {
    const updateNotificationStub = cy.stub().as("updateNotification");

    cy.mount(
      <NotificationListItem
        notification={commentNotification}
        updateNotification={updateNotificationStub}
      />
    );

    cy.getBySel(`notification-mark-read-${commentNotification.id}`).should("be.visible").click();
    cy.get("@updateNotification").should("have.been.calledWith", {
      id: commentNotification.id,
      isRead: true,
    });
  });
});
