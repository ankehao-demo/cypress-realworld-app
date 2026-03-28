import { describe, expect, it } from "vitest";
import { string, object, ref } from "yup";

const validationSchema = object({
  firstName: string().required("First Name is required"),
  lastName: string().required("Last Name is required"),
  username: string().required("Username is required"),
  password: string()
    .min(4, "Password must contain at least 4 characters")
    .required("Enter your password"),
  confirmPassword: string()
    .required("Confirm your password")
    .oneOf([ref("password")], "Password does not match"),
});

describe("SignUpForm Validation Schema", () => {
  describe("firstName validation", () => {
    it("should accept valid first name", async () => {
      const result = await validationSchema.isValid({
        firstName: "John",
        lastName: "Doe",
        username: "johndoe",
        password: "test1234",
        confirmPassword: "test1234",
      });
      expect(result).toBe(true);
    });

    it("should reject empty first name", async () => {
      try {
        await validationSchema.validate({
          firstName: "",
          lastName: "Doe",
          username: "johndoe",
          password: "test1234",
          confirmPassword: "test1234",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("First Name is required");
      }
    });

    it("should accept first name with special characters", async () => {
      const result = await validationSchema.isValid({
        firstName: "Jean-Pierre",
        lastName: "Doe",
        username: "johndoe",
        password: "test1234",
        confirmPassword: "test1234",
      });
      expect(result).toBe(true);
    });

    it("should accept first name with unicode characters", async () => {
      const result = await validationSchema.isValid({
        firstName: "José",
        lastName: "Doe",
        username: "johndoe",
        password: "test1234",
        confirmPassword: "test1234",
      });
      expect(result).toBe(true);
    });

    it("should accept very long first name", async () => {
      const longName = "A".repeat(1000);
      const result = await validationSchema.isValid({
        firstName: longName,
        lastName: "Doe",
        username: "johndoe",
        password: "test1234",
        confirmPassword: "test1234",
      });
      expect(result).toBe(true);
    });

    it("should accept first name with emojis", async () => {
      const result = await validationSchema.isValid({
        firstName: "John😀",
        lastName: "Doe",
        username: "johndoe",
        password: "test1234",
        confirmPassword: "test1234",
      });
      expect(result).toBe(true);
    });
  });

  describe("lastName validation", () => {
    it("should reject empty last name", async () => {
      try {
        await validationSchema.validate({
          firstName: "John",
          lastName: "",
          username: "johndoe",
          password: "test1234",
          confirmPassword: "test1234",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Last Name is required");
      }
    });

    it("should accept last name with special characters", async () => {
      const result = await validationSchema.isValid({
        firstName: "John",
        lastName: "O'Brien",
        username: "johndoe",
        password: "test1234",
        confirmPassword: "test1234",
      });
      expect(result).toBe(true);
    });
  });

  describe("username validation", () => {
    it("should reject empty username", async () => {
      try {
        await validationSchema.validate({
          firstName: "John",
          lastName: "Doe",
          username: "",
          password: "test1234",
          confirmPassword: "test1234",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Username is required");
      }
    });

    it("should accept username with special characters", async () => {
      const result = await validationSchema.isValid({
        firstName: "John",
        lastName: "Doe",
        username: "john_doe-123",
        password: "test1234",
        confirmPassword: "test1234",
      });
      expect(result).toBe(true);
    });

    it("should accept username with SQL injection attempt", async () => {
      const result = await validationSchema.isValid({
        firstName: "John",
        lastName: "Doe",
        username: "'; DROP TABLE users--",
        password: "test1234",
        confirmPassword: "test1234",
      });
      expect(result).toBe(true);
    });

    it("should accept username with XSS payload", async () => {
      const result = await validationSchema.isValid({
        firstName: "John",
        lastName: "Doe",
        username: "<script>alert('xss')</script>",
        password: "test1234",
        confirmPassword: "test1234",
      });
      expect(result).toBe(true);
    });
  });

  describe("password validation", () => {
    it("should reject empty password", async () => {
      try {
        await validationSchema.validate({
          firstName: "John",
          lastName: "Doe",
          username: "johndoe",
          password: "",
          confirmPassword: "",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toContain("password");
      }
    });

    it("should reject password with less than 4 characters", async () => {
      try {
        await validationSchema.validate({
          firstName: "John",
          lastName: "Doe",
          username: "johndoe",
          password: "abc",
          confirmPassword: "abc",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Password must contain at least 4 characters");
      }
    });

    it("should accept password with exactly 4 characters", async () => {
      const result = await validationSchema.isValid({
        firstName: "John",
        lastName: "Doe",
        username: "johndoe",
        password: "abcd",
        confirmPassword: "abcd",
      });
      expect(result).toBe(true);
    });

    it("should accept password with special characters", async () => {
      const result = await validationSchema.isValid({
        firstName: "John",
        lastName: "Doe",
        username: "johndoe",
        password: "P@ssw0rd!",
        confirmPassword: "P@ssw0rd!",
      });
      expect(result).toBe(true);
    });

    it("should accept very long password", async () => {
      const longPassword = "A".repeat(1000);
      const result = await validationSchema.isValid({
        firstName: "John",
        lastName: "Doe",
        username: "johndoe",
        password: longPassword,
        confirmPassword: longPassword,
      });
      expect(result).toBe(true);
    });
  });

  describe("confirmPassword validation", () => {
    it("should reject empty confirm password", async () => {
      try {
        await validationSchema.validate({
          firstName: "John",
          lastName: "Doe",
          username: "johndoe",
          password: "test1234",
          confirmPassword: "",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Confirm your password");
      }
    });

    it("should reject mismatched passwords", async () => {
      try {
        await validationSchema.validate({
          firstName: "John",
          lastName: "Doe",
          username: "johndoe",
          password: "test1234",
          confirmPassword: "different",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Password does not match");
      }
    });

    it("should accept matching passwords", async () => {
      const result = await validationSchema.isValid({
        firstName: "John",
        lastName: "Doe",
        username: "johndoe",
        password: "test1234",
        confirmPassword: "test1234",
      });
      expect(result).toBe(true);
    });

    it("should reject confirm password when password is empty", async () => {
      try {
        await validationSchema.validate({
          firstName: "John",
          lastName: "Doe",
          username: "johndoe",
          password: "",
          confirmPassword: "test1234",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toContain("Password");
      }
    });
  });

  describe("edge cases", () => {
    it("should handle whitespace-only strings", async () => {
      const result = await validationSchema.isValid({
        firstName: "   ",
        lastName: "   ",
        username: "   ",
        password: "    ",
        confirmPassword: "    ",
      });
      expect(result).toBe(true);
    });

    it("should handle null bytes in strings", async () => {
      const result = await validationSchema.isValid({
        firstName: "John\0Doe",
        lastName: "Doe",
        username: "johndoe",
        password: "test1234",
        confirmPassword: "test1234",
      });
      expect(result).toBe(true);
    });

    it("should handle newlines in strings", async () => {
      const result = await validationSchema.isValid({
        firstName: "John\nDoe",
        lastName: "Doe",
        username: "johndoe",
        password: "test1234",
        confirmPassword: "test1234",
      });
      expect(result).toBe(true);
    });
  });
});
