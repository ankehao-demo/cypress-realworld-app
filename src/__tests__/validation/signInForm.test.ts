import { describe, expect, it } from "vitest";
import { string, object } from "yup";

const validationSchema = object({
  username: string().required("Username is required"),
  password: string()
    .min(4, "Password must contain at least 4 characters")
    .required("Enter your password"),
});

describe("SignInForm Validation Schema", () => {
  describe("username validation", () => {
    it("should accept valid username", async () => {
      const result = await validationSchema.isValid({
        username: "johndoe",
        password: "test1234",
      });
      expect(result).toBe(true);
    });

    it("should reject empty username", async () => {
      try {
        await validationSchema.validate({
          username: "",
          password: "test1234",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Username is required");
      }
    });

    it("should accept username with special characters", async () => {
      const result = await validationSchema.isValid({
        username: "john_doe-123!@#",
        password: "test1234",
      });
      expect(result).toBe(true);
    });

    it("should accept username with SQL injection attempt", async () => {
      const result = await validationSchema.isValid({
        username: "admin' OR '1'='1",
        password: "test1234",
      });
      expect(result).toBe(true);
    });

    it("should accept username with XSS payload", async () => {
      const result = await validationSchema.isValid({
        username: "<script>alert('xss')</script>",
        password: "test1234",
      });
      expect(result).toBe(true);
    });

    it("should accept very long username", async () => {
      const longUsername = "A".repeat(10000);
      const result = await validationSchema.isValid({
        username: longUsername,
        password: "test1234",
      });
      expect(result).toBe(true);
    });

    it("should accept username with unicode characters", async () => {
      const result = await validationSchema.isValid({
        username: "用户名",
        password: "test1234",
      });
      expect(result).toBe(true);
    });
  });

  describe("password validation", () => {
    it("should reject empty password", async () => {
      try {
        await validationSchema.validate({
          username: "johndoe",
          password: "",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toContain("4 characters");
      }
    });

    it("should reject password with less than 4 characters", async () => {
      try {
        await validationSchema.validate({
          username: "johndoe",
          password: "abc",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Password must contain at least 4 characters");
      }
    });

    it("should accept password with exactly 4 characters", async () => {
      const result = await validationSchema.isValid({
        username: "johndoe",
        password: "abcd",
      });
      expect(result).toBe(true);
    });

    it("should reject password with exactly 3 characters", async () => {
      try {
        await validationSchema.validate({
          username: "johndoe",
          password: "abc",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Password must contain at least 4 characters");
      }
    });

    it("should accept password with special characters", async () => {
      const result = await validationSchema.isValid({
        username: "johndoe",
        password: "P@$$w0rd!#%",
      });
      expect(result).toBe(true);
    });

    it("should accept very long password", async () => {
      const longPassword = "A".repeat(10000);
      const result = await validationSchema.isValid({
        username: "johndoe",
        password: longPassword,
      });
      expect(result).toBe(true);
    });

    it("should accept password with whitespace", async () => {
      const result = await validationSchema.isValid({
        username: "johndoe",
        password: "pass word",
      });
      expect(result).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle whitespace-only username", async () => {
      const result = await validationSchema.isValid({
        username: "    ",
        password: "test1234",
      });
      expect(result).toBe(true);
    });

    it("should handle null bytes in strings", async () => {
      const result = await validationSchema.isValid({
        username: "john\0doe",
        password: "test\u00001234",
      });
      expect(result).toBe(true);
    });

    it("should handle newlines in strings", async () => {
      const result = await validationSchema.isValid({
        username: "john\ndoe",
        password: "test\n1234",
      });
      expect(result).toBe(true);
    });

    it("should handle control characters", async () => {
      const result = await validationSchema.isValid({
        username: "john\x00\x01\x02doe",
        password: "test1234",
      });
      expect(result).toBe(true);
    });
  });
});
