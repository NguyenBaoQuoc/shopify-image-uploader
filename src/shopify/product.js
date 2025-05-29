const axios = require('axios');
const { logResult } = require('../utils/logger');
const { GRAPHQL_URL, PRODUCT_URL, HEADERS } = require('../config/constant');

// --- Product Creation ---
async function createProduct(productData) {
    try {
        const response = await axios.post(PRODUCT_URL, buildProductPayload(productData), { headers: HEADERS });
        logResult(`Product created: ${response.data.product.title} (${response.data.product.id})`);
        return { success: true, data: response.data };
    } catch (error) {
        logResult(`[Error] Error creating product: ${errorMsg(error)} - ${productData.title}`);
        return { success: false, error: errorMsg(error) };
    }
}

function buildProductPayload(productData) {
    return {
        product: {
            title: productData.title,
            body_html: productData.description,
            variants: [
                {
                    price: productData.price,
                    sku: productData.productCode,
                },
            ],
        },
    };
}

// --- Metafield Setting ---
async function setProductImageMetafield(productId, namespace, key, value, type = "file_reference") {
    const mutation = buildMetafieldSetMutation();
    const variables = buildMetafieldSetVariables(productId, namespace, key, value, type);

    try {
        const res = await axios.post(GRAPHQL_URL, { query: mutation, variables }, { headers: HEADERS });
        logMetafieldSetResult(res.data, productId, namespace, key, value);
        return res.data.data.metafieldsSet;
    } catch (error) {
        logResult(`[Error] Error setting metafield for product ${productId}: ${errorMsg(error)} - ${namespace}.${key} with value ${value}`);
        return { success: false, error: errorMsg(error) };
    }
}

function buildMetafieldSetMutation() {
    return `
      mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            key
            namespace
            value
            type
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
}

function buildMetafieldSetVariables(productId, namespace, key, value, type) {
    return {
        metafields: [{
            ownerId: productId,
            namespace,
            key,
            type,
            value
        }]
    };
}

function logMetafieldSetResult(data, productId, namespace, key, value) {
    if (data.errors) {
        logResult(`[Error] GraphQL error setting metafield for product ${productId}: ${JSON.stringify(data.errors)}`);
    } else if (data.data && data.data.metafieldsSet && data.data.metafieldsSet.userErrors && data.data.metafieldsSet.userErrors.length > 0) {
        logResult(`[Error] Error setting metafield for product ${productId}: ${data.data.metafieldsSet.userErrors.map(e => e.message).join(', ')} - ${namespace}.${key} with value ${value}`);
    } else {
        logResult(`Metafield set for product ${productId}: ${namespace}.${key} with value ${value}`);
    }
}

function errorMsg(error) {
    return error.response ? JSON.stringify(error.response.data) : error.message;
}

async function createProductWithMetafield(productData, metafields, files, productMetakeys) {
    const productResult = await createProduct(productData);
    if (!productResult.success) {
        logResult(`[Error] Failed to create product: ${productData.title} - ${productResult.error}`);
        return productResult;
    }

    const productId = productResult.data.product.admin_graphql_api_id;
    const productTitle = productData.title;
    const metakeys = productMetakeys[productTitle] || [];

    if (metakeys.length === 0) {
        logResult(`[WARNING] No metafields to set for product: (${productTitle})`);
        return { success: true, data: productResult.data };
    }

    const matchingFiles = files.filter(file =>
        file.alt && file.alt.toLowerCase().includes(productData.title.toLowerCase())
    );

    if (matchingFiles.length === 0) {
        logResult(`[WARNING] No files found for product: (${productTitle})`);
        return { success: false, error: `No files found for product: ${productTitle}` };
    }

    for (const metakey of metakeys) {
        const metafield = metafields.find(mf => mf.key === metakey);
        if (!metafield) {
            logResult(`[WARNING] Metafield definition not found for key: ${metakey} (product: ${productTitle})`);
            continue;
        }

        if (metafield.type === 'Files') {
            const fileIds = matchingFiles.map(f => f.id);
            const metafieldResult = await setProductImageMetafield(
                productId,
                metafield.namespace,
                metafield.key,
                JSON.stringify(fileIds),
                'list.file_reference'
            );
            if (metafieldResult.userErrors && metafieldResult.userErrors.length > 0) {
                logResult(`[Error] Failed to set list.file_reference metafield for product: ${productData.title} - ${JSON.stringify(metafieldResult.userErrors)}`);
            }
        } else {
            const metafieldResult = await setProductImageMetafield(
                productId,
                metafield.namespace,
                metafield.key,
                matchingFiles[0].id,
                'file_reference'
            );
            if (metafieldResult.userErrors && metafieldResult.userErrors.length > 0) {
                logResult(`[Error] Failed to set file_reference metafield for product: ${productData.title} - ${JSON.stringify(metafieldResult.userErrors)}`);
            }
        }
    }

    return { success: true, data: productResult.data };
}

module.exports = { createProductWithMetafield };