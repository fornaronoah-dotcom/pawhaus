/**
 * GraphQL-operaties voor de Shopify ADMIN API (beheerpaneel).
 * Tegenhanger van lib/queries.ts (Storefront). Veldnamen geverifieerd tegen
 * de Admin GraphQL API 2025: priceRangeV2 (niet priceRange), seo { title
 * description }, status-enum ACTIVE/DRAFT/ARCHIVED, media (niet deprecated
 * images), productUpdate(product: ProductUpdateInput!).
 */

export const ADMIN_PRODUCTS_QUERY = /* GraphQL */ `
  query AdminProducts(
    $first: Int!
    $after: String
    $query: String
    $sortKey: ProductSortKeys
    $reverse: Boolean
  ) {
    products(
      first: $first
      after: $after
      query: $query
      sortKey: $sortKey
      reverse: $reverse
    ) {
      edges {
        cursor
        node {
          id
          title
          handle
          status
          totalInventory
          updatedAt
          tags
          description
          vendor
          productType
          featuredImage {
            url
            altText
          }
          priceRangeV2 {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          variants(first: 1) {
            edges {
              node {
                sku
                compareAtPrice
                inventoryItem {
                  unitCost {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const ADMIN_PRODUCT_QUERY = /* GraphQL */ `
  query AdminProduct($id: ID!) {
    product(id: $id) {
      id
      title
      handle
      status
      totalInventory
      updatedAt
      tags
      productType
      vendor
      description
      descriptionHtml
      seo {
        title
        description
      }
      featuredImage {
        url
        altText
      }
      media(first: 20) {
        edges {
          node {
            ... on MediaImage {
              id
              image {
                url
                altText
              }
            }
          }
        }
      }
      priceRangeV2 {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
    }
  }
`;

export const ADMIN_PRODUCT_UPDATE_MUTATION = /* GraphQL */ `
  mutation AdminProductUpdate($product: ProductUpdateInput!) {
    productUpdate(product: $product) {
      product {
        id
        handle
        updatedAt
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const ADMIN_TAGS_ADD_MUTATION = /* GraphQL */ `
  mutation AdminTagsAdd($id: ID!, $tags: [String!]!) {
    tagsAdd(id: $id, tags: $tags) {
      node { id }
      userErrors { field message }
    }
  }
`;

export const ADMIN_TAGS_REMOVE_MUTATION = /* GraphQL */ `
  mutation AdminTagsRemove($id: ID!, $tags: [String!]!) {
    tagsRemove(id: $id, tags: $tags) {
      node { id }
      userErrors { field message }
    }
  }
`;

export const ADMIN_PRODUCT_SET_STATUS_MUTATION = /* GraphQL */ `
  mutation AdminProductSetStatus($product: ProductUpdateInput!) {
    productUpdate(product: $product) {
      product { id handle status }
      userErrors { field message }
    }
  }
`;

export const ADMIN_REORDER_MEDIA_MUTATION = /* GraphQL */ `
  mutation AdminReorderMedia($id: ID!, $moves: [MoveInput!]!) {
    productReorderMedia(id: $id, moves: $moves) {
      job { id }
      userErrors { field message }
    }
  }
`;

export const ADMIN_STAGED_UPLOADS_MUTATION = /* GraphQL */ `
  mutation AdminStagedUploads($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets {
        url
        resourceUrl
        parameters { name value }
      }
      userErrors { field message }
    }
  }
`;

export const ADMIN_PRODUCT_CREATE_MEDIA_MUTATION = /* GraphQL */ `
  mutation AdminProductCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
    productCreateMedia(productId: $productId, media: $media) {
      media {
        ... on MediaImage {
          id
        }
      }
      mediaUserErrors { field message }
    }
  }
`;
