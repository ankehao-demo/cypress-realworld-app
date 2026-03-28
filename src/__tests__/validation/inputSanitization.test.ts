import { describe, expect, it } from "vitest";
import { string, object } from "yup";

const testSchema = object({
  textField: string().required("Field is required"),
});

describe("Input Sanitization Validation", () => {
  describe("HTML and script tag injection", () => {
    it("should accept input with script tags", async () => {
      const result = await testSchema.isValid({
        textField: "<script>alert('xss')</script>",
      });
      expect(result).toBe(true);
    });

    it("should accept input with img tag with onerror", async () => {
      const result = await testSchema.isValid({
        textField: "<img src=x onerror=alert('xss')>",
      });
      expect(result).toBe(true);
    });

    it("should accept input with iframe tag", async () => {
      const result = await testSchema.isValid({
        textField: "<iframe src='javascript:alert(1)'></iframe>",
      });
      expect(result).toBe(true);
    });

    it("should accept input with svg tag with onload", async () => {
      const result = await testSchema.isValid({
        textField: "<svg onload=alert('xss')>",
      });
      expect(result).toBe(true);
    });

    it("should accept input with anchor tag with javascript", async () => {
      const result = await testSchema.isValid({
        textField: "<a href='javascript:alert(1)'>Click</a>",
      });
      expect(result).toBe(true);
    });

    it("should accept input with div with onclick", async () => {
      const result = await testSchema.isValid({
        textField: "<div onclick='alert(1)'>Click me</div>",
      });
      expect(result).toBe(true);
    });

    it("should accept input with style tag", async () => {
      const result = await testSchema.isValid({
        textField: "<style>body{background:red}</style>",
      });
      expect(result).toBe(true);
    });

    it("should accept input with object tag", async () => {
      const result = await testSchema.isValid({
        textField: "<object data='javascript:alert(1)'>",
      });
      expect(result).toBe(true);
    });

    it("should accept input with embed tag", async () => {
      const result = await testSchema.isValid({
        textField: "<embed src='javascript:alert(1)'>",
      });
      expect(result).toBe(true);
    });
  });

  describe("SQL injection attempts", () => {
    it("should accept SQL DROP TABLE statement", async () => {
      const result = await testSchema.isValid({
        textField: "'; DROP TABLE users--",
      });
      expect(result).toBe(true);
    });

    it("should accept SQL UNION SELECT statement", async () => {
      const result = await testSchema.isValid({
        textField: "' UNION SELECT * FROM users--",
      });
      expect(result).toBe(true);
    });

    it("should accept SQL OR 1=1 statement", async () => {
      const result = await testSchema.isValid({
        textField: "admin' OR '1'='1",
      });
      expect(result).toBe(true);
    });

    it("should accept SQL comment injection", async () => {
      const result = await testSchema.isValid({
        textField: "admin'--",
      });
      expect(result).toBe(true);
    });

    it("should accept SQL stacked queries", async () => {
      const result = await testSchema.isValid({
        textField: "'; DELETE FROM users; --",
      });
      expect(result).toBe(true);
    });

    it("should accept SQL hex encoding", async () => {
      const result = await testSchema.isValid({
        textField: "0x61646D696E",
      });
      expect(result).toBe(true);
    });
  });

  describe("Extremely long strings", () => {
    it("should accept string with 10000 characters", async () => {
      const longString = "A".repeat(10000);
      const result = await testSchema.isValid({
        textField: longString,
      });
      expect(result).toBe(true);
    });

    it("should accept string with 100000 characters", async () => {
      const veryLongString = "A".repeat(100000);
      const result = await testSchema.isValid({
        textField: veryLongString,
      });
      expect(result).toBe(true);
    });

    it("should accept string with 1000000 characters", async () => {
      const extremelyLongString = "A".repeat(1000000);
      const result = await testSchema.isValid({
        textField: extremelyLongString,
      });
      expect(result).toBe(true);
    });
  });

  describe("Unicode and special characters", () => {
    it("should accept null byte", async () => {
      const result = await testSchema.isValid({
        textField: "test\0string",
      });
      expect(result).toBe(true);
    });

    it("should accept multiple null bytes", async () => {
      const result = await testSchema.isValid({
        textField: "\0\0\0test\0\0\0",
      });
      expect(result).toBe(true);
    });

    it("should accept control characters", async () => {
      const result = await testSchema.isValid({
        textField: "\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09",
      });
      expect(result).toBe(true);
    });

    it("should accept unicode characters", async () => {
      const result = await testSchema.isValid({
        textField: "Hello 世界 🌍 مرحبا",
      });
      expect(result).toBe(true);
    });

    it("should accept emoji sequences", async () => {
      const result = await testSchema.isValid({
        textField: "👨‍👩‍👧‍👦👍🏻🇺🇸",
      });
      expect(result).toBe(true);
    });

    it("should accept right-to-left override", async () => {
      const result = await testSchema.isValid({
        textField: "test\u202Estring",
      });
      expect(result).toBe(true);
    });

    it("should accept zero-width characters", async () => {
      const result = await testSchema.isValid({
        textField: "test\u200B\u200C\u200Dstring",
      });
      expect(result).toBe(true);
    });

    it("should accept combining characters", async () => {
      const result = await testSchema.isValid({
        textField: "e\u0301\u0302\u0303\u0304",
      });
      expect(result).toBe(true);
    });

    it("should accept surrogate pairs", async () => {
      const result = await testSchema.isValid({
        textField: "\uD83D\uDE00\uD83D\uDE01\uD83D\uDE02",
      });
      expect(result).toBe(true);
    });
  });

  describe("Path traversal attempts", () => {
    it("should accept path traversal with ../", async () => {
      const result = await testSchema.isValid({
        textField: "../../../etc/passwd",
      });
      expect(result).toBe(true);
    });

    it("should accept path traversal with .\\", async () => {
      const result = await testSchema.isValid({
        textField: "..\\..\\..\\windows\\system32",
      });
      expect(result).toBe(true);
    });

    it("should accept URL encoded path traversal", async () => {
      const result = await testSchema.isValid({
        textField: "%2e%2e%2f%2e%2e%2f%2e%2e%2f",
      });
      expect(result).toBe(true);
    });

    it("should accept double encoded path traversal", async () => {
      const result = await testSchema.isValid({
        textField: "%252e%252e%252f",
      });
      expect(result).toBe(true);
    });
  });

  describe("Command injection attempts", () => {
    it("should accept command with pipe", async () => {
      const result = await testSchema.isValid({
        textField: "test | cat /etc/passwd",
      });
      expect(result).toBe(true);
    });

    it("should accept command with semicolon", async () => {
      const result = await testSchema.isValid({
        textField: "test; rm -rf /",
      });
      expect(result).toBe(true);
    });

    it("should accept command with ampersand", async () => {
      const result = await testSchema.isValid({
        textField: "test && cat /etc/passwd",
      });
      expect(result).toBe(true);
    });

    it("should accept command with backticks", async () => {
      const result = await testSchema.isValid({
        textField: "test `whoami`",
      });
      expect(result).toBe(true);
    });

    it("should accept command with $() substitution", async () => {
      const result = await testSchema.isValid({
        textField: "test $(whoami)",
      });
      expect(result).toBe(true);
    });
  });

  describe("LDAP injection attempts", () => {
    it("should accept LDAP wildcard", async () => {
      const result = await testSchema.isValid({
        textField: "*",
      });
      expect(result).toBe(true);
    });

    it("should accept LDAP filter injection", async () => {
      const result = await testSchema.isValid({
        textField: "admin)(|(password=*))",
      });
      expect(result).toBe(true);
    });

    it("should accept LDAP null byte injection", async () => {
      const result = await testSchema.isValid({
        textField: "admin\0)(|(password=*))",
      });
      expect(result).toBe(true);
    });
  });

  describe("XML injection attempts", () => {
    it("should accept XML entity", async () => {
      const result = await testSchema.isValid({
        textField:
          "<?xml version='1.0'?><!DOCTYPE foo [<!ENTITY xxe SYSTEM 'file:///etc/passwd'>]><foo>&xxe;</foo>",
      });
      expect(result).toBe(true);
    });

    it("should accept XML CDATA", async () => {
      const result = await testSchema.isValid({
        textField: "<![CDATA[<script>alert('xss')</script>]]>",
      });
      expect(result).toBe(true);
    });
  });

  describe("NoSQL injection attempts", () => {
    it("should accept MongoDB $ne operator", async () => {
      const result = await testSchema.isValid({
        textField: '{"$ne": null}',
      });
      expect(result).toBe(true);
    });

    it("should accept MongoDB $gt operator", async () => {
      const result = await testSchema.isValid({
        textField: '{"$gt": ""}',
      });
      expect(result).toBe(true);
    });

    it("should accept MongoDB $where clause", async () => {
      const result = await testSchema.isValid({
        textField: '{"$where": "this.password == \'password\'"}',
      });
      expect(result).toBe(true);
    });
  });

  describe("Format string attacks", () => {
    it("should accept format string with %s", async () => {
      const result = await testSchema.isValid({
        textField: "%s%s%s%s%s%s%s%s%s%s",
      });
      expect(result).toBe(true);
    });

    it("should accept format string with %x", async () => {
      const result = await testSchema.isValid({
        textField: "%x%x%x%x%x%x%x%x%x%x",
      });
      expect(result).toBe(true);
    });

    it("should accept format string with %n", async () => {
      const result = await testSchema.isValid({
        textField: "%n%n%n%n%n%n%n%n%n%n",
      });
      expect(result).toBe(true);
    });
  });
});
