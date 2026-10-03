import { initializeMcpSqlDatabase, runSql } from './sqlStore.js';
import { MCP_TOOL_SPECS, executeTool } from './tools.js';
import { MCP_RESOURCES, readResource } from './resources.js';
import { MCP_PROMPTS } from './prompts.js';

// Auto-initialize SQL schema on load
initializeMcpSqlDatabase();

export {
  initializeMcpSqlDatabase,
  runSql,
  MCP_TOOL_SPECS,
  executeTool,
  MCP_RESOURCES,
  readResource,
  MCP_PROMPTS,
};

// Stdout / CLI Runner for standalone MCP execution
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('KAOS Model Context Protocol (MCP) Server initialized with deep SQL storage.');
  console.log(`Registered Tools: ${MCP_TOOL_SPECS.length}`);
  console.log(`Registered Resources: ${MCP_RESOURCES.length}`);
  console.log(`Registered Prompts: ${MCP_PROMPTS.length}`);
}
