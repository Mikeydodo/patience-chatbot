#!/usr/bin/env node

/**
 * CLI interface for Patience
 */

import { ConfigurationManager } from './config/ConfigurationManager';
import { TestExecutor } from './execution/TestExecutor';
import { ReportGenerator } from './reporting/ReportGenerator';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Parse command line arguments
 */
function parseArgs(): {
  configPath?: string;
  help: boolean;
  outputPath?: string;
  format?: 'json' | 'html' | 'markdown';
} {
  const args = process.argv.slice(2);
  const result: any = {
    help: false,
    format: 'json'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--config' || arg === '-c') {
      result.configPath = args[++i];
    } else if (arg === '--output' || arg === '-o') {
      result.outputPath = args[++i];
    } else if (arg === '--format' || arg === '-f') {
      result.format = args[++i];
    } else if (!result.configPath) {
      result.configPath = arg;
    }
  }

  return result;
}

/**
 * Display help message
 */
function showHelp(): void {
  console.log(`
Patience - Chat Bot Testing System

Usage:
  patience [options] <config-file>

Options:
  -c, --config <file>    Path to configuration file (JSON or YAML)
  -o, --output <path>    Output directory for reports (default: ./reports)
  -f, --format <format>  Report format: json, html, markdown (default: json)
  -h, --help             Show this help message

Examples:
  patience config.json
  patience --config test-config.yaml --output ./test-reports --format html
  patience -c config.json -o reports -f markdown

Configuration File:
  The configuration file should contain:
  - targetBot: Bot connection details (protocol, endpoint, auth)
  - scenarios: Test scenarios to execute
  - validation: Validation settings
  - timing: Delay and timeout configuration
  - reporting: Report generation settings

For more information, visit: https://github.com/patience-chatbot
  `);
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  const args = parseArgs();

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  if (!args.configPath) {
    console.error('Error: Configuration file is required');
    console.error('Use --help for usage information');
    process.exit(1);
  }

  try {
    console.log('Patience Chat Bot Testing System');
    console.log('=================================\n');

    // Load configuration
    console.log(`Loading configuration from: ${args.configPath}`);
    const configManager = new ConfigurationManager();
    const config = await configManager.loadConfig(args.configPath);

    // Validate configuration
    console.log('Validating configuration...');
    const validation = configManager.validateConfig(config);
    if (!validation.passed) {
      console.error('Configuration validation failed:');
      console.error(validation.message);
      process.exit(1);
    }
    console.log('✓ Configuration valid\n');

    // Execute tests
    console.log(`Executing ${config.scenarios.length} scenario(s)...`);
    const executor = new TestExecutor();
    const results = await executor.executeTests(config);

    // Generate report
    console.log('\nGenerating report...');
    const reportGenerator = new ReportGenerator();
    const report = reportGenerator.generateReport(results);

    // Determine output path
    const outputDir = args.outputPath || config.reporting.outputPath || './reports';
    await fs.mkdir(outputDir, { recursive: true });

    // Save reports in configured formats
    const formats = config.reporting.formats || [args.format || 'json'];
    for (const format of formats) {
      const formatted = reportGenerator.formatReport(report, format as any);
      const filename = `report-${Date.now()}.${format}`;
      const filepath = path.join(outputDir, filename);
      await fs.writeFile(filepath, formatted, 'utf-8');
      console.log(`✓ Report saved: ${filepath}`);
    }

    // Display summary
    console.log('\n' + report.summary);
    console.log('');

    // Exit with appropriate code
    const exitCode = report.failedScenarios > 0 ? 1 : 0;
    process.exit(exitCode);

  } catch (error) {
    console.error('\nError:', error instanceof Error ? error.message : 'Unknown error');
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { main };
