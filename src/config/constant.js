// --- Constants ---
const { SHOPIFY_API_TOKEN, SHOPIFY_STORE_URL, SHOPIFY_API_VERSION } = process.env;
const GRAPHQL_URL = `${SHOPIFY_STORE_URL}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
const PRODUCT_URL = `${SHOPIFY_STORE_URL}/admin/api/${SHOPIFY_API_VERSION}/products.json`;
const HEADERS = {
    'X-Shopify-Access-Token': SHOPIFY_API_TOKEN,
    'Content-Type': 'application/json',
};

// --- Exported Constants ---
module.exports = {
    GRAPHQL_URL,
    HEADERS,
    PRODUCT_URL
};