/**
 * GraphQL voor nieuwsbrief/marketing (Admin API). Maakt of werkt een Shopify-
 * klant bij met e-mailmarketing-toestemming. Vereist write_customers.
 */

export const CUSTOMER_BY_EMAIL_QUERY = /* GraphQL */ `
  query CustomerByEmail($query: String!) {
    customers(first: 1, query: $query) {
      edges {
        node {
          id
          defaultEmailAddress { marketingState }
        }
      }
    }
  }
`;

export const CUSTOMER_CREATE_MUTATION = /* GraphQL */ `
  mutation CustomerCreate($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer { id }
      userErrors { field message }
    }
  }
`;

export const CUSTOMER_CONSENT_UPDATE_MUTATION = /* GraphQL */ `
  mutation CustomerConsentUpdate($input: CustomerEmailMarketingConsentUpdateInput!) {
    customerEmailMarketingConsentUpdate(input: $input) {
      userErrors { field message }
    }
  }
`;
