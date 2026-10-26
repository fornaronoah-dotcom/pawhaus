/**
 * GraphQL voor de Shopify Customer Account API (2025-01).
 * Queries draaien tegen de ingelogde klant ("customer" = de tokenhouder).
 */

export const CUSTOMER_PROFILE_QUERY = /* GraphQL */ `
  query CustomerProfile {
    customer {
      id
      firstName
      lastName
      displayName
      emailAddress { emailAddress marketingState }
      phoneNumber { phoneNumber }
    }
  }
`;

export const CUSTOMER_ORDERS_QUERY = /* GraphQL */ `
  query CustomerOrders($first: Int!) {
    customer {
      orders(first: $first, sortKey: PROCESSED_AT, reverse: true) {
        nodes {
          id
          name
          number
          processedAt
          financialStatus
          totalPrice { amount currencyCode }
          lineItems(first: 50) {
            nodes {
              name
              quantity
              variantId
              image { url altText }
              price { amount currencyCode }
            }
          }
        }
      }
    }
  }
`;

export const CUSTOMER_ADDRESSES_QUERY = /* GraphQL */ `
  query CustomerAddresses {
    customer {
      defaultAddress { id }
      addresses(first: 20) {
        nodes {
          id
          firstName
          lastName
          company
          address1
          address2
          city
          zoneCode
          territoryCode
          zip
          phoneNumber
          formatted(withName: true)
        }
      }
    }
  }
`;

export const CUSTOMER_UPDATE_MUTATION = /* GraphQL */ `
  mutation CustomerUpdate($input: CustomerUpdateInput!) {
    customerUpdate(input: $input) {
      customer { id firstName lastName }
      userErrors { field message }
    }
  }
`;

export const ADDRESS_CREATE_MUTATION = /* GraphQL */ `
  mutation AddressCreate($address: CustomerAddressInput!, $defaultAddress: Boolean) {
    customerAddressCreate(address: $address, defaultAddress: $defaultAddress) {
      customerAddress { id }
      userErrors { field message }
    }
  }
`;

export const ADDRESS_UPDATE_MUTATION = /* GraphQL */ `
  mutation AddressUpdate($addressId: ID!, $address: CustomerAddressInput!, $defaultAddress: Boolean) {
    customerAddressUpdate(addressId: $addressId, address: $address, defaultAddress: $defaultAddress) {
      customerAddress { id }
      userErrors { field message }
    }
  }
`;

export const ADDRESS_DELETE_MUTATION = /* GraphQL */ `
  mutation AddressDelete($addressId: ID!) {
    customerAddressDelete(addressId: $addressId) {
      deletedAddressId
      userErrors { field message }
    }
  }
`;
