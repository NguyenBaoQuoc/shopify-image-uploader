const axios = require('axios');
const { logResult } = require('../utils/logger');
const { GRAPHQL_URL, HEADERS } = require('../config/constant');

async function createMetafieldDefinition(metafieldData) {
    try {
        const createdDefinition = await _createDefinition(metafieldData);
        if (!createdDefinition) return { success: false, error: 'Failed to create metafield definition' };

        const pinResult = await _pinDefinition(createdDefinition.id, createdDefinition.name);
        if (!pinResult.success) return pinResult;

        return { success: true, id: createdDefinition.id };
    } catch (error) {
        const messageError = `[Error] Error creating or pinning metafield definition: ${error.response ? JSON.stringify(error.response.data) : error.message}  - ${metafieldData.name}`;
        logResult(messageError);
        return { success: false, error: error.response ? error.response.data : error.message };
    }
}

async function _createDefinition(metafieldData) {
    const createMutation = `
      mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
        metafieldDefinitionCreate(definition: $definition) {
          createdDefinition {
            id
            name
            namespace
            key
            description
            type { name }
            ownerType
          }
          userErrors { field message code }
        }
      }
    `;
    const variables = {
        definition: {
            name: metafieldData.name,
            namespace: metafieldData.namespace,
            key: metafieldData.key,
            description: metafieldData.description || '',
            type: metafieldData.type === 'File' ? 'file_reference' : metafieldData.type === 'Files' ? 'list.file_reference' : metafieldData.type,
            ownerType: 'PRODUCT',
        }
    };

    const response = await axios.post(GRAPHQL_URL, { query: createMutation, variables }, { headers: HEADERS });
    const result = response.data.data.metafieldDefinitionCreate;
    if (result.userErrors && result.userErrors.length > 0) {
        const messageError = `[Error] Error creating metafield definition: ${result.userErrors.map(e => e.message).join(', ')}  - ${metafieldData.name}`;
        logResult(messageError);
        return null;
    }
    const createdDefinition = result.createdDefinition;
    const messageSuccess = `Metafield definition created: ${createdDefinition.name} (${createdDefinition.id})`;
    logResult(messageSuccess);
    return createdDefinition;
}

async function _pinDefinition(definitionId, definitionName) {
    const pinMutation = `
      mutation metafieldDefinitionPin($definitionId: ID!) {
        metafieldDefinitionPin(definitionId: $definitionId) {
          pinnedDefinition {
            name
            key
            namespace
            pinnedPosition
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
    const pinVariables = { definitionId };
    const pinRes = await axios.post(GRAPHQL_URL, { query: pinMutation, variables: pinVariables }, { headers: HEADERS });
    const pinResult = pinRes.data.data.metafieldDefinitionPin;
    if (pinResult.userErrors && pinResult.userErrors.length > 0) {
        const pinError = `[Error] Error pinning metafield definition: ${pinResult.userErrors.map(e => e.message).join(', ')}  - ${definitionName}`;
        logResult(pinError);
        return { success: false, error: pinResult.userErrors };
    }
    const pinSuccess = `Metafield definition pinned: ${definitionName} (${definitionId})`;
    logResult(pinSuccess);
    return { success: true };
}

module.exports = { createMetafieldDefinition };