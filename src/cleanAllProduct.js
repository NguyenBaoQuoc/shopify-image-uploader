require("dotenv").config();
const axios = require('axios');
const { GRAPHQL_URL, HEADERS } = require('./config/constant');

async function getAllProductIds() {
    const query = `
      {
        products(first: 100) {
          edges {
            node {
              id
              title
            }
          }
        }
      }
    `;
    const response = await axios.post(GRAPHQL_URL, { query }, { headers: HEADERS });
    return response.data.data.products.edges.map(edge => ({
        id: edge.node.id,
        title: edge.node.title
    }));
}

async function deleteProduct(productId) {
    const mutation = `
      mutation productDelete($input: ProductDeleteInput!) {
        productDelete(input: $input) {
          deletedProductId
          userErrors {
            field
            message
          }
        }
      }
    `;
    const variables = { input: { id: productId } };
    const response = await axios.post(GRAPHQL_URL, { query: mutation, variables }, { headers: HEADERS });
    return response.data.data.productDelete;
}

const init = async () => {
    try {
        const products = await getAllProductIds();
        console.log(`Found ${products.length} products to delete.`);
        let results = [];
        for (const product of products) {
            try {
                const result = await deleteProduct(product.id);
                if (result.userErrors && result.userErrors.length > 0) {
                    console.log(`[ERROR] Deleting ${product.title}:`, result.userErrors);
                } else {
                    console.log(`[SUCCESS] Deleted ${product.title} (${product.id})`);
                }
                results.push({
                    id: product.id,
                    title: product.title,
                    deleted: !!result.deletedProductId,
                    userErrors: result.userErrors,
                });
            } catch (error) {
                console.log(`[ERROR] Deleting ${product.title}:`, error.message);
                results.push({
                    id: product.id,
                    title: product.title,
                    deleted: false,
                    error: error.response ? error.response.data : error.message,
                });
            }
        }
        console.log("Deletion Results:", results);
    } catch (error) {
        console.error("Error cleaning all products:", error);
    }
};

init();