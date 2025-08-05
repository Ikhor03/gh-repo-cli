#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import GitHubCommands from './src/commands.js';
import { 
  displayError, 
  displayInfo, 
  displaySuccess, 
  displayWarning,
  createSpinner,
  confirmAction,
  displayRepository
} from './src/utils.js';

class GitHubManager {
  constructor() {
    this.commands = new GitHubCommands();
  }

  async showMainMenu() {
    console.clear();
    console.log(chalk.bold.cyan('🚀 GitHub Repository Manager'));
    console.log(chalk.gray('Manage your GitHub repositories with ease\n'));

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          {
            name: '📋 List all repositories',
            value: 'list',
            short: 'List repos'
          },
          {
            name: '🔍 Search repositories',
            value: 'search',
            short: 'Search repos'
          },
          {
            name: '📖 View repository details',
            value: 'details',
            short: 'View details'
          },
          {
            name: '🔒 Change repository visibility',
            value: 'visibility',
            short: 'Change visibility'
          },
          {
            name: '🔒 Bulk change repository visibility',
            value: 'bulkVisibility',
            short: 'Bulk visibility'
          },
          {
            name: '📦 Archive repository',
            value: 'archive',
            short: 'Archive repo'
          },
          {
            name: '📦 Bulk archive repositories',
            value: 'bulkArchive',
            short: 'Bulk archive'
          },
          {
            name: '📦 Unarchive repository',
            value: 'unarchive',
            short: 'Unarchive repo'
          },
          {
            name: '📦 Bulk unarchive repositories',
            value: 'bulkUnarchive',
            short: 'Bulk unarchive'
          },
          {
            name: '🗑️  Delete repository (interactive)',
            value: 'delete',
            short: 'Delete repo'
          },
          {
            name: '🗑️  Bulk delete repositories',
            value: 'bulkDelete',
            short: 'Bulk delete'
          },
          {
            name: '🗑️  Delete repository by name',
            value: 'deleteByName',
            short: 'Delete by name'
          },
          {
            name: '👤 Show user information',
            value: 'userInfo',
            short: 'User info'
          },
          {
            name: '🔍 Debug archived repositories',
            value: 'debugArchived',
            short: 'Debug archived'
          },
          {
            name: '❌ Exit',
            value: 'exit',
            short: 'Exit'
          }
        ]
      }
    ]);

    return action;
  }

  async handleAction(action) {
    try {
      switch (action) {
        case 'list':
          await this.commands.listRepositories();
          break;
          
        case 'search':
          await this.commands.searchRepositories();
          break;
          
        case 'details':
          await this.commands.viewRepositoryDetails();
          break;
          
        case 'visibility':
          await this.commands.changeRepositoryVisibility();
          break;
          
        case 'bulkVisibility':
          await this.commands.bulkChangeRepositoryVisibility();
          break;
          
        case 'archive':
          await this.commands.archiveRepository();
          break;
          
        case 'bulkArchive':
          await this.commands.bulkArchiveRepositories();
          break;
          
        case 'unarchive':
          await this.commands.unarchiveRepository();
          break;
          
        case 'bulkUnarchive':
          await this.commands.bulkUnarchiveRepositories();
          break;
          
        case 'delete':
          await this.commands.deleteRepository();
          break;
          
        case 'bulkDelete':
          await this.commands.bulkDeleteRepositories();
          break;
          
        case 'deleteByName':
          await this.handleDeleteByName();
          break;
          
        case 'userInfo':
          await this.commands.showUserInfo();
          break;
          
        case 'debugArchived':
          await this.commands.debugArchivedRepositories();
          break;
          
        case 'exit':
          displaySuccess('Goodbye! 👋');
          process.exit(0);
          break;
          
        default:
          displayError('Invalid action selected');
      }
    } catch (error) {
      displayError(error);
    }
  }

  async handleDeleteByName() {
    const { repoName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'repoName',
        message: 'Enter the repository name to delete:',
        validate: (input) => {
          if (input.trim().length === 0) {
            return 'Repository name cannot be empty';
          }
          return true;
        }
      }
    ]);

    await this.commands.deleteRepositoryByName(repoName.trim());
  }

  async handleVisibilityChangeByName(repoName) {
    try {
      const username = await this.commands.client.getUsername();
      
      // First, try to get the repository to verify it exists
      const spinner = createSpinner(`Verifying repository "${repoName}"...`);
      
      try {
        const repo = await this.commands.client.getRepository(username, repoName);
        spinner.succeed(`Repository "${repoName}" found`);
        
        // Show repository details
        displayRepository(repo, true);
        
        const currentVisibility = repo.private ? 'Private' : 'Public';
        const newVisibility = repo.private ? 'Public' : 'Private';
        
        const confirm = await confirmAction(
          `Are you sure you want to change "${repoName}" from ${currentVisibility} to ${newVisibility}?`
        );
        
        if (!confirm) {
          displayInfo('Visibility change cancelled.');
          return;
        }

        const updateSpinner = createSpinner(`Changing "${repoName}" to ${newVisibility}...`);
        
        try {
          const updatedRepo = await this.commands.client.updateRepositoryVisibility(username, repoName, !repo.private);
          updateSpinner.succeed(`Repository "${repoName}" is now ${newVisibility}`);
          displaySuccess(`Repository "${repoName}" visibility changed to ${newVisibility}.`);
          
          // Show updated repository info
          console.log(chalk.bold.cyan('\n📦 Updated Repository:'));
          console.log(`   Name: ${chalk.cyan(updatedRepo.name)}`);
          console.log(`   Full name: ${chalk.gray(updatedRepo.full_name)}`);
          console.log(`   Visibility: ${updatedRepo.private ? chalk.red('🔒 Private') : chalk.green('🌐 Public')}`);
          console.log(`   URL: ${chalk.underline.blue(updatedRepo.html_url)}`);
          
        } catch (error) {
          updateSpinner.fail(`Failed to change visibility of "${repoName}"`);
          displayError(error);
        }
        
      } catch (error) {
        spinner.fail(`Repository "${repoName}" not found`);
        displayError(error);
      }
      
    } catch (error) {
      displayError(error);
    }
  }

  async handleArchiveByName(repoName) {
    try {
      const username = await this.commands.client.getUsername();
      
      // First, try to get the repository to verify it exists
      const spinner = createSpinner(`Verifying repository "${repoName}"...`);
      
      try {
        const repo = await this.commands.client.getRepository(username, repoName);
        spinner.succeed(`Repository "${repoName}" found`);
        
        if (repo.archived) {
          displayWarning(`Repository "${repoName}" is already archived.`);
          return;
        }
        
        // Show repository details
        displayRepository(repo, true);
        
        const confirm = await confirmAction(
          `Are you sure you want to archive the repository "${repoName}"? This will make it read-only.`
        );
        
        if (!confirm) {
          displayInfo('Repository archiving cancelled.');
          return;
        }

        const archiveSpinner = createSpinner(`Archiving repository "${repoName}"...`);
        
        try {
          const archivedRepo = await this.commands.client.archiveRepository(username, repoName);
          archiveSpinner.succeed(`Repository "${repoName}" archived successfully`);
          displaySuccess(`Repository "${repoName}" has been archived and is now read-only.`);
          
          // Show archived repository info
          console.log(chalk.bold.cyan('\n📦 Archived Repository:'));
          console.log(`   Name: ${chalk.cyan(archivedRepo.name)}`);
          console.log(`   Full name: ${chalk.gray(archivedRepo.full_name)}`);
          console.log(`   Status: ${chalk.gray('📦 Archived (read-only)')}`);
          console.log(`   URL: ${chalk.underline.blue(archivedRepo.html_url)}`);
          
        } catch (error) {
          archiveSpinner.fail(`Failed to archive repository "${repoName}"`);
          displayError(error);
        }
        
      } catch (error) {
        spinner.fail(`Repository "${repoName}" not found`);
        displayError(error);
      }
      
    } catch (error) {
      displayError(error);
    }
  }

  async handleUnarchiveByName(repoName) {
    try {
      const username = await this.commands.client.getUsername();
      
      // First, try to get the repository to verify it exists
      const spinner = createSpinner(`Verifying repository "${repoName}"...`);
      
      try {
        const repo = await this.commands.client.getRepository(username, repoName);
        spinner.succeed(`Repository "${repoName}" found`);
        
        if (!repo.archived) {
          displayWarning(`Repository "${repoName}" is not archived.`);
          return;
        }
        
        // Show repository details
        displayRepository(repo, true);
        
        const confirm = await confirmAction(
          `Are you sure you want to unarchive the repository "${repoName}"? This will make it editable again.`
        );
        
        if (!confirm) {
          displayInfo('Repository unarchiving cancelled.');
          return;
        }

        const unarchiveSpinner = createSpinner(`Unarchiving repository "${repoName}"...`);
        
        try {
          const unarchivedRepo = await this.commands.client.unarchiveRepository(username, repoName);
          unarchiveSpinner.succeed(`Repository "${repoName}" unarchived successfully`);
          displaySuccess(`Repository "${repoName}" has been unarchived and is now editable.`);
          
          // Show unarchived repository info
          console.log(chalk.bold.cyan('\n📦 Unarchived Repository:'));
          console.log(`   Name: ${chalk.cyan(unarchivedRepo.name)}`);
          console.log(`   Full name: ${chalk.gray(unarchivedRepo.full_name)}`);
          console.log(`   Status: ${chalk.green('✅ Active (editable)')}`);
          console.log(`   URL: ${chalk.underline.blue(unarchivedRepo.html_url)}`);
          
        } catch (error) {
          unarchiveSpinner.fail(`Failed to unarchive repository "${repoName}"`);
          displayError(error);
        }
        
      } catch (error) {
        spinner.fail(`Repository "${repoName}" not found`);
        displayError(error);
      }
      
    } catch (error) {
      displayError(error);
    }
  }

  async run() {
    try {
      // Test connection first
      displayInfo('Testing GitHub connection...');
      await this.commands.showUserInfo();
      
      // Main loop
      while (true) {
        const action = await this.showMainMenu();
        await this.handleAction(action);
        
        // Wait for user to continue
        await inquirer.prompt([
          {
            type: 'input',
            name: 'continue',
            message: chalk.gray('Press Enter to continue...')
          }
        ]);
      }
    } catch (error) {
      displayError(error);
      process.exit(1);
    }
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.length > 0) {
  // Handle help command first (no GitHub client needed)
  if (args[0] === 'help') {
    console.log(chalk.bold.cyan('GitHub Repository Manager - Command Line Usage'));
    console.log(chalk.gray('\nAvailable commands:'));
    console.log('  list [--details]     List all repositories');
    console.log('  search [query]       Search repositories');
    console.log('  visibility [repo]    Change repository visibility');
    console.log('  archive [repo]       Archive repository');
    console.log('  unarchive [repo]     Unarchive repository');
    console.log('  delete [repo-name]   Delete repository');
    console.log('  bulk-delete          Bulk delete repositories');
    console.log('  info                 Show user information');
    console.log('  help                 Show this help message');
    console.log('\nExamples:');
    console.log('  node index.js list');
    console.log('  node index.js list --details');
    console.log('  node index.js search "react"');
    console.log('  node index.js visibility my-repo');
    console.log('  node index.js archive old-project');
    console.log('  node index.js unarchive old-project');
    console.log('  node index.js delete my-repo');
    console.log('  node index.js bulk-delete');
    console.log('  node index.js info');
    console.log('\nSetup:');
    console.log('  1. Copy env.example to .env');
    console.log('  2. Add your GitHub token to .env file');
    console.log('  3. Run: npm install');
    process.exit(0);
  }

  // Command line mode (requires GitHub client)
  const manager = new GitHubManager();
  
  (async () => {
    try {
      switch (args[0]) {
        case 'list':
          await manager.commands.listRepositories(args.includes('--details'));
          break;
          
        case 'search':
          if (args[1]) {
            // Direct search with query
            const { createSpinner, displayRepositoryList, displayError } = await import('./src/utils.js');
            const spinner = createSpinner(`Searching for repositories matching "${args[1]}"...`);
            try {
              const repos = await manager.commands.client.searchRepositories(args[1]);
              spinner.succeed(`Found ${repos.length} repositories matching "${args[1]}"`);
              displayRepositoryList(repos);
            } catch (error) {
              spinner.fail('Failed to search repositories');
              displayError(error);
            }
          } else {
            await manager.commands.searchRepositories();
          }
          break;
          
        case 'visibility':
          if (args[1]) {
            // Direct visibility change with repository name
            await manager.handleVisibilityChangeByName(args[1]);
          } else {
            await manager.commands.changeRepositoryVisibility();
          }
          break;
          
        case 'archive':
          if (args[1]) {
            // Direct archive with repository name
            await manager.handleArchiveByName(args[1]);
          } else {
            await manager.commands.archiveRepository();
          }
          break;
          
        case 'unarchive':
          if (args[1]) {
            // Direct unarchive with repository name
            await manager.handleUnarchiveByName(args[1]);
          } else {
            await manager.commands.unarchiveRepository();
          }
          break;
          
        case 'delete':
          if (args[1]) {
            // Direct delete with repository name
            await manager.commands.deleteRepositoryByName(args[1]);
          } else {
            await manager.commands.deleteRepository();
          }
          break;
          
        case 'bulk-delete':
          await manager.commands.bulkDeleteRepositories();
          break;
          
        case 'info':
          await manager.commands.showUserInfo();
          break;
          
        default:
          console.log(chalk.red(`Unknown command: ${args[0]}`));
          console.log(chalk.gray('Run "node index.js help" for usage information'));
          process.exit(1);
      }
    } catch (error) {
      displayError(error);
      process.exit(1);
    }
  })();
} else {
  // Interactive mode
  const manager = new GitHubManager();
  manager.run();
} 