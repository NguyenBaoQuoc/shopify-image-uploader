require("dotenv").config();
const { GoogleSpreadsheet } = require("google-spreadsheet");
const { JWT } = require("google-auth-library");
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET;

async function parseGoogleSheetProducts() {
  let rows = [];
  try {
    const sheet = await parseGoogleSheet(0);
    rows = await sheet.getRows();
  } catch (error) {
    console.error("Error fetching image data from Google Sheet:", error);
    throw error;
  }

  // Get header values from the sheet
  const headers = rows[0]?._worksheet?._headerValues || [];

  const productData = rows.map((row) => {
    // Try to use property access, fallback to _rawData by header index
    const get = (key, fallbackIdx) =>
      row[key] !== undefined
        ? row[key]
        : row._rawData && headers[fallbackIdx]
        ? row._rawData[fallbackIdx]
        : null;

    return {
      productCode: get("productCode", headers.indexOf("productCode")),
      title: get("title", headers.indexOf("title")),
      description: get("description", headers.indexOf("description")),
      price: get("price", headers.indexOf("price")),
    };
  });

  return productData;
}

async function parseGoogleSheetMetafields() {
  let rows = [];
  try {
    const sheet = await parseGoogleSheet(1);
    rows = await sheet.getRows();
  } catch (error) {
    console.error("Error fetching metafield data from Google Sheet:", error);
    throw error;
  }

  // Get header values from the sheet
  const headers = rows[0]?._worksheet?._headerValues || [];

  const metafieldData = rows.map((row) => {
    // Try to use property access, fallback to _rawData by header index
    const get = (key, fallbackIdx) =>
      row[key] !== undefined
        ? row[key]
        : row._rawData && headers[fallbackIdx]
        ? row._rawData[fallbackIdx]
        : null;

    let typeValue = get("type", headers.indexOf("type"));
    if (typeValue && typeValue.toLowerCase() === "File") {
      typeValue = "file_reference";
    }

    return {
      name: get("name", headers.indexOf("name")),
      key: get("key", headers.indexOf("key")),
      description: get("description", headers.indexOf("description")),
      type: get("type", headers.indexOf("type")),
      namespace: get("namespace", headers.indexOf("namespace")),
    };
  });

  return metafieldData;
}

async function parseGoogleSheetImages() {
  let rows = [];
  try {
    const sheet = await parseGoogleSheet(2);
    rows = await sheet.getRows();
  } catch (error) {
    console.error("Error fetching image data from Google Sheet:", error);
    throw error;
  }

  // Get header values from the sheet
  const headers = rows[0]?._worksheet?._headerValues || [];

  const imageData = rows.map((row) => {
    // Try to use property access, fallback to _rawData by header index
    const get = (key, fallbackIdx) =>
      row[key] !== undefined
        ? row[key]
        : row._rawData && headers[fallbackIdx]
        ? row._rawData[fallbackIdx]
        : null;

    return {
      image: get("image", headers.indexOf("image")),
      alt: get("alt", headers.indexOf("alt")),
    };
  });

  return imageData;
}

async function parseGoogleSheetProductMetadatas() {
  let rows = [];
  try {
    const sheet = await parseGoogleSheet(3);
    rows = await sheet.getRows();
  } catch (error) {
    console.error(
      "Error fetching product metadata files from Google Sheet:",
      error
    );
    throw error;
  }

  // Get header values from the sheet
  const headers = rows[0]?._worksheet?._headerValues || [];

  const metakeys = rows.map((row) => {
    // Try to use property access, fallback to _rawData by header index
    const get = (key, fallbackIdx) =>
      row[key] !== undefined
        ? row[key]
        : row._rawData && headers[fallbackIdx]
        ? row._rawData[fallbackIdx]
        : null;

    return {
      metakey: get("metakey", headers.indexOf("metakey")),
      productTitle: get("productTitle", headers.indexOf("productTitle")),
    };
  });

  const productMetadatas = {};

  metakeys.forEach(({ metakey, productTitle }) => {
    if (!productTitle) return;
    // Support multiple codes separated by comma
    productTitle
      .split(",")
      .map((code) => code.trim())
      .forEach((code) => {
        if (!productMetadatas[code]) productMetadatas[code] = [];
        productMetadatas[code].push(metakey);
      });
  });
  return productMetadatas;
}

async function parseGoogleSheet(sheetIndex = 0) {
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID, serviceAccountAuth);

  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[sheetIndex];
  return sheet;
}

module.exports = {
  parseGoogleSheetProducts,
  parseGoogleSheetMetafields,
  parseGoogleSheetImages,
  parseGoogleSheetProductMetadatas,
};
