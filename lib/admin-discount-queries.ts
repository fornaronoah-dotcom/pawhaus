/**
 * GraphQL voor Shopify kortingscodes (Admin API). Vereist scope write_discounts
 * (en read_discounts voor de lijst). Veldnamen geverifieerd tegen 2025.
 */

export const DISCOUNT_LIST_QUERY = /* GraphQL */ `
  query AdminDiscounts($first: Int!, $after: String) {
    codeDiscountNodes(first: $first, after: $after, sortKey: CREATED_AT, reverse: true) {
      edges {
        node {
          id
          codeDiscount {
            __typename
            ... on DiscountCodeBasic {
              title
              status
              startsAt
              endsAt
              usageLimit
              asyncUsageCount
              appliesOncePerCustomer
              codes(first: 1) {
                nodes { code }
              }
              customerGets {
                value {
                  __typename
                  ... on DiscountPercentage { percentage }
                  ... on DiscountAmount {
                    amount { amount currencyCode }
                  }
                }
              }
            }
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export const DISCOUNT_CREATE_MUTATION = /* GraphQL */ `
  mutation AdminDiscountCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
    discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
      codeDiscountNode { id }
      userErrors { field message code }
    }
  }
`;
