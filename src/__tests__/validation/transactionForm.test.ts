import { describe, expect, it } from "vitest";
import { string, object, number } from "yup";

const validationSchema = object({
  amount: number().required("Please enter a valid amount"),
  description: string().required("Please enter a note"),
  senderId: string(),
  receiverId: string(),
});

describe("TransactionCreateStepTwo Validation Schema", () => {
  describe("amount validation", () => {
    it("should accept valid amount", async () => {
      const result = await validationSchema.isValid({
        amount: 100,
        description: "Payment for services",
        senderId: "user1",
        receiverId: "user2",
      });
      expect(result).toBe(true);
    });

    it("should reject empty amount", async () => {
      try {
        await validationSchema.validate({
          amount: undefined,
          description: "Payment for services",
          senderId: "user1",
          receiverId: "user2",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Please enter a valid amount");
      }
    });

    it("should accept zero amount", async () => {
      const result = await validationSchema.isValid({
        amount: 0,
        description: "Payment for services",
        senderId: "user1",
        receiverId: "user2",
      });
      expect(result).toBe(true);
    });

    it("should accept negative amount", async () => {
      const result = await validationSchema.isValid({
        amount: -100,
        description: "Payment for services",
        senderId: "user1",
        receiverId: "user2",
      });
      expect(result).toBe(true);
    });

    it("should accept very large amount", async () => {
      const result = await validationSchema.isValid({
        amount: 999999999999,
        description: "Payment for services",
        senderId: "user1",
        receiverId: "user2",
      });
      expect(result).toBe(true);
    });

    it("should accept decimal amount", async () => {
      const result = await validationSchema.isValid({
        amount: 100.5,
        description: "Payment for services",
        senderId: "user1",
        receiverId: "user2",
      });
      expect(result).toBe(true);
    });

    it("should accept very small decimal amount", async () => {
      const result = await validationSchema.isValid({
        amount: 0.01,
        description: "Payment for services",
        senderId: "user1",
        receiverId: "user2",
      });
      expect(result).toBe(true);
    });

    it("should reject non-numeric amount (string)", async () => {
      try {
        await validationSchema.validate({
          amount: "not a number" as any,
          description: "Payment for services",
          senderId: "user1",
          receiverId: "user2",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toContain("must be a `number` type");
      }
    });

    it("should reject NaN amount", async () => {
      try {
        await validationSchema.validate({
          amount: NaN,
          description: "Payment for services",
          senderId: "user1",
          receiverId: "user2",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toContain("must be a `number` type");
      }
    });

    it("should accept Infinity amount", async () => {
      const result = await validationSchema.isValid({
        amount: Infinity,
        description: "Payment for services",
        senderId: "user1",
        receiverId: "user2",
      });
      expect(result).toBe(true);
    });
  });

  describe("description validation", () => {
    it("should accept valid description", async () => {
      const result = await validationSchema.isValid({
        amount: 100,
        description: "Payment for services",
        senderId: "user1",
        receiverId: "user2",
      });
      expect(result).toBe(true);
    });

    it("should reject empty description", async () => {
      try {
        await validationSchema.validate({
          amount: 100,
          description: "",
          senderId: "user1",
          receiverId: "user2",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Please enter a note");
      }
    });

    it("should accept description with special characters", async () => {
      const result = await validationSchema.isValid({
        amount: 100,
        description: "Payment for services & supplies!",
        senderId: "user1",
        receiverId: "user2",
      });
      expect(result).toBe(true);
    });

    it("should accept very long description", async () => {
      const longDescription = "A".repeat(10000);
      const result = await validationSchema.isValid({
        amount: 100,
        description: longDescription,
        senderId: "user1",
        receiverId: "user2",
      });
      expect(result).toBe(true);
    });

    it("should accept description with unicode characters", async () => {
      const result = await validationSchema.isValid({
        amount: 100,
        description: "Pago por servicios 💰",
        senderId: "user1",
        receiverId: "user2",
      });
      expect(result).toBe(true);
    });

    it("should accept description with SQL injection attempt", async () => {
      const result = await validationSchema.isValid({
        amount: 100,
        description: "'; DROP TABLE transactions--",
        senderId: "user1",
        receiverId: "user2",
      });
      expect(result).toBe(true);
    });

    it("should accept description with XSS payload", async () => {
      const result = await validationSchema.isValid({
        amount: 100,
        description: "<script>alert('xss')</script>",
        senderId: "user1",
        receiverId: "user2",
      });
      expect(result).toBe(true);
    });

    it("should accept description with HTML tags", async () => {
      const result = await validationSchema.isValid({
        amount: 100,
        description: "<b>Bold payment</b>",
        senderId: "user1",
        receiverId: "user2",
      });
      expect(result).toBe(true);
    });

    it("should accept whitespace-only description", async () => {
      const result = await validationSchema.isValid({
        amount: 100,
        description: "     ",
        senderId: "user1",
        receiverId: "user2",
      });
      expect(result).toBe(true);
    });

    it("should accept description with newlines", async () => {
      const result = await validationSchema.isValid({
        amount: 100,
        description: "Line 1\nLine 2\nLine 3",
        senderId: "user1",
        receiverId: "user2",
      });
      expect(result).toBe(true);
    });
  });

  describe("senderId and receiverId validation", () => {
    it("should accept valid sender and receiver IDs", async () => {
      const result = await validationSchema.isValid({
        amount: 100,
        description: "Payment for services",
        senderId: "user123",
        receiverId: "user456",
      });
      expect(result).toBe(true);
    });

    it("should accept empty sender and receiver IDs", async () => {
      const result = await validationSchema.isValid({
        amount: 100,
        description: "Payment for services",
        senderId: "",
        receiverId: "",
      });
      expect(result).toBe(true);
    });

    it("should accept undefined sender and receiver IDs", async () => {
      const result = await validationSchema.isValid({
        amount: 100,
        description: "Payment for services",
      });
      expect(result).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle null bytes in description", async () => {
      const result = await validationSchema.isValid({
        amount: 100,
        description: "Payment\0for\0services",
        senderId: "user1",
        receiverId: "user2",
      });
      expect(result).toBe(true);
    });

    it("should handle control characters in description", async () => {
      const result = await validationSchema.isValid({
        amount: 100,
        description: "Payment\x00\x01\x02for services",
        senderId: "user1",
        receiverId: "user2",
      });
      expect(result).toBe(true);
    });
  });
});
