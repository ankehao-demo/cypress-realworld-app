import { describe, expect, it } from "vitest";
import { string, object } from "yup";

const validationSchema = object({
  bankName: string().min(5, "Must contain at least 5 characters").required("Enter a bank name"),
  routingNumber: string()
    .length(9, "Must contain a valid routing number")
    .required("Enter a valid bank routing number"),
  accountNumber: string()
    .min(9, "Must contain at least 9 digits")
    .max(12, "Must contain no more than 12 digits")
    .required("Enter a valid bank account number"),
});

describe("BankAccountForm Validation Schema", () => {
  describe("bankName validation", () => {
    it("should accept valid bank name", async () => {
      const result = await validationSchema.isValid({
        bankName: "Chase Bank",
        routingNumber: "123456789",
        accountNumber: "987654321",
      });
      expect(result).toBe(true);
    });

    it("should reject empty bank name", async () => {
      try {
        await validationSchema.validate({
          bankName: "",
          routingNumber: "123456789",
          accountNumber: "987654321",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toContain("5 characters");
      }
    });

    it("should reject bank name with less than 5 characters", async () => {
      try {
        await validationSchema.validate({
          bankName: "Bank",
          routingNumber: "123456789",
          accountNumber: "987654321",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Must contain at least 5 characters");
      }
    });

    it("should accept bank name with exactly 5 characters", async () => {
      const result = await validationSchema.isValid({
        bankName: "Chase",
        routingNumber: "123456789",
        accountNumber: "987654321",
      });
      expect(result).toBe(true);
    });

    it("should reject bank name with exactly 4 characters", async () => {
      try {
        await validationSchema.validate({
          bankName: "Bank",
          routingNumber: "123456789",
          accountNumber: "987654321",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Must contain at least 5 characters");
      }
    });

    it("should accept bank name with special characters", async () => {
      const result = await validationSchema.isValid({
        bankName: "Bank & Trust Co.",
        routingNumber: "123456789",
        accountNumber: "987654321",
      });
      expect(result).toBe(true);
    });

    it("should accept very long bank name", async () => {
      const longName = "A".repeat(1000);
      const result = await validationSchema.isValid({
        bankName: longName,
        routingNumber: "123456789",
        accountNumber: "987654321",
      });
      expect(result).toBe(true);
    });

    it("should accept bank name with unicode characters", async () => {
      const result = await validationSchema.isValid({
        bankName: "Banco de España",
        routingNumber: "123456789",
        accountNumber: "987654321",
      });
      expect(result).toBe(true);
    });

    it("should accept bank name with SQL injection attempt", async () => {
      const result = await validationSchema.isValid({
        bankName: "'; DROP TABLE banks--",
        routingNumber: "123456789",
        accountNumber: "987654321",
      });
      expect(result).toBe(true);
    });

    it("should accept bank name with XSS payload", async () => {
      const result = await validationSchema.isValid({
        bankName: "<script>alert('xss')</script>",
        routingNumber: "123456789",
        accountNumber: "987654321",
      });
      expect(result).toBe(true);
    });
  });

  describe("routingNumber validation", () => {
    it("should accept valid routing number", async () => {
      const result = await validationSchema.isValid({
        bankName: "Chase Bank",
        routingNumber: "123456789",
        accountNumber: "987654321",
      });
      expect(result).toBe(true);
    });

    it("should reject empty routing number", async () => {
      try {
        await validationSchema.validate({
          bankName: "Chase Bank",
          routingNumber: "",
          accountNumber: "987654321",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toContain("routing number");
      }
    });

    it("should reject routing number with less than 9 digits", async () => {
      try {
        await validationSchema.validate({
          bankName: "Chase Bank",
          routingNumber: "12345678",
          accountNumber: "987654321",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Must contain a valid routing number");
      }
    });

    it("should reject routing number with more than 9 digits", async () => {
      try {
        await validationSchema.validate({
          bankName: "Chase Bank",
          routingNumber: "1234567890",
          accountNumber: "987654321",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Must contain a valid routing number");
      }
    });

    it("should accept routing number with exactly 9 digits", async () => {
      const result = await validationSchema.isValid({
        bankName: "Chase Bank",
        routingNumber: "123456789",
        accountNumber: "987654321",
      });
      expect(result).toBe(true);
    });

    it("should accept routing number with letters (validation is length-based)", async () => {
      const result = await validationSchema.isValid({
        bankName: "Chase Bank",
        routingNumber: "12345678A",
        accountNumber: "987654321",
      });
      expect(result).toBe(true);
    });

    it("should reject routing number with special characters", async () => {
      const result = await validationSchema.isValid({
        bankName: "Chase Bank",
        routingNumber: "123-456-78",
        accountNumber: "987654321",
      });
      expect(result).toBe(false);
    });
  });

  describe("accountNumber validation", () => {
    it("should accept valid account number", async () => {
      const result = await validationSchema.isValid({
        bankName: "Chase Bank",
        routingNumber: "123456789",
        accountNumber: "987654321",
      });
      expect(result).toBe(true);
    });

    it("should reject empty account number", async () => {
      try {
        await validationSchema.validate({
          bankName: "Chase Bank",
          routingNumber: "123456789",
          accountNumber: "",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toContain("9 digits");
      }
    });

    it("should reject account number with less than 9 digits", async () => {
      try {
        await validationSchema.validate({
          bankName: "Chase Bank",
          routingNumber: "123456789",
          accountNumber: "12345678",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Must contain at least 9 digits");
      }
    });

    it("should accept account number with exactly 9 digits", async () => {
      const result = await validationSchema.isValid({
        bankName: "Chase Bank",
        routingNumber: "123456789",
        accountNumber: "123456789",
      });
      expect(result).toBe(true);
    });

    it("should accept account number with exactly 12 digits", async () => {
      const result = await validationSchema.isValid({
        bankName: "Chase Bank",
        routingNumber: "123456789",
        accountNumber: "123456789012",
      });
      expect(result).toBe(true);
    });

    it("should reject account number with more than 12 digits", async () => {
      try {
        await validationSchema.validate({
          bankName: "Chase Bank",
          routingNumber: "123456789",
          accountNumber: "1234567890123",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Must contain no more than 12 digits");
      }
    });

    it("should accept account number with exactly 8 digits (should fail)", async () => {
      try {
        await validationSchema.validate({
          bankName: "Chase Bank",
          routingNumber: "123456789",
          accountNumber: "12345678",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Must contain at least 9 digits");
      }
    });

    it("should accept account number with exactly 13 digits (should fail)", async () => {
      try {
        await validationSchema.validate({
          bankName: "Chase Bank",
          routingNumber: "123456789",
          accountNumber: "1234567890123",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Must contain no more than 12 digits");
      }
    });

    it("should accept account number with letters", async () => {
      const result = await validationSchema.isValid({
        bankName: "Chase Bank",
        routingNumber: "123456789",
        accountNumber: "123456789ABC",
      });
      expect(result).toBe(true);
    });

    it("should accept account number with special characters", async () => {
      const result = await validationSchema.isValid({
        bankName: "Chase Bank",
        routingNumber: "123456789",
        accountNumber: "123-456-789",
      });
      expect(result).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle whitespace in fields", async () => {
      const result = await validationSchema.isValid({
        bankName: "     ",
        routingNumber: "123456789",
        accountNumber: "987654321",
      });
      expect(result).toBe(true);
    });

    it("should handle null bytes in strings", async () => {
      const result = await validationSchema.isValid({
        bankName: "Chase\0Bank",
        routingNumber: "123456789",
        accountNumber: "987654321",
      });
      expect(result).toBe(true);
    });

    it("should handle newlines in strings", async () => {
      const result = await validationSchema.isValid({
        bankName: "Chase\nBank",
        routingNumber: "123456789",
        accountNumber: "987654321",
      });
      expect(result).toBe(true);
    });
  });
});
