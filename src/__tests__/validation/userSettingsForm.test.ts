import { describe, expect, it } from "vitest";
import { string, object, mixed } from "yup";

const phoneRegExp =
  /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/;

enum DefaultPrivacyLevel {
  public = "public",
  private = "private",
  contacts = "contacts",
}

const DefaultPrivacyLevelValues = Object.values(DefaultPrivacyLevel);

const validationSchema = object({
  firstName: string().required("Enter a first name"),
  lastName: string().required("Enter a last name"),
  email: string().email("Must contain a valid email address").required("Enter an email address"),
  phoneNumber: string()
    .matches(phoneRegExp, "Phone number is not valid")
    .required("Enter a phone number"),
  defaultPrivacyLevel: mixed<DefaultPrivacyLevel>().oneOf(DefaultPrivacyLevelValues),
});

describe("UserSettingsForm Validation Schema", () => {
  describe("firstName validation", () => {
    it("should accept valid first name", async () => {
      const result = await validationSchema.isValid({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phoneNumber: "555-123-4567",
        defaultPrivacyLevel: "public",
      });
      expect(result).toBe(true);
    });

    it("should reject empty first name", async () => {
      try {
        await validationSchema.validate({
          firstName: "",
          lastName: "Doe",
          email: "john@example.com",
          phoneNumber: "555-123-4567",
          defaultPrivacyLevel: "public",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Enter a first name");
      }
    });

    it("should accept first name with special characters", async () => {
      const result = await validationSchema.isValid({
        firstName: "Jean-Pierre",
        lastName: "Doe",
        email: "john@example.com",
        phoneNumber: "555-123-4567",
        defaultPrivacyLevel: "public",
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
          email: "john@example.com",
          phoneNumber: "555-123-4567",
          defaultPrivacyLevel: "public",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Enter a last name");
      }
    });
  });

  describe("email validation", () => {
    it("should accept valid email", async () => {
      const result = await validationSchema.isValid({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phoneNumber: "555-123-4567",
        defaultPrivacyLevel: "public",
      });
      expect(result).toBe(true);
    });

    it("should reject empty email", async () => {
      try {
        await validationSchema.validate({
          firstName: "John",
          lastName: "Doe",
          email: "",
          phoneNumber: "555-123-4567",
          defaultPrivacyLevel: "public",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Enter an email address");
      }
    });

    it("should reject invalid email format", async () => {
      try {
        await validationSchema.validate({
          firstName: "John",
          lastName: "Doe",
          email: "notanemail",
          phoneNumber: "555-123-4567",
          defaultPrivacyLevel: "public",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Must contain a valid email address");
      }
    });

    it("should reject email without @", async () => {
      try {
        await validationSchema.validate({
          firstName: "John",
          lastName: "Doe",
          email: "johnexample.com",
          phoneNumber: "555-123-4567",
          defaultPrivacyLevel: "public",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Must contain a valid email address");
      }
    });

    it("should reject email without domain", async () => {
      try {
        await validationSchema.validate({
          firstName: "John",
          lastName: "Doe",
          email: "john@",
          phoneNumber: "555-123-4567",
          defaultPrivacyLevel: "public",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Must contain a valid email address");
      }
    });

    it("should accept email with special characters", async () => {
      const result = await validationSchema.isValid({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe+test@example.co.uk",
        phoneNumber: "555-123-4567",
        defaultPrivacyLevel: "public",
      });
      expect(result).toBe(true);
    });

    it("should accept email with subdomain", async () => {
      const result = await validationSchema.isValid({
        firstName: "John",
        lastName: "Doe",
        email: "john@mail.example.com",
        phoneNumber: "555-123-4567",
        defaultPrivacyLevel: "public",
      });
      expect(result).toBe(true);
    });

    it("should accept email with very long domain", async () => {
      const longDomain = "a".repeat(50);
      const result = await validationSchema.isValid({
        firstName: "John",
        lastName: "Doe",
        email: `john@${longDomain}.com`,
        phoneNumber: "555-123-4567",
        defaultPrivacyLevel: "public",
      });
      expect(result).toBe(true);
    });
  });

  describe("phoneNumber validation", () => {
    it("should accept valid phone number", async () => {
      const result = await validationSchema.isValid({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phoneNumber: "555-123-4567",
        defaultPrivacyLevel: "public",
      });
      expect(result).toBe(true);
    });

    it("should reject empty phone number", async () => {
      try {
        await validationSchema.validate({
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phoneNumber: "",
          defaultPrivacyLevel: "public",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toContain("Phone number");
      }
    });

    it("should accept phone number with dashes", async () => {
      const result = await validationSchema.isValid({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phoneNumber: "555-123-4567",
        defaultPrivacyLevel: "public",
      });
      expect(result).toBe(true);
    });

    it("should accept phone number with spaces", async () => {
      const result = await validationSchema.isValid({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phoneNumber: "555 123 4567",
        defaultPrivacyLevel: "public",
      });
      expect(result).toBe(true);
    });

    it("should accept phone number with dashes only", async () => {
      const result = await validationSchema.isValid({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phoneNumber: "555-123-4567",
        defaultPrivacyLevel: "public",
      });
      expect(result).toBe(true);
    });

    it("should accept phone number with spaces", async () => {
      const result = await validationSchema.isValid({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phoneNumber: "555 123 4567",
        defaultPrivacyLevel: "public",
      });
      expect(result).toBe(true);
    });

    it("should reject phone number with letters", async () => {
      try {
        await validationSchema.validate({
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phoneNumber: "555-ABC-DEFG",
          defaultPrivacyLevel: "public",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Phone number is not valid");
      }
    });

    it("should reject too short phone number", async () => {
      try {
        await validationSchema.validate({
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phoneNumber: "123",
          defaultPrivacyLevel: "public",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toBe("Phone number is not valid");
      }
    });
  });

  describe("defaultPrivacyLevel validation", () => {
    it("should accept public privacy level", async () => {
      const result = await validationSchema.isValid({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phoneNumber: "555-123-4567",
        defaultPrivacyLevel: "public",
      });
      expect(result).toBe(true);
    });

    it("should accept private privacy level", async () => {
      const result = await validationSchema.isValid({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phoneNumber: "555-123-4567",
        defaultPrivacyLevel: "private",
      });
      expect(result).toBe(true);
    });

    it("should accept contacts privacy level", async () => {
      const result = await validationSchema.isValid({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phoneNumber: "555-123-4567",
        defaultPrivacyLevel: "contacts",
      });
      expect(result).toBe(true);
    });

    it("should reject invalid privacy level", async () => {
      try {
        await validationSchema.validate({
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phoneNumber: "555-123-4567",
          defaultPrivacyLevel: "invalid",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toContain("must be one of the following values");
      }
    });
  });

  describe("edge cases", () => {
    it("should handle very long email", async () => {
      const longEmail = "a".repeat(100) + "@example.com";
      const result = await validationSchema.isValid({
        firstName: "John",
        lastName: "Doe",
        email: longEmail,
        phoneNumber: "555-123-4567",
        defaultPrivacyLevel: "public",
      });
      expect(result).toBe(true);
    });

    it("should handle unicode in name fields", async () => {
      const result = await validationSchema.isValid({
        firstName: "José",
        lastName: "García",
        email: "jose@example.com",
        phoneNumber: "555-123-4567",
        defaultPrivacyLevel: "public",
      });
      expect(result).toBe(true);
    });
  });
});
