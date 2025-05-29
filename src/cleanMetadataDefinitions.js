require("dotenv").config();
const axios = require('axios');
const { GRAPHQL_URL, HEADERS } = require('../src/config/constant');

const deleteDefinitionMutation = `
  mutation DeleteMetafieldDefinition($id: ID!, $deleteAllAssociatedMetafields: Boolean!) {
    metafieldDefinitionDelete(id: $id, deleteAllAssociatedMetafields: $deleteAllAssociatedMetafields) {
      deletedDefinitionId
      userErrors {
        field
        message
        code
      }
    }
  }
`;

const init = async () => {
    // 1. Query all product metafield definitions
    const defQuery = `
      {
        metafieldDefinitions(first: 100, ownerType: PRODUCT) {
          edges {
            node {
              id
              name
              namespace
              key
            }
          }
        }
      }
    `;

    let definitionNodes = [];
    try {
        const response = await axios.post(GRAPHQL_URL, { query: defQuery }, { headers: HEADERS });
        definitionNodes = response.data.data.metafieldDefinitions.edges.map(edge => edge.node);
        console.log("Metafield Definitions to delete:", definitionNodes.map(d => d.id));
    } catch (error) {
        console.error("Error fetching metafield definitions:", error);
        return;
    }

    // 2. For each definition, delete it and all associated metafields
    let results = [];
    for (const def of definitionNodes) {
        const variables = {
            id: def.id,
            deleteAllAssociatedMetafields: true
        };
        try {
            const delRes = await axios.post(
                GRAPHQL_URL,
                { query: deleteDefinitionMutation, variables },
                { headers: HEADERS }
            );
            const result = delRes.data.data.metafieldDefinitionDelete;
            if (result.userErrors && result.userErrors.length > 0) {
                console.log(`Error deleting definition ${def.id}:`, result.userErrors);
            } else {
                console.log(`Deleted definition ${def.id}`);
            }
            results.push({
                id: def.id,
                deleted: !!result.deletedDefinitionId,
                userErrors: result.userErrors,
            });
        } catch (error) {
            console.log(`Error deleting metafield definition ${def.id}:`, error.message);
            results.push({
                id: def.id,
                deleted: false,
                error: error.response ? error.response.data : error.message,
            });
        }
    }

    console.log("Deletion Results:", results);
    return { success: true, results };
};

init();