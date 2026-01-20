import { describe, expect, test } from "vitest";
import {
  extractBearerToken,
  isValidBearerHeader,
  decodeJwtPayload,
  decodeJwtHeader,
  isJwtExpired,
  getJwtExpiration,
  getJwtIssuer,
  getJwtSubject,
  getJwtAudience,
  validateJwtIssuer,
  validateJwtAudience,
  buildAuth0JwtConfig,
  buildOktaJwtConfig,
  buildCognitoJwtConfig,
  buildGoogleJwtConfig,
  isValidSessionUser,
  mapSubToId,
  calculateSessionMaxAge,
  validateTokenStructure,
} from "../auth";

// Helper function to create a valid JWT token for testing
const createTestJwt = (
  header: Record<string, unknown>,
  payload: Record<string, unknown>
): string => {
  const encodeBase64Url = (obj: Record<string, unknown>): string => {
    return Buffer.from(JSON.stringify(obj)).toString("base64url");
  };
  const headerEncoded = encodeBase64Url(header);
  const payloadEncoded = encodeBase64Url(payload);
  // Signature is not validated in these tests, so we use a placeholder
  const signature = "test-signature";
  return `${headerEncoded}.${payloadEncoded}.${signature}`;
};

describe("Auth Utilities", () => {
  describe("extractBearerToken", () => {
    test("extracts token from valid Bearer header", () => {
      const token = extractBearerToken("Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
      expect(token).toBe("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
    });

    test("extracts token with lowercase bearer", () => {
      const token = extractBearerToken("bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
      expect(token).toBe("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
    });

    test("extracts token with mixed case Bearer", () => {
      const token = extractBearerToken("BEARER eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
      expect(token).toBe("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
    });

    test("returns null for undefined header", () => {
      const token = extractBearerToken(undefined);
      expect(token).toBeNull();
    });

    test("returns null for empty string", () => {
      const token = extractBearerToken("");
      expect(token).toBeNull();
    });

    test("returns null for header without Bearer prefix", () => {
      const token = extractBearerToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
      expect(token).toBeNull();
    });

    test("returns null for Basic auth header", () => {
      const token = extractBearerToken("Basic dXNlcm5hbWU6cGFzc3dvcmQ=");
      expect(token).toBeNull();
    });

    test("returns null for Bearer with empty token", () => {
      const token = extractBearerToken("Bearer ");
      expect(token).toBeNull();
    });

    test("returns null for Bearer with whitespace only token", () => {
      const token = extractBearerToken("Bearer    ");
      expect(token).toBeNull();
    });

    test("returns null for header with too many parts", () => {
      const token = extractBearerToken("Bearer token extra");
      expect(token).toBeNull();
    });
  });

  describe("isValidBearerHeader", () => {
    test("returns true for valid Bearer header", () => {
      expect(isValidBearerHeader("Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9")).toBe(true);
    });

    test("returns false for undefined header", () => {
      expect(isValidBearerHeader(undefined)).toBe(false);
    });

    test("returns false for invalid header", () => {
      expect(isValidBearerHeader("Basic dXNlcm5hbWU6cGFzc3dvcmQ=")).toBe(false);
    });

    test("returns false for empty string", () => {
      expect(isValidBearerHeader("")).toBe(false);
    });
  });

  describe("decodeJwtPayload", () => {
    test("decodes valid JWT payload", () => {
      const token = createTestJwt(
        { alg: "RS256", typ: "JWT" },
        { sub: "user123", iss: "https://example.com", exp: 1234567890 }
      );
      const payload = decodeJwtPayload(token);
      expect(payload).toEqual({
        sub: "user123",
        iss: "https://example.com",
        exp: 1234567890,
      });
    });

    test("returns null for empty string", () => {
      expect(decodeJwtPayload("")).toBeNull();
    });

    test("returns null for non-string input", () => {
      expect(decodeJwtPayload(null as unknown as string)).toBeNull();
      expect(decodeJwtPayload(undefined as unknown as string)).toBeNull();
      expect(decodeJwtPayload(123 as unknown as string)).toBeNull();
    });

    test("returns null for token with wrong number of parts", () => {
      expect(decodeJwtPayload("header.payload")).toBeNull();
      expect(decodeJwtPayload("header.payload.signature.extra")).toBeNull();
      expect(decodeJwtPayload("singlepart")).toBeNull();
    });

    test("returns null for token with invalid base64 payload", () => {
      expect(decodeJwtPayload("header.!!!invalid!!!.signature")).toBeNull();
    });

    test("returns null for token with non-JSON payload", () => {
      const invalidPayload = Buffer.from("not json").toString("base64url");
      expect(decodeJwtPayload(`header.${invalidPayload}.signature`)).toBeNull();
    });
  });

  describe("decodeJwtHeader", () => {
    test("decodes valid JWT header", () => {
      const token = createTestJwt({ alg: "RS256", typ: "JWT", kid: "key123" }, { sub: "user123" });
      const header = decodeJwtHeader(token);
      expect(header).toEqual({
        alg: "RS256",
        typ: "JWT",
        kid: "key123",
      });
    });

    test("returns null for empty string", () => {
      expect(decodeJwtHeader("")).toBeNull();
    });

    test("returns null for non-string input", () => {
      expect(decodeJwtHeader(null as unknown as string)).toBeNull();
    });

    test("returns null for token with wrong number of parts", () => {
      expect(decodeJwtHeader("header.payload")).toBeNull();
    });

    test("returns null for token with invalid base64 header", () => {
      expect(decodeJwtHeader("!!!invalid!!!.payload.signature")).toBeNull();
    });
  });

  describe("isJwtExpired", () => {
    test("returns true for expired token", () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const token = createTestJwt({ alg: "RS256" }, { sub: "user123", exp: pastExp });
      expect(isJwtExpired(token)).toBe(true);
    });

    test("returns false for valid token", () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const token = createTestJwt({ alg: "RS256" }, { sub: "user123", exp: futureExp });
      expect(isJwtExpired(token)).toBe(false);
    });

    test("returns null for token without exp claim", () => {
      const token = createTestJwt({ alg: "RS256" }, { sub: "user123" });
      expect(isJwtExpired(token)).toBeNull();
    });

    test("returns null for token with non-numeric exp", () => {
      const token = createTestJwt({ alg: "RS256" }, { sub: "user123", exp: "invalid" });
      expect(isJwtExpired(token)).toBeNull();
    });

    test("returns null for invalid token", () => {
      expect(isJwtExpired("invalid")).toBeNull();
    });
  });

  describe("getJwtExpiration", () => {
    test("returns expiration timestamp for valid token", () => {
      const exp = 1234567890;
      const token = createTestJwt({ alg: "RS256" }, { sub: "user123", exp });
      expect(getJwtExpiration(token)).toBe(exp);
    });

    test("returns null for token without exp claim", () => {
      const token = createTestJwt({ alg: "RS256" }, { sub: "user123" });
      expect(getJwtExpiration(token)).toBeNull();
    });

    test("returns null for invalid token", () => {
      expect(getJwtExpiration("invalid")).toBeNull();
    });
  });

  describe("getJwtIssuer", () => {
    test("returns issuer for valid token", () => {
      const token = createTestJwt(
        { alg: "RS256" },
        { sub: "user123", iss: "https://auth.example.com" }
      );
      expect(getJwtIssuer(token)).toBe("https://auth.example.com");
    });

    test("returns null for token without iss claim", () => {
      const token = createTestJwt({ alg: "RS256" }, { sub: "user123" });
      expect(getJwtIssuer(token)).toBeNull();
    });

    test("returns null for token with non-string iss", () => {
      const token = createTestJwt({ alg: "RS256" }, { sub: "user123", iss: 12345 });
      expect(getJwtIssuer(token)).toBeNull();
    });

    test("returns null for invalid token", () => {
      expect(getJwtIssuer("invalid")).toBeNull();
    });
  });

  describe("getJwtSubject", () => {
    test("returns subject for valid token", () => {
      const token = createTestJwt({ alg: "RS256" }, { sub: "user123" });
      expect(getJwtSubject(token)).toBe("user123");
    });

    test("returns null for token without sub claim", () => {
      const token = createTestJwt({ alg: "RS256" }, { iss: "https://example.com" });
      expect(getJwtSubject(token)).toBeNull();
    });

    test("returns null for token with non-string sub", () => {
      const token = createTestJwt({ alg: "RS256" }, { sub: 12345 });
      expect(getJwtSubject(token)).toBeNull();
    });

    test("returns null for invalid token", () => {
      expect(getJwtSubject("invalid")).toBeNull();
    });
  });

  describe("getJwtAudience", () => {
    test("returns string audience for valid token", () => {
      const token = createTestJwt({ alg: "RS256" }, { sub: "user123", aud: "api://default" });
      expect(getJwtAudience(token)).toBe("api://default");
    });

    test("returns array audience for valid token", () => {
      const token = createTestJwt({ alg: "RS256" }, { sub: "user123", aud: ["api1", "api2"] });
      expect(getJwtAudience(token)).toEqual(["api1", "api2"]);
    });

    test("returns null for token without aud claim", () => {
      const token = createTestJwt({ alg: "RS256" }, { sub: "user123" });
      expect(getJwtAudience(token)).toBeNull();
    });

    test("returns null for token with invalid aud type", () => {
      const token = createTestJwt({ alg: "RS256" }, { sub: "user123", aud: 12345 });
      expect(getJwtAudience(token)).toBeNull();
    });

    test("returns null for token with mixed array aud", () => {
      const token = createTestJwt({ alg: "RS256" }, { sub: "user123", aud: ["api1", 123] });
      expect(getJwtAudience(token)).toBeNull();
    });

    test("returns null for invalid token", () => {
      expect(getJwtAudience("invalid")).toBeNull();
    });
  });

  describe("validateJwtIssuer", () => {
    test("returns true when issuer matches", () => {
      const token = createTestJwt(
        { alg: "RS256" },
        { sub: "user123", iss: "https://auth.example.com" }
      );
      expect(validateJwtIssuer(token, "https://auth.example.com")).toBe(true);
    });

    test("returns false when issuer does not match", () => {
      const token = createTestJwt(
        { alg: "RS256" },
        { sub: "user123", iss: "https://auth.example.com" }
      );
      expect(validateJwtIssuer(token, "https://other.example.com")).toBe(false);
    });

    test("returns false for token without issuer", () => {
      const token = createTestJwt({ alg: "RS256" }, { sub: "user123" });
      expect(validateJwtIssuer(token, "https://auth.example.com")).toBe(false);
    });

    test("returns false for invalid token", () => {
      expect(validateJwtIssuer("invalid", "https://auth.example.com")).toBe(false);
    });
  });

  describe("validateJwtAudience", () => {
    test("returns true when string audience matches", () => {
      const token = createTestJwt({ alg: "RS256" }, { sub: "user123", aud: "api://default" });
      expect(validateJwtAudience(token, "api://default")).toBe(true);
    });

    test("returns true when audience is in array", () => {
      const token = createTestJwt(
        { alg: "RS256" },
        { sub: "user123", aud: ["api1", "api2", "api3"] }
      );
      expect(validateJwtAudience(token, "api2")).toBe(true);
    });

    test("returns false when string audience does not match", () => {
      const token = createTestJwt({ alg: "RS256" }, { sub: "user123", aud: "api://default" });
      expect(validateJwtAudience(token, "api://other")).toBe(false);
    });

    test("returns false when audience is not in array", () => {
      const token = createTestJwt({ alg: "RS256" }, { sub: "user123", aud: ["api1", "api2"] });
      expect(validateJwtAudience(token, "api3")).toBe(false);
    });

    test("returns false for token without audience", () => {
      const token = createTestJwt({ alg: "RS256" }, { sub: "user123" });
      expect(validateJwtAudience(token, "api://default")).toBe(false);
    });

    test("returns false for invalid token", () => {
      expect(validateJwtAudience("invalid", "api://default")).toBe(false);
    });
  });

  describe("buildAuth0JwtConfig", () => {
    test("builds correct Auth0 configuration", () => {
      const config = buildAuth0JwtConfig("tenant.auth0.com", "https://api.example.com");
      expect(config).toEqual({
        domain: "tenant.auth0.com",
        audience: "https://api.example.com",
        issuer: "https://tenant.auth0.com/",
        jwksUri: "https://tenant.auth0.com/.well-known/jwks.json",
        algorithms: ["RS256"],
      });
    });

    test("handles different domain formats", () => {
      const config = buildAuth0JwtConfig("my-company.us.auth0.com", "api://my-api");
      expect(config.issuer).toBe("https://my-company.us.auth0.com/");
      expect(config.jwksUri).toBe("https://my-company.us.auth0.com/.well-known/jwks.json");
    });
  });

  describe("buildOktaJwtConfig", () => {
    test("builds correct Okta configuration", () => {
      const config = buildOktaJwtConfig("tenant.okta.com", "client123");
      expect(config).toEqual({
        domain: "tenant.okta.com",
        clientId: "client123",
        issuer: "https://tenant.okta.com/oauth2/default",
        audience: "api://default",
      });
    });

    test("handles different domain formats", () => {
      const config = buildOktaJwtConfig("my-company.oktapreview.com", "0oa1234567890");
      expect(config.issuer).toBe("https://my-company.oktapreview.com/oauth2/default");
    });
  });

  describe("buildCognitoJwtConfig", () => {
    test("builds correct Cognito configuration", () => {
      const config = buildCognitoJwtConfig("us-east-1_abc123XYZ");
      expect(config).toEqual({
        userPoolId: "us-east-1_abc123XYZ",
        region: "us-east-1",
        issuer: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_abc123XYZ",
        jwksUri:
          "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_abc123XYZ/.well-known/jwks.json",
        algorithms: ["RS256"],
      });
    });

    test("extracts region from different pool IDs", () => {
      const config1 = buildCognitoJwtConfig("eu-west-1_poolId123");
      expect(config1.region).toBe("eu-west-1");

      const config2 = buildCognitoJwtConfig("ap-southeast-2_myPool");
      expect(config2.region).toBe("ap-southeast-2");
    });
  });

  describe("buildGoogleJwtConfig", () => {
    test("builds correct Google configuration", () => {
      const config = buildGoogleJwtConfig("123456789.apps.googleusercontent.com");
      expect(config).toEqual({
        clientId: "123456789.apps.googleusercontent.com",
        issuer: "accounts.google.com",
        jwksUri: "https://www.googleapis.com/oauth2/v3/certs",
        algorithms: ["RS256"],
      });
    });

    test("uses fixed issuer and jwksUri regardless of clientId", () => {
      const config = buildGoogleJwtConfig("different-client-id");
      expect(config.issuer).toBe("accounts.google.com");
      expect(config.jwksUri).toBe("https://www.googleapis.com/oauth2/v3/certs");
    });
  });

  describe("isValidSessionUser", () => {
    test("returns true for user with valid id", () => {
      expect(isValidSessionUser({ id: "user123" })).toBe(true);
    });

    test("returns true for user with id and other properties", () => {
      expect(isValidSessionUser({ id: "user123", name: "John", email: "john@example.com" })).toBe(
        true
      );
    });

    test("returns false for null", () => {
      expect(isValidSessionUser(null)).toBe(false);
    });

    test("returns false for undefined", () => {
      expect(isValidSessionUser(undefined)).toBe(false);
    });

    test("returns false for non-object", () => {
      expect(isValidSessionUser("string")).toBe(false);
      expect(isValidSessionUser(123)).toBe(false);
      expect(isValidSessionUser(true)).toBe(false);
    });

    test("returns false for object without id", () => {
      expect(isValidSessionUser({ name: "John" })).toBe(false);
    });

    test("returns false for object with non-string id", () => {
      expect(isValidSessionUser({ id: 123 })).toBe(false);
      expect(isValidSessionUser({ id: null })).toBe(false);
      expect(isValidSessionUser({ id: undefined })).toBe(false);
    });

    test("returns false for object with empty string id", () => {
      expect(isValidSessionUser({ id: "" })).toBe(false);
    });
  });

  describe("mapSubToId", () => {
    test("maps sub to id when id is not present", () => {
      const user = { sub: "auth0|123", name: "John" };
      const result = mapSubToId(user);
      expect(result.id).toBe("auth0|123");
      expect(result.sub).toBe("auth0|123");
      expect(result.name).toBe("John");
    });

    test("preserves existing id when present", () => {
      const user = { id: "existing-id", sub: "auth0|123", name: "John" };
      const result = mapSubToId(user);
      expect(result.id).toBe("existing-id");
    });

    test("returns user unchanged when no sub claim", () => {
      const user = { id: "user123", name: "John" };
      const result = mapSubToId(user);
      expect(result).toEqual(user);
    });

    test("handles user with non-string sub", () => {
      const user = { sub: 123, name: "John" } as unknown as Record<string, unknown>;
      const result = mapSubToId(user);
      expect(result.id).toBeUndefined();
    });
  });

  describe("calculateSessionMaxAge", () => {
    test("returns undefined when rememberMe is false", () => {
      expect(calculateSessionMaxAge(false)).toBeUndefined();
    });

    test("returns 30 days in milliseconds by default when rememberMe is true", () => {
      const thirtyDaysMs = 24 * 60 * 60 * 1000 * 30;
      expect(calculateSessionMaxAge(true)).toBe(thirtyDaysMs);
    });

    test("returns custom days in milliseconds", () => {
      const sevenDaysMs = 24 * 60 * 60 * 1000 * 7;
      expect(calculateSessionMaxAge(true, 7)).toBe(sevenDaysMs);
    });

    test("returns 1 day in milliseconds", () => {
      const oneDayMs = 24 * 60 * 60 * 1000;
      expect(calculateSessionMaxAge(true, 1)).toBe(oneDayMs);
    });

    test("returns undefined regardless of days when rememberMe is false", () => {
      expect(calculateSessionMaxAge(false, 7)).toBeUndefined();
      expect(calculateSessionMaxAge(false, 30)).toBeUndefined();
    });
  });

  describe("validateTokenStructure", () => {
    describe("Auth0 tokens", () => {
      test("returns true for valid Auth0 token structure", () => {
        const token = createTestJwt(
          { alg: "RS256" },
          { iss: "https://tenant.auth0.com/", sub: "auth0|123", aud: "https://api.example.com" }
        );
        expect(validateTokenStructure(token, "auth0")).toBe(true);
      });

      test("returns false for Auth0 token without aud", () => {
        const token = createTestJwt(
          { alg: "RS256" },
          { iss: "https://tenant.auth0.com/", sub: "auth0|123" }
        );
        expect(validateTokenStructure(token, "auth0")).toBe(false);
      });
    });

    describe("Okta tokens", () => {
      test("returns true for valid Okta token structure", () => {
        const token = createTestJwt(
          { alg: "RS256" },
          { iss: "https://tenant.okta.com/oauth2/default", sub: "user123", cid: "client123" }
        );
        expect(validateTokenStructure(token, "okta")).toBe(true);
      });

      test("returns false for Okta token without cid", () => {
        const token = createTestJwt(
          { alg: "RS256" },
          { iss: "https://tenant.okta.com/oauth2/default", sub: "user123" }
        );
        expect(validateTokenStructure(token, "okta")).toBe(false);
      });
    });

    describe("Cognito tokens", () => {
      test("returns true for valid Cognito access token", () => {
        const token = createTestJwt(
          { alg: "RS256" },
          {
            iss: "https://cognito-idp.us-east-1.amazonaws.com/pool",
            sub: "user123",
            token_use: "access",
          }
        );
        expect(validateTokenStructure(token, "cognito")).toBe(true);
      });

      test("returns true for valid Cognito id token", () => {
        const token = createTestJwt(
          { alg: "RS256" },
          {
            iss: "https://cognito-idp.us-east-1.amazonaws.com/pool",
            sub: "user123",
            token_use: "id",
          }
        );
        expect(validateTokenStructure(token, "cognito")).toBe(true);
      });

      test("returns false for Cognito token without token_use", () => {
        const token = createTestJwt(
          { alg: "RS256" },
          { iss: "https://cognito-idp.us-east-1.amazonaws.com/pool", sub: "user123" }
        );
        expect(validateTokenStructure(token, "cognito")).toBe(false);
      });

      test("returns false for Cognito token with invalid token_use", () => {
        const token = createTestJwt(
          { alg: "RS256" },
          {
            iss: "https://cognito-idp.us-east-1.amazonaws.com/pool",
            sub: "user123",
            token_use: "refresh",
          }
        );
        expect(validateTokenStructure(token, "cognito")).toBe(false);
      });
    });

    describe("Google tokens", () => {
      test("returns true for valid Google token structure", () => {
        const token = createTestJwt(
          { alg: "RS256" },
          { iss: "accounts.google.com", sub: "user123", email: "user@gmail.com" }
        );
        expect(validateTokenStructure(token, "google")).toBe(true);
      });

      test("returns false for Google token without email", () => {
        const token = createTestJwt(
          { alg: "RS256" },
          { iss: "accounts.google.com", sub: "user123" }
        );
        expect(validateTokenStructure(token, "google")).toBe(false);
      });
    });

    describe("common validation", () => {
      test("returns false for token without iss", () => {
        const token = createTestJwt({ alg: "RS256" }, { sub: "user123", aud: "api" });
        expect(validateTokenStructure(token, "auth0")).toBe(false);
      });

      test("returns false for token without sub", () => {
        const token = createTestJwt({ alg: "RS256" }, { iss: "https://example.com", aud: "api" });
        expect(validateTokenStructure(token, "auth0")).toBe(false);
      });

      test("returns false for invalid token", () => {
        expect(validateTokenStructure("invalid", "auth0")).toBe(false);
        expect(validateTokenStructure("invalid", "okta")).toBe(false);
        expect(validateTokenStructure("invalid", "cognito")).toBe(false);
        expect(validateTokenStructure("invalid", "google")).toBe(false);
      });
    });
  });
});
