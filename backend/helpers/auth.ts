/**
 * Pure authentication validation utilities
 * These functions can be tested in isolation without database or Express dependencies
 */

/**
 * Extracts the bearer token from an Authorization header
 * @param authHeader - The Authorization header value (e.g., "Bearer eyJhbGc...")
 * @returns The token string if valid, null otherwise
 */
export const extractBearerToken = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return null;
  }

  const token = parts[1];
  if (!token || token.trim() === "") {
    return null;
  }

  return token;
};

/**
 * Validates that an authorization header has the correct Bearer format
 * @param authHeader - The Authorization header value
 * @returns true if the header is a valid Bearer token format
 */
export const isValidBearerHeader = (authHeader: string | undefined): boolean => {
  return extractBearerToken(authHeader) !== null;
};

/**
 * Decodes a JWT token payload without verification
 * This is useful for extracting claims for logging or debugging
 * WARNING: This does NOT verify the token signature - do not use for authentication
 * @param token - The JWT token string
 * @returns The decoded payload object, or null if invalid
 */
export const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  try {
    const payload = parts[1];
    const decoded = Buffer.from(payload, "base64url").toString("utf-8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

/**
 * Decodes a JWT token header without verification
 * @param token - The JWT token string
 * @returns The decoded header object, or null if invalid
 */
export const decodeJwtHeader = (token: string): Record<string, unknown> | null => {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  try {
    const header = parts[0];
    const decoded = Buffer.from(header, "base64url").toString("utf-8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

/**
 * Checks if a JWT token has expired based on the exp claim
 * @param token - The JWT token string
 * @returns true if expired, false if valid, null if no exp claim or invalid token
 */
export const isJwtExpired = (token: string): boolean | null => {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
};

/**
 * Gets the expiration time from a JWT token
 * @param token - The JWT token string
 * @returns The expiration timestamp in seconds, or null if invalid
 */
export const getJwtExpiration = (token: string): number | null => {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") {
    return null;
  }

  return payload.exp;
};

/**
 * Gets the issuer (iss) claim from a JWT token
 * @param token - The JWT token string
 * @returns The issuer string, or null if invalid
 */
export const getJwtIssuer = (token: string): string | null => {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.iss !== "string") {
    return null;
  }

  return payload.iss;
};

/**
 * Gets the subject (sub) claim from a JWT token
 * @param token - The JWT token string
 * @returns The subject string, or null if invalid
 */
export const getJwtSubject = (token: string): string | null => {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.sub !== "string") {
    return null;
  }

  return payload.sub;
};

/**
 * Gets the audience (aud) claim from a JWT token
 * @param token - The JWT token string
 * @returns The audience (string or array), or null if invalid
 */
export const getJwtAudience = (token: string): string | string[] | null => {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.aud) {
    return null;
  }

  if (typeof payload.aud === "string") {
    return payload.aud;
  }

  if (Array.isArray(payload.aud) && payload.aud.every((a) => typeof a === "string")) {
    return payload.aud as string[];
  }

  return null;
};

/**
 * Validates that a JWT token has the expected issuer
 * @param token - The JWT token string
 * @param expectedIssuer - The expected issuer value
 * @returns true if the issuer matches, false otherwise
 */
export const validateJwtIssuer = (token: string, expectedIssuer: string): boolean => {
  const issuer = getJwtIssuer(token);
  return issuer === expectedIssuer;
};

/**
 * Validates that a JWT token has the expected audience
 * @param token - The JWT token string
 * @param expectedAudience - The expected audience value
 * @returns true if the audience matches (or is in the array), false otherwise
 */
export const validateJwtAudience = (token: string, expectedAudience: string): boolean => {
  const audience = getJwtAudience(token);
  if (!audience) {
    return false;
  }

  if (typeof audience === "string") {
    return audience === expectedAudience;
  }

  return audience.includes(expectedAudience);
};

export interface Auth0JwtConfig {
  domain: string;
  audience: string;
  issuer: string;
  jwksUri: string;
  algorithms: string[];
}

/**
 * Builds Auth0 JWT configuration from domain and audience
 * @param domain - The Auth0 domain (e.g., "tenant.auth0.com")
 * @param audience - The API audience identifier
 * @returns Auth0 JWT configuration object
 */
export const buildAuth0JwtConfig = (domain: string, audience: string): Auth0JwtConfig => {
  return {
    domain,
    audience,
    issuer: `https://${domain}/`,
    jwksUri: `https://${domain}/.well-known/jwks.json`,
    algorithms: ["RS256"],
  };
};

export interface OktaJwtConfig {
  domain: string;
  clientId: string;
  issuer: string;
  audience: string;
}

/**
 * Builds Okta JWT configuration from domain and client ID
 * @param domain - The Okta domain (e.g., "tenant.okta.com")
 * @param clientId - The Okta client ID
 * @returns Okta JWT configuration object
 */
export const buildOktaJwtConfig = (domain: string, clientId: string): OktaJwtConfig => {
  return {
    domain,
    clientId,
    issuer: `https://${domain}/oauth2/default`,
    audience: "api://default",
  };
};

export interface CognitoJwtConfig {
  userPoolId: string;
  region: string;
  issuer: string;
  jwksUri: string;
  algorithms: string[];
}

/**
 * Builds AWS Cognito JWT configuration from user pool ID
 * @param userPoolId - The Cognito user pool ID (e.g., "us-east-1_abc123")
 * @returns Cognito JWT configuration object
 */
export const buildCognitoJwtConfig = (userPoolId: string): CognitoJwtConfig => {
  const region = userPoolId.split("_")[0];
  return {
    userPoolId,
    region,
    issuer: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,
    jwksUri: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`,
    algorithms: ["RS256"],
  };
};

export interface GoogleJwtConfig {
  clientId: string;
  issuer: string;
  jwksUri: string;
  algorithms: string[];
}

/**
 * Builds Google JWT configuration from client ID
 * @param clientId - The Google OAuth client ID
 * @returns Google JWT configuration object
 */
export const buildGoogleJwtConfig = (clientId: string): GoogleJwtConfig => {
  return {
    clientId,
    issuer: "accounts.google.com",
    jwksUri: "https://www.googleapis.com/oauth2/v3/certs",
    algorithms: ["RS256"],
  };
};

/**
 * Validates that a user object has the required id property for session management
 * @param user - The user object to validate
 * @returns true if the user has a valid id
 */
export const isValidSessionUser = (user: unknown): user is { id: string } => {
  if (!user || typeof user !== "object") {
    return false;
  }

  const userObj = user as Record<string, unknown>;
  return typeof userObj.id === "string" && userObj.id.length > 0;
};

/**
 * Maps a sub claim to an id property on a user object
 * This is used when external auth providers use 'sub' instead of 'id'
 * @param user - The user object with potential sub claim
 * @returns A new user object with id set from sub if applicable
 */
export const mapSubToId = <T extends Record<string, unknown>>(user: T): T & { id: string } => {
  if (user.sub && typeof user.sub === "string" && !user.id) {
    return { ...user, id: user.sub };
  }
  return user as T & { id: string };
};

/**
 * Calculates the session cookie max age for "remember me" functionality
 * @param rememberMe - Whether the user wants to be remembered
 * @param daysToRemember - Number of days to remember (default: 30)
 * @returns The max age in milliseconds, or undefined if not remembering
 */
export const calculateSessionMaxAge = (
  rememberMe: boolean,
  daysToRemember: number = 30
): number | undefined => {
  if (!rememberMe) {
    return undefined;
  }
  return 24 * 60 * 60 * 1000 * daysToRemember;
};

/**
 * Validates that a token has the required structure for a specific provider
 * @param token - The JWT token string
 * @param provider - The authentication provider
 * @returns true if the token structure is valid for the provider
 */
export const validateTokenStructure = (
  token: string,
  provider: "auth0" | "okta" | "cognito" | "google"
): boolean => {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return false;
  }

  // All providers require iss and sub claims
  if (typeof payload.iss !== "string" || typeof payload.sub !== "string") {
    return false;
  }

  // Provider-specific validation
  switch (provider) {
    case "auth0":
      // Auth0 tokens should have aud claim
      return payload.aud !== undefined;
    case "okta":
      // Okta tokens should have cid (client ID) claim
      return typeof payload.cid === "string";
    case "cognito":
      // Cognito tokens should have token_use claim
      return payload.token_use === "access" || payload.token_use === "id";
    case "google":
      // Google tokens should have email claim
      return typeof payload.email === "string";
    default:
      return false;
  }
};
