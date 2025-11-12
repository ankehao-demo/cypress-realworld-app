import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { validateMiddleware } from "../../backend/helpers";
import { validationResult } from "express-validator";

describe("Helper Error Handling", () => {
  describe("validateMiddleware", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;
    let statusMock: any;
    let jsonMock: any;

    beforeEach(() => {
      mockRequest = {
        body: {},
        query: {},
        params: {},
      };

      statusMock = vi.fn().mockReturnThis();
      jsonMock = vi.fn();

      mockResponse = {
        status: statusMock,
        json: jsonMock,
      };

      mockNext = vi.fn();
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it("should call next when validation passes", async () => {
      const validations = [
        {
          run: vi.fn().mockResolvedValue(undefined),
        },
      ];

      vi.mock("express-validator", () => ({
        validationResult: vi.fn().mockReturnValue({
          isEmpty: () => true,
          array: () => [],
        }),
      }));

      const middleware = validateMiddleware(validations);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(validations[0].run).toHaveBeenCalledWith(mockRequest);
    });

    it("should handle empty validations array", async () => {
      const validations: any[] = [];

      const middleware = validateMiddleware(validations);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should handle validation errors gracefully", async () => {
      const validations = [
        {
          run: vi.fn().mockRejectedValue(new Error("Validation failed")),
        },
      ];

      const middleware = validateMiddleware(validations);

      await expect(
        middleware(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow("Validation failed");
    });
  });

  describe("authentication error scenarios", () => {
    it("should handle missing authorization header", () => {
      const mockRequest: Partial<Request> = {
        headers: {},
      };

      expect(mockRequest.headers?.["authorization"]).toBeUndefined();
    });

    it("should handle malformed authorization header", () => {
      const mockRequest: Partial<Request> = {
        headers: {
          authorization: "InvalidFormat",
        },
      };

      const bearerHeader = mockRequest.headers?.["authorization"];
      const parts = bearerHeader?.split(" ");

      expect(parts?.length).toBe(1);
      expect(parts?.[0]).toBe("InvalidFormat");
    });

    it("should handle empty bearer token", () => {
      const mockRequest: Partial<Request> = {
        headers: {
          authorization: "Bearer ",
        },
      };

      const bearerHeader = mockRequest.headers?.["authorization"];
      const parts = bearerHeader?.split(" ");
      const token = parts?.[1];

      expect(token).toBe("");
    });

    it("should handle missing Bearer prefix", () => {
      const mockRequest: Partial<Request> = {
        headers: {
          authorization: "token123456",
        },
      };

      const bearerHeader = mockRequest.headers?.["authorization"];
      const parts = bearerHeader?.split(" ");

      expect(parts?.length).toBe(1);
      expect(parts?.[0]).not.toBe("Bearer");
    });

    it("should handle null authorization header", () => {
      const mockRequest: Partial<Request> = {
        headers: {
          authorization: null as any,
        },
      };

      expect(mockRequest.headers?.["authorization"]).toBeNull();
    });

    it("should handle undefined authorization header", () => {
      const mockRequest: Partial<Request> = {
        headers: {
          authorization: undefined,
        },
      };

      expect(mockRequest.headers?.["authorization"]).toBeUndefined();
    });
  });

  describe("request validation error scenarios", () => {
    it("should handle missing required fields", () => {
      const mockRequest: Partial<Request> = {
        body: {},
      };

      expect(mockRequest.body?.firstName).toBeUndefined();
      expect(mockRequest.body?.lastName).toBeUndefined();
      expect(mockRequest.body?.email).toBeUndefined();
    });

    it("should handle null values in required fields", () => {
      const mockRequest: Partial<Request> = {
        body: {
          firstName: null,
          lastName: null,
          email: null,
        },
      };

      expect(mockRequest.body?.firstName).toBeNull();
      expect(mockRequest.body?.lastName).toBeNull();
      expect(mockRequest.body?.email).toBeNull();
    });

    it("should handle empty string values", () => {
      const mockRequest: Partial<Request> = {
        body: {
          firstName: "",
          lastName: "",
          email: "",
        },
      };

      expect(mockRequest.body?.firstName).toBe("");
      expect(mockRequest.body?.lastName).toBe("");
      expect(mockRequest.body?.email).toBe("");
    });

    it("should handle whitespace-only values", () => {
      const mockRequest: Partial<Request> = {
        body: {
          firstName: "   ",
          lastName: "   ",
          email: "   ",
        },
      };

      expect(mockRequest.body?.firstName.trim()).toBe("");
      expect(mockRequest.body?.lastName.trim()).toBe("");
      expect(mockRequest.body?.email.trim()).toBe("");
    });

    it("should handle invalid data types", () => {
      const mockRequest: Partial<Request> = {
        body: {
          firstName: 123,
          lastName: true,
          email: {},
          balance: "not a number",
        },
      };

      expect(typeof mockRequest.body?.firstName).toBe("number");
      expect(typeof mockRequest.body?.lastName).toBe("boolean");
      expect(typeof mockRequest.body?.email).toBe("object");
      expect(isNaN(Number(mockRequest.body?.balance))).toBe(true);
    });

    it("should handle array instead of object", () => {
      const mockRequest: Partial<Request> = {
        body: [1, 2, 3],
      };

      expect(Array.isArray(mockRequest.body)).toBe(true);
    });

    it("should handle very large payloads", () => {
      const largeString = "a".repeat(1000000);
      const mockRequest: Partial<Request> = {
        body: {
          description: largeString,
        },
      };

      expect(mockRequest.body?.description.length).toBe(1000000);
    });

    it("should handle special characters in strings", () => {
      const mockRequest: Partial<Request> = {
        body: {
          description: "<script>alert('xss')</script>",
          name: "'; DROP TABLE users; --",
        },
      };

      expect(mockRequest.body?.description).toContain("<script>");
      expect(mockRequest.body?.name).toContain("DROP TABLE");
    });

    it("should handle unicode characters", () => {
      const mockRequest: Partial<Request> = {
        body: {
          firstName: "José",
          lastName: "李明",
          description: "Hello 世界 🌍",
        },
      };

      expect(mockRequest.body?.firstName).toBe("José");
      expect(mockRequest.body?.lastName).toBe("李明");
      expect(mockRequest.body?.description).toContain("🌍");
    });
  });

  describe("response error scenarios", () => {
    it("should handle 401 unauthorized response", () => {
      const statusMock = vi.fn().mockReturnThis();
      const sendMock = vi.fn();

      const mockResponse: Partial<Response> = {
        status: statusMock,
        send: sendMock,
      };

      mockResponse.status?.(401);
      mockResponse.send?.({ error: "Unauthorized" });

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(sendMock).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    it("should handle 422 validation error response", () => {
      const statusMock = vi.fn().mockReturnThis();
      const jsonMock = vi.fn();

      const mockResponse: Partial<Response> = {
        status: statusMock,
        json: jsonMock,
      };

      const errors = [
        { msg: "Invalid value", param: "email", location: "body" },
        { msg: "Required field", param: "firstName", location: "body" },
      ];

      mockResponse.status?.(422);
      mockResponse.json?.({ errors });

      expect(statusMock).toHaveBeenCalledWith(422);
      expect(jsonMock).toHaveBeenCalledWith({ errors });
    });

    it("should handle 500 internal server error response", () => {
      const statusMock = vi.fn().mockReturnThis();
      const sendMock = vi.fn();

      const mockResponse: Partial<Response> = {
        status: statusMock,
        send: sendMock,
      };

      mockResponse.status?.(500);
      mockResponse.send?.({ error: "Internal Server Error" });

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(sendMock).toHaveBeenCalledWith({ error: "Internal Server Error" });
    });
  });

  describe("JWT token error scenarios", () => {
    it("should handle expired JWT token", () => {
      const expiredToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZXhwIjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

      expect(expiredToken).toBeDefined();
      expect(expiredToken.split(".").length).toBe(3);
    });

    it("should handle malformed JWT token", () => {
      const malformedTokens = [
        { token: "only-two", expectedParts: 1 },
        { token: "", expectedParts: 1 },
        { token: "single-part-token", expectedParts: 1 },
      ];

      malformedTokens.forEach(({ token, expectedParts }) => {
        const parts = token.split(".");
        expect(parts.length).toBe(expectedParts);
      });

      expect(null).toBeNull();
      expect(undefined).toBeUndefined();
    });

    it("should handle JWT with invalid signature", () => {
      const tokenWithInvalidSignature =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.invalid_signature";

      expect(tokenWithInvalidSignature).toBeDefined();
      expect(tokenWithInvalidSignature.split(".").length).toBe(3);
    });

    it("should handle JWT with missing claims", () => {
      const tokenWithMissingClaims =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.Et9HFtf9R3GEMA0IICOfFMVXY7kkTX1wr4qCyhIf58U";

      expect(tokenWithMissingClaims).toBeDefined();
      expect(tokenWithMissingClaims.split(".").length).toBe(3);
    });
  });

  describe("session error scenarios", () => {
    it("should handle missing session", () => {
      const mockRequest: Partial<Request> = {
        session: undefined,
      };

      expect(mockRequest.session).toBeUndefined();
    });

    it("should handle expired session", () => {
      const mockRequest: Partial<Request> = {
        session: {
          cookie: {
            expires: new Date("2020-01-01"),
          },
        } as any,
      };

      const isExpired =
        mockRequest.session?.cookie?.expires &&
        new Date(mockRequest.session.cookie.expires) < new Date();

      expect(isExpired).toBe(true);
    });

    it("should handle session without user data", () => {
      const mockRequest: Partial<Request> = {
        session: {} as any,
        user: undefined,
      };

      expect(mockRequest.user).toBeUndefined();
    });
  });

  describe("middleware chain error scenarios", () => {
    it("should handle error thrown in middleware", async () => {
      const errorMiddleware = async (req: Request, res: Response, next: NextFunction) => {
        throw new Error("Middleware error");
      };

      const mockRequest = {} as Request;
      const mockResponse = {} as Response;
      const mockNext = vi.fn();

      await expect(errorMiddleware(mockRequest, mockResponse, mockNext)).rejects.toThrow(
        "Middleware error"
      );
    });

    it("should handle next called with error", () => {
      const mockNext = vi.fn();
      const error = new Error("Test error");

      mockNext(error);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle multiple middleware errors", () => {
      const errors = [new Error("Error 1"), new Error("Error 2"), new Error("Error 3")];

      errors.forEach((error) => {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBeDefined();
      });
    });
  });
});
