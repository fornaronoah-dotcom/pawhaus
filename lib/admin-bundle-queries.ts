/**
 * GraphQL voor Shopify fixed bundles (Admin API). Vereist write_products +
 * de bundels-feature op de winkel. productBundleCreate is ASYNC → poll
 * productOperation tot status COMPLETE. Veldnamen via live introspectie geverifieerd.
 */

// Haalt per component-product de optieselecties op (eerste variant).
export const BUNDLE_COMPONENT_OPTIONS_QUERY = /* GraphQL */ `
  query BundleComponentOptions($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        options { id name }
        variants(first: 1) {
          nodes {
            selectedOptions { name value }
          }
        }
      }
    }
  }
`;

export const BUNDLE_CREATE_MUTATION = /* GraphQL */ `
  mutation BundleCreate($input: ProductBundleCreateInput!) {
    productBundleCreate(input: $input) {
      productBundleOperation { id status }
      userErrors { field message }
    }
  }
`;

export const BUNDLE_OPERATION_QUERY = /* GraphQL */ `
  query BundleOperation($id: ID!) {
    productOperation(id: $id) {
      ... on ProductBundleOperation {
        status
        product { id handle variants(first: 1) { nodes { id } } }
        userErrors { field message }
      }
    }
  }
`;

export const BUNDLE_VARIANT_PRICE_MUTATION = /* GraphQL */ `
  mutation BundleVariantPrice($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      userErrors { field message }
    }
  }
`;
