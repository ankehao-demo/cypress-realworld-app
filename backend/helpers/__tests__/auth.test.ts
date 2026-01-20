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
  const encodeBase64Url = (obj: Record<string, unknown>): string =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");
  return `${encodeBase64Url(header)}.${encodeBase64Url(payload)}.test-signature`;
};

// Common test header
const RS256_HEADER = { alg: "RS256" };

describe("Auth Utilities", () => {
  describe("extractBearerToken", () => {
    const validToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";

    test.each([
      ["Bearer", `Bearer ${validToken}`],
      ["bearer (lowercase)", `bearer ${validToken}`],
      ["BEARER (uppercase)", `BEARER ${validToken}`],
    ])("extracts token with %s prefix", (_, header) => {
      expect(extractBearerToken(header)).toBe(validToken);
    });

    test.each([
      ["undefined", undefined],
      ["empty string", ""],
      ["no Bearer prefix", validToken],
      ["Basic auth", "Basic dXNlcm5hbWU6cGFzc3dvcmQ="],
      ["Bearer with empty token", "Bearer "],
      ["Bearer with whitespace only", "Bearer    "],
      ["too many parts", "Bearer token extra"],
    ])("returns null for %s", (_, header) => {
      expect(extractBearerToken(header)).toBeNull();
    });
  });

  describe("isValidBearerHeader", () => {
    test("returns true for valid Bearer header", () => {
      expect(isValidBearerHeader("Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9")).toBe(true);
    });

    test.each([
      ["undefined", undefined],
      ["empty string", ""],
      ["Basic auth", "Basic dXNlcm5hbWU6cGFzc3dvcmQ="],
    ])("returns false for %s", (_, header) => {
      expect(isValidBearerHeader(header)).toBe(false);
    });
  });

  describe("decodeJwtPayload", () => {
    test("decodes valid JWT payload", () => {
      const token = createTestJwt(
        { alg: "RS256", typ: "JWT" },
        { sub: "user123", iss: "https://example.com", exp: 1234567890 }
      );
      expect(decodeJwtPayload(token)).toEqual({
        sub: "user123",
        iss: "https://example.com",
        exp: 1234567890,
      });
    });

    test.each([
      ["empty string", ""],
      ["null", null],
      ["undefined", undefined],
      ["number", 123],
      ["two parts", "header.payload"],
      ["four parts", "header.payload.signature.extra"],
      ["single part", "singlepart"],
      ["invalid base64", "header.!!!invalid!!!.signature"],
    ])("returns null for %s", (_, input) => {
      expect(decodeJwtPayload(input as string)).toBeNull();
    });

    test("returns null for non-JSON payload", () => {
      const invalidPayload = Buffer.from("not json").toString("base64url");
      expect(decodeJwtPayload(`header.${invalidPayload}.signature`)).toBeNull();
    });
  });

  describe("decodeJwtHeader", () => {
    test("decodes valid JWT header", () => {
      const token = createTestJwt({ alg: "RS256", typ: "JWT", kid: "key123" }, { sub: "user123" });
      expect(decodeJwtHeader(token)).toEqual({ alg: "RS256", typ: "JWT", kid: "key123" });
    });

    test.each([
      ["empty string", ""],
      ["null", null],
      ["two parts", "header.payload"],
      ["invalid base64", "!!!invalid!!!.payload.signature"],
    ])("returns null for %s", (_, input) => {
      expect(decodeJwtHeader(input as string)).toBeNull();
    });
  });

  describe("isJwtExpired", () => {
    test("returns true for expired token", () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600;
      const token = createTestJwt(RS256_HEADER, { sub: "user123", exp: pastExp });
      expect(isJwtExpired(token)).toBe(true);
    });

    test("returns false for valid token", () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const token = createTestJwt(RS256_HEADER, { sub: "user123", exp: futureExp });
      expect(isJwtExpired(token)).toBe(false);
    });

    test.each([
      ["without exp claim", { sub: "user123" }],
      ["with non-numeric exp", { sub: "user123", exp: "invalid" }],
    ])("returns null for token %s", (_, payload) => {
      expect(isJwtExpired(createTestJwt(RS256_HEADER, payload))).toBeNull();
    });

    test("returns null for invalid token", () => {
      expect(isJwtExpired("invalid")).toBeNull();
    });
  });

  describe("getJwtExpiration", () => {
    test("returns expiration timestamp for valid token", () => {
      const exp = 1234567890;
      expect(getJwtExpiration(createTestJwt(RS256_HEADER, { sub: "user123", exp }))).toBe(exp);
    });

    test("returns null for token without exp claim", () => {
      expect(getJwtExpiration(createTestJwt(RS256_HEADER, { sub: "user123" }))).toBeNull();
    });

    test("returns null for invalid token", () => {
      expect(getJwtExpiration("invalid")).toBeNull();
    });
  });

  describe("getJwtIssuer", () => {
    test("returns issuer for valid token", () => {
      const token = createTestJwt(RS256_HEADER, {
        sub: "user123",
        iss: "https://auth.example.com",
      });
      expect(getJwtIssuer(token)).toBe("https://auth.example.com");
    });

    test.each([
      ["without iss claim", { sub: "user123" }],
      ["with non-string iss", { sub: "user123", iss: 12345 }],
    ])("returns null for token %s", (_, payload) => {
      expect(getJwtIssuer(createTestJwt(RS256_HEADER, payload))).toBeNull();
    });

    test("returns null for invalid token", () => {
      expect(getJwtIssuer("invalid")).toBeNull();
    });
  });

  describe("getJwtSubject", () => {
    test("returns subject for valid token", () => {
      expect(getJwtSubject(createTestJwt(RS256_HEADER, { sub: "user123" }))).toBe("user123");
    });

    test.each([
      ["without sub claim", { iss: "https://example.com" }],
      ["with non-string sub", { sub: 12345 }],
    ])("returns null for token %s", (_, payload) => {
      expect(getJwtSubject(createTestJwt(RS256_HEADER, payload))).toBeNull();
    });

    test("returns null for invalid token", () => {
      expect(getJwtSubject("invalid")).toBeNull();
    });
  });

  describe("getJwtAudience", () => {
    test("returns string audience for valid token", () => {
      expect(getJwtAudience(createTestJwt(RS256_HEADER, { sub: "u", aud: "api://default" }))).toBe(
        "api://default"
      );
    });

    test("returns array audience for valid token", () => {
      expect(
        getJwtAudience(createTestJwt(RS256_HEADER, { sub: "u", aud: ["api1", "api2"] }))
      ).toEqual(["api1", "api2"]);
    });

    test.each([
      ["without aud claim", { sub: "user123" }],
      ["with numeric aud", { sub: "user123", aud: 12345 }],
      ["with mixed array aud", { sub: "user123", aud: ["api1", 123] }],
    ])("returns null for token %s", (_, payload) => {
      expect(getJwtAudience(createTestJwt(RS256_HEADER, payload))).toBeNull();
    });

    test("returns null for invalid token", () => {
      expect(getJwtAudience("invalid")).toBeNull();
    });
  });

  describe("validateJwtIssuer", () => {
    const issuer = "https://auth.example.com";

    test("returns true when issuer matches", () => {
      expect(
        validateJwtIssuer(createTestJwt(RS256_HEADER, { sub: "u", iss: issuer }), issuer)
      ).toBe(true);
    });

    test("returns false when issuer does not match", () => {
      expect(
        validateJwtIssuer(
          createTestJwt(RS256_HEADER, { sub: "u", iss: issuer }),
          "https://other.com"
        )
      ).toBe(false);
    });

    test("returns false for token without issuer", () => {
      expect(validateJwtIssuer(createTestJwt(RS256_HEADER, { sub: "u" }), issuer)).toBe(false);
    });

    test("returns false for invalid token", () => {
      expect(validateJwtIssuer("invalid", issuer)).toBe(false);
    });
  });

  describe("validateJwtAudience", () => {
    test("returns true when string audience matches", () => {
      expect(
        validateJwtAudience(
          createTestJwt(RS256_HEADER, { sub: "u", aud: "api://default" }),
          "api://default"
        )
      ).toBe(true);
    });

    test("returns true when audience is in array", () => {
      expect(
        validateJwtAudience(
          createTestJwt(RS256_HEADER, { sub: "u", aud: ["a1", "a2", "a3"] }),
          "a2"
        )
      ).toBe(true);
    });

    test("returns false when string audience does not match", () => {
      expect(
        validateJwtAudience(
          createTestJwt(RS256_HEADER, { sub: "u", aud: "api://default" }),
          "other"
        )
      ).toBe(false);
    });

    test("returns false when audience is not in array", () => {
      expect(
        validateJwtAudience(createTestJwt(RS256_HEADER, { sub: "u", aud: ["a1", "a2"] }), "a3")
      ).toBe(false);
    });

    test("returns false for token without audience", () => {
      expect(validateJwtAudience(createTestJwt(RS256_HEADER, { sub: "u" }), "api://default")).toBe(
        false
      );
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

    test.each([
      ["eu-west-1_poolId123", "eu-west-1"],
      ["ap-southeast-2_myPool", "ap-southeast-2"],
    ])("extracts region %s from pool ID", (poolId, expectedRegion) => {
      expect(buildCognitoJwtConfig(poolId).region).toBe(expectedRegion);
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

    test.each([
      ["null", null],
      ["undefined", undefined],
      ["string", "string"],
      ["number", 123],
      ["boolean", true],
      ["object without id", { name: "John" }],
      ["object with numeric id", { id: 123 }],
      ["object with null id", { id: null }],
      ["object with undefined id", { id: undefined }],
      ["object with empty string id", { id: "" }],
    ])("returns false for %s", (_, input) => {
      expect(isValidSessionUser(input)).toBe(false);
    });
  });

  describe("mapSubToId", () => {
    test("maps sub to id when id is not present", () => {
      const result = mapSubToId({ sub: "auth0|123", name: "John" });
      expect(result.id).toBe("auth0|123");
      expect(result.sub).toBe("auth0|123");
      expect(result.name).toBe("John");
    });

    test("preserves existing id when present", () => {
      expect(mapSubToId({ id: "existing-id", sub: "auth0|123", name: "John" }).id).toBe(
        "existing-id"
      );
    });

    test("returns user unchanged when no sub claim", () => {
      const user = { id: "user123", name: "John" };
      expect(mapSubToId(user)).toEqual(user);
    });

    test("handles user with non-string sub", () => {
      const user = { sub: 123, name: "John" } as unknown as Record<string, unknown>;
      expect(mapSubToId(user).id).toBeUndefined();
    });
  });

  describe("calculateSessionMaxAge", () => {
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    test("returns undefined when rememberMe is false", () => {
      expect(calculateSessionMaxAge(false)).toBeUndefined();
    });

    test("returns 30 days in milliseconds by default when rememberMe is true", () => {
      expect(calculateSessionMaxAge(true)).toBe(ONE_DAY_MS * 30);
    });

    test.each([
      [7, ONE_DAY_MS * 7],
      [1, ONE_DAY_MS],
    ])("returns %d days in milliseconds", (days, expected) => {
      expect(calculateSessionMaxAge(true, days)).toBe(expected);
    });

    test("returns undefined regardless of days when rememberMe is false", () => {
      expect(calculateSessionMaxAge(false, 7)).toBeUndefined();
      expect(calculateSessionMaxAge(false, 30)).toBeUndefined();
    });
  });

  describe("validateTokenStructure", () => {
    const providerTestCases = {
      auth0: {
        valid: {
          iss: "https://tenant.auth0.com/",
          sub: "auth0|123",
          aud: "https://api.example.com",
        },
        invalid: { iss: "https://tenant.auth0.com/", sub: "auth0|123" },
        invalidReason: "without aud",
      },
      okta: {
        valid: { iss: "https://tenant.okta.com/oauth2/default", sub: "user123", cid: "client123" },
        invalid: { iss: "https://tenant.okta.com/oauth2/default", sub: "user123" },
        invalidReason: "without cid",
      },
      google: {
        valid: { iss: "accounts.google.com", sub: "user123", email: "user@gmail.com" },
        invalid: { iss: "accounts.google.com", sub: "user123" },
        invalidReason: "without email",
      },
    };

    Object.entries(providerTestCases).forEach(([provider, { valid, invalid, invalidReason }]) => {
      describe(`${provider} tokens`, () => {
        test(`returns true for valid ${provider} token structure`, () => {
          expect(
            validateTokenStructure(
              createTestJwt(RS256_HEADER, valid),
              provider as "auth0" | "okta" | "google"
            )
          ).toBe(true);
        });

        test(`returns false for ${provider} token ${invalidReason}`, () => {
          expect(
            validateTokenStructure(
              createTestJwt(RS256_HEADER, invalid),
              provider as "auth0" | "okta" | "google"
            )
          ).toBe(false);
        });
      });
    });

    describe("Cognito tokens", () => {
      const cognitoBase = {
        iss: "https://cognito-idp.us-east-1.amazonaws.com/pool",
        sub: "user123",
      };

      test.each([
        ["access", true],
        ["id", true],
        ["refresh", false],
      ])("returns %s for Cognito token with token_use=%s", (tokenUse, expected) => {
        expect(
          validateTokenStructure(
            createTestJwt(RS256_HEADER, { ...cognitoBase, token_use: tokenUse }),
            "cognito"
          )
        ).toBe(expected);
      });

      test("returns false for Cognito token without token_use", () => {
        expect(validateTokenStructure(createTestJwt(RS256_HEADER, cognitoBase), "cognito")).toBe(
          false
        );
      });
    });

    describe("common validation", () => {
      test("returns false for token without iss", () => {
        expect(
          validateTokenStructure(createTestJwt(RS256_HEADER, { sub: "u", aud: "api" }), "auth0")
        ).toBe(false);
      });

      test("returns false for token without sub", () => {
        expect(
          validateTokenStructure(
            createTestJwt(RS256_HEADER, { iss: "https://example.com", aud: "api" }),
            "auth0"
          )
        ).toBe(false);
      });

      test.each(["auth0", "okta", "cognito", "google"] as const)(
        "returns false for invalid token with provider %s",
        (provider) => {
          expect(validateTokenStructure("invalid", provider)).toBe(false);
        }
      );
    });
  });
});
