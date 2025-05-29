// src/index.js

const { parseGoogleSheetProducts, parseGoogleSheetMetafields, parseGoogleSheetImages, parseGoogleSheetProductMetadatas } = require('./utils/googleSheetParser');
const { uploadImageToShopifyFiles } = require('./shopify/image');
const { createProductWithMetafield } = require('./shopify/product');
const { createMetafieldDefinition } = require('./shopify/metafield');
const { logResult, clearLog } = require('./utils/logger');

const init = async () => {
    try {

        // Clear logs
        clearLog();
        logResult('Starting the application...');
        logResult(`Current date and time: ${new Date().toISOString()}`);
        logResult('Initializing Google Sheets data parsing...');

        // 1. Create Metafields
        const metafields = await parseGoogleSheetMetafields();
        if (!metafields || metafields.length === 0) {
            logResult('[WARNING] No metafields found in the Google Sheet.');
            return;
        }
        
        for (const metafield of metafields) {
            await createMetafieldDefinition(metafield);
        }

        // 2. Upload Images to Files
        const images = await parseGoogleSheetImages();
        if (!images || images.length === 0) {
            logResult('[WARNING] No images found in the Google Sheet.');
            return;
        }
        
        const files = await uploadImageToShopifyFiles(images);
        if (!files || files.length === 0) {
            logResult('[WARNING] No files uploaded to Shopify.');
            return;
        }

        const products = await parseGoogleSheetProducts();
        if (!products || products.length === 0) {
            logResult('[WARNING] No products found in the Google Sheet.');
            return;
        }

        const productMetakeys = await parseGoogleSheetProductMetadatas();
        for (const product of products) {
            await createProductWithMetafield(product, metafields, files, productMetakeys);
        }
        
    } catch (error) {
        console.error('Error initializing the application:', error);
    }
};

init();