require("dotenv").config();
const axios = require("axios");
const { logResult } = require("../utils/logger");
const { GRAPHQL_URL, HEADERS } = require("../config/constant");

function buildFileCreateVariables(images) {
  const files = Array.isArray(images) ? images : [images];
  return {
    files: files.map((data) => ({
      originalSource: data.image,
      alt: data.alt || "",
      contentType: "IMAGE",
    })),
  };
}

function buildFileCreateMutation() {
  return `
      mutation fileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files {
            id
            fileStatus
            alt
            createdAt
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
}

async function callFileCreateMutation(variables) {
  try {
    const response = await axios.post(
      GRAPHQL_URL,
      { query: buildFileCreateMutation(), variables },
      { headers: HEADERS }
    );
    return response.data.data.fileCreate;
  } catch (error) {
    logResult(
      `[Error] Error uploading files: ${error.message}  - ${variables.files
        .map((f) => f.originalSource)
        .join(", ")}`
    );
    return { userErrors: [{ message: error.message }] };
  }
}

async function uploadImageToShopifyFiles(images) {
  const files = Array.isArray(images) ? images : [images];
  if (files.length === 0) {
    logResult("[WARNING] No images provided for upload");
  }

  // Validate that all provided images have a valid 'image' property
  // use filter to ensure all images have the 'image' property and log file not valid
  files.forEach((file, idx) => {
    if (!file.image) {
      logResult(
        `[WARNING] File at index ${idx} is missing 'image' property`
      );
    }
  });
  const validImages = files.filter((f) => f.image);
  const variables = buildFileCreateVariables(validImages);
  const result = await callFileCreateMutation(variables);

  if (result.userErrors && result.userErrors.length > 0) {
    const messageError = `[Error] Error uploading files: ${result.userErrors
      .map((e) => e.message)
      .join(", ")}  - ${files.map((f) => f.image).join(", ")}`;
    logResult(messageError);
  }

  logResult(
    `Files uploaded successfully: ${result.files.map((f) => f.id).join(", ")} `
  );
  return result.files;
}

module.exports = { uploadImageToShopifyFiles };
