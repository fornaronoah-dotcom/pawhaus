/**
 * GraphQL voor Shopify klanten (Admin API). Vereist read_customers.
 * Veldnamen geverifieerd via live introspectie (2025: email/phone zitten nu
 * onder defaultEmailAddress/defaultPhoneNumber).
 */

export const CUSTOMER_DETAIL_QUERY = /* GraphQL */ `
  query CustomerDetail($id: ID!) {
    customer(id: $id) {
      id
      displayName
      defaultEmailAddress { emailAddress marketingState }
      defaultPhoneNumber { phoneNumber }
      numberOfOrders
      amountSpent { amount currencyCode }
      createdAt
      state
      note
      tags
      defaultAddress { city country }
      lastOrder { createdAt }
      orders(first: 25, sortKey: CREATED_AT, reverse: true) {
        nodes {
          id
          name
          createdAt
          displayFinancialStatus
          displayFulfillmentStatus
          totalPriceSet { shopMoney { amount currencyCode } }
          discountCodes
        }
      }
    }
  }
`;

export const CUSTOMERS_QUERY = /* GraphQL */ `
  query AdminCustomers($first: Int!, $after: String, $query: String) {
    customers(first: $first, after: $after, query: $query, sortKey: CREATED_AT, reverse: true) {
      edges {
        node {
          id
          displayName
          defaultEmailAddress { emailAddress marketingState }
          numberOfOrders
          amountSpent { amount currencyCode }
          createdAt
          state
          tags
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;
