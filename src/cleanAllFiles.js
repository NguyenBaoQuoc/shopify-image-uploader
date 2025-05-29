require("dotenv").config();
const axios = require('axios');
const { GRAPHQL_URL, HEADERS } = require('./config/constant');

const FILES_QUERY = `
  {
    files(first: 100) {
      edges {
        node { id }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

const FILE_DELETE_MUTATION = `
  mutation fileDelete($input: [ID!]!) {
    fileDelete(fileIds: $input) {
      deletedFileIds
      userErrors { field message }
    }
  }
`;

async function getAllFileIds() {
    let fileIds = [];
    let hasNextPage = true;
    let endCursor = null;

    while (hasNextPage) {
        const query = endCursor
            ? FILES_QUERY.replace(')', `, after: "${endCursor}")`)
            : FILES_QUERY;
        const res = await axios.post(GRAPHQL_URL, { query }, { headers: HEADERS });
        const filesData = res.data.data.files;
        fileIds.push(...filesData.edges.map(edge => edge.node.id));
        hasNextPage = filesData.pageInfo.hasNextPage;
        endCursor = filesData.pageInfo.endCursor;
    }
    return fileIds;
}

async function deleteFiles(fileIds) {
    const variables = { input: fileIds };
    const res = await axios.post(
        GRAPHQL_URL,
        { query: FILE_DELETE_MUTATION, variables },
        { headers: HEADERS }
    );
    return res.data.data.fileDelete;
}

const init = async () => {
    try {
        const fileIds = await getAllFileIds();
        if (fileIds.length === 0) {
            console.log("No files to delete.");
            return;
        }
        // Shopify may have a limit on how many IDs you can delete at once (test with 50-100 per batch)
        const batchSize = 50;
        for (let i = 0; i < fileIds.length; i += batchSize) {
            const batch = fileIds.slice(i, i + batchSize);
            const result = await deleteFiles(batch);
            if (result.userErrors && result.userErrors.length > 0) {
                console.log(`[ERROR] Deleting files:`, result.userErrors);
            } else {
                console.log(`[SUCCESS] Deleted files:`, result.deletedFileIds);
            }
        }
        console.log("All files processed.");
    } catch (error) {
        console.error("Error cleaning all files:", error);
    }
};

init();