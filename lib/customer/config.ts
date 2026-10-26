import "server-only";

/**
 * Configuratie voor de Shopify Customer Account API (OAuth 2.0 PKCE).
 *
 * De waarden komen uit het Headless-kanaal in de Shopify-admin
 * (Sales channels → Headless → Customer Account API settings):
 *  - Client ID
 *  - Application endpoints: authorization / token / logout
 *  - GraphQL API-URL (vorm: https://shopify.com/{shop_id}/account/customer/api/2025-01/graphql)
 *
 * Zonder deze env-variabelen blijft alleen de favorietenlijst werken; de
 * account/login-functies degraderen netjes (isCustomerAccountsConfigured = false).
 */

const clientId = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID;
const authUrl = process.env.SHOPIFY_CUSTOMER_ACCOUNT_AUTH_URL;
const tokenUrl = process.env.SHOPIFY_CUSTOMER_ACCOUNT_TOKEN_URL;
const logoutUrl = process.env.SHOPIFY_CUSTOMER_ACCOUNT_LOGOUT_URL;
const apiUrl = process.env.SHOPIFY_CUSTOMER_ACCOUNT_API_URL;
const redirectUri = process.env.SHOPIFY_CUSTOMER_ACCOUNT_REDIRECT_URI;

/** True wanneer alle benodigde env-variabelen aanwezig zijn. */
export const isCustomerAccountsConfigured = Boolean(
  clientId && authUrl && tokenUrl && apiUrl && redirectUri,
);

export const customerConfig = {
  clientId: clientId ?? "",
  authUrl: authUrl ?? "",
  tokenUrl: tokenUrl ?? "",
  logoutUrl: logoutUrl ?? "",
  apiUrl: apiUrl ?? "",
  redirectUri: redirectUri ?? "",
  /** Vaste scope voor de Customer Account API. */
  scope: "openid email customer-account-api:full",
};
