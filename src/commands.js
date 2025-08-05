import GitHubClient from './github-client.js';
import chalk from 'chalk';
import {
  displayRepositoryList,
  displayRepository,
  displayError,
  displaySuccess,
  displayWarning,
  displayInfo,
  createSpinner,
  confirmAction,
  selectRepository,
  selectMultipleRepositories,
  confirmBulkAction,
  displayBulkResults,
  getSearchQuery,
  formatDate,
  formatSize
} from './utils.js';

class GitHubCommands {
  constructor() {
    this.client = new GitHubClient();
  }

  async listRepositories(showDetails = false) {
    const spinner = createSpinner('Fetching repositories...');
    
    try {
      const repos = await this.client.listRepositories();
      spinner.succeed('Repositories fetched successfully');
      
      displayRepositoryList(repos, showDetails);
      return repos;
    } catch (error) {
      spinner.fail('Failed to fetch repositories');
      displayError(error);
      throw error;
    }
  }

  async searchRepositories() {
    const query = await getSearchQuery();
    const spinner = createSpinner(`Searching for repositories matching "${query}"...`);
    
    try {
      const repos = await this.client.searchRepositories(query);
      spinner.succeed(`Found ${repos.length} repositories matching "${query}"`);
      
      displayRepositoryList(repos);
      return repos;
    } catch (error) {
      spinner.fail('Failed to search repositories');
      displayError(error);
      throw error;
    }
  }

  async viewRepositoryDetails() {
    try {
      const repos = await this.client.listRepositories();
      
      if (repos.length === 0) {
        displayWarning('No repositories found.');
        return;
      }

      const selectedRepo = await selectRepository(repos, 'Select a repository to view details:', true);
      
      // Handle back option
      if (selectedRepo === 'back') {
        return;
      }
      
      const spinner = createSpinner('Fetching repository details...');
      
      try {
        const username = await this.client.getUsername();
        const repoDetails = await this.client.getRepository(username, selectedRepo.name);
        const stats = await this.client.getRepositoryStats(username, selectedRepo.name);
        
        spinner.succeed('Repository details fetched successfully');
        
        // Display detailed repository information
        displayRepository(repoDetails, true);
        
        // Display additional stats
        console.log(chalk.bold.cyan('\n📊 Repository Statistics:'));
        console.log(`   👥 Contributors: ${stats.contributors_count}`);
        
        if (Object.keys(stats.languages).length > 0) {
          console.log(`   📝 Languages: ${Object.entries(stats.languages)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([lang, bytes]) => `${lang} (${formatSize(bytes)})`)
            .join(', ')}`);
        }
        
        if (stats.last_commit) {
          console.log(`   🚀 Last commit: ${stats.last_commit.commit.message.split('\n')[0]}`);
          console.log(`   📅 Commit date: ${formatDate(stats.last_commit.commit.author.date)}`);
        }
        
      } catch (error) {
        spinner.fail('Failed to fetch repository details');
        displayError(error);
      }
      
    } catch (error) {
      displayError(error);
    }
  }

  async deleteRepository() {
    try {
      const repos = await this.client.listRepositories();
      
      if (repos.length === 0) {
        displayWarning('No repositories found.');
        return;
      }

      const selectedRepo = await selectRepository(repos, 'Select a repository to delete:', true);
      
      // Handle back option
      if (selectedRepo === 'back') {
        return;
      }
      
      // Show repository details before deletion
      displayRepository(selectedRepo, true);
      
      const confirm = await confirmAction(
        `Are you sure you want to delete the repository "${selectedRepo.name}"? This action cannot be undone.`
      );
      
      if (!confirm) {
        displayInfo('Repository deletion cancelled.');
        return;
      }

      const spinner = createSpinner(`Deleting repository "${selectedRepo.name}"...`);
      
      try {
        const username = await this.client.getUsername();
        await this.client.deleteRepository(username, selectedRepo.name);
        spinner.succeed(`Repository "${selectedRepo.name}" deleted successfully`);
        displaySuccess(`Repository "${selectedRepo.name}" has been permanently deleted.`);
      } catch (error) {
        spinner.fail(`Failed to delete repository "${selectedRepo.name}"`);
        displayError(error);
      }
      
    } catch (error) {
      displayError(error);
    }
  }

  async bulkDeleteRepositories() {
    try {
      const repos = await this.client.listRepositories();
      
      if (repos.length === 0) {
        displayWarning('No repositories found.');
        return;
      }

      // Show warning about bulk deletion
      console.log(chalk.bold.red('\n⚠️  WARNING: Bulk Repository Deletion'));
      console.log(chalk.red('This action will permanently delete multiple repositories.'));
      console.log(chalk.red('This action cannot be undone!'));
      console.log(chalk.gray('Make sure you have backups if needed.\n'));

      const selectedRepos = await selectMultipleRepositories(
        repos, 
        'Select repositories to delete (PERMANENT):',
        true
      );

      // Handle back option
      if (selectedRepos === 'back') {
        return;
      }

      if (selectedRepos.length === 0) {
        displayInfo('No repositories selected.');
        return;
      }

      // Show selected repositories
      console.log(chalk.bold.red('\n🗑️  Repositories to be deleted:'));
      selectedRepos.forEach((repo, index) => {
        console.log(chalk.red(`   ${index + 1}. ${repo.name}`));
        if (repo.description) {
          console.log(chalk.gray(`      ${repo.description}`));
        }
      });

      const confirm = await confirmBulkAction(
        selectedRepos, 
        'PERMANENTLY DELETE', 
        'DELETED (PERMANENT)'
      );

      if (!confirm) {
        displayInfo('Bulk deletion cancelled.');
        return;
      }

      // Final confirmation for dangerous operation
      const finalConfirm = await confirmAction(
        chalk.bold.red(`⚠️  FINAL WARNING: Are you absolutely sure you want to permanently delete ${selectedRepos.length} repository${selectedRepos.length === 1 ? '' : 'ies'}? This action cannot be undone!`)
      );

      if (!finalConfirm) {
        displayInfo('Bulk deletion cancelled at final confirmation.');
        return;
      }

      const spinner = createSpinner(`Deleting ${selectedRepos.length} repositories...`);
      
      try {
        const username = await this.client.getUsername();
        const { results, errors } = await this.client.bulkDeleteRepositories(username, selectedRepos);
        spinner.succeed(`Bulk deletion completed`);
        
        displayBulkResults(results, errors, 'deletion', 'DELETED');
        
        if (results.length > 0) {
          displayWarning(chalk.bold.red(`\n⚠️  ${results.length} repository${results.length === 1 ? '' : 'ies'} have been permanently deleted!`));
        }
        
      } catch (error) {
        spinner.fail('Failed to perform bulk deletion');
        displayError(error);
      }
      
    } catch (error) {
      displayError(error);
    }
  }

  async deleteRepositoryByName(repoName) {
    try {
      const username = await this.client.getUsername();
      
      // First, try to get the repository to verify it exists
      const spinner = createSpinner(`Verifying repository "${repoName}"...`);
      
      try {
        const repo = await this.client.getRepository(username, repoName);
        spinner.succeed(`Repository "${repoName}" found`);
        
        // Show repository details
        displayRepository(repo, true);
        
        const confirm = await confirmAction(
          `Are you sure you want to delete the repository "${repoName}"? This action cannot be undone.`
        );
        
        if (!confirm) {
          displayInfo('Repository deletion cancelled.');
          return;
        }

        const deleteSpinner = createSpinner(`Deleting repository "${repoName}"...`);
        
        try {
          await this.client.deleteRepository(username, repoName);
          deleteSpinner.succeed(`Repository "${repoName}" deleted successfully`);
          displaySuccess(`Repository "${repoName}" has been permanently deleted.`);
        } catch (error) {
          deleteSpinner.fail(`Failed to delete repository "${repoName}"`);
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

  async showUserInfo() {
    const spinner = createSpinner('Fetching user information...');
    
    try {
      const username = await this.client.getUsername();
      const repos = await this.client.listRepositories();
      
      spinner.succeed('User information fetched successfully');
      
      console.log(chalk.bold.green('\n👤 User Information:'));
      console.log(`   Username: ${chalk.cyan(username)}`);
      console.log(`   Total repositories: ${chalk.cyan(repos.length)}`);
      
      // Calculate some statistics
      const publicRepos = repos.filter(repo => !repo.private).length;
      const privateRepos = repos.filter(repo => repo.private).length;
      const archivedRepos = repos.filter(repo => repo.archived).length;
      const forks = repos.filter(repo => repo.fork).length;
      const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
      const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
      
      console.log(`   Public repositories: ${chalk.green(publicRepos)}`);
      console.log(`   Private repositories: ${chalk.red(privateRepos)}`);
      console.log(`   Archived repositories: ${chalk.gray(archivedRepos)}`);
      console.log(`   Forks: ${chalk.yellow(forks)}`);
      console.log(`   Total stars received: ${chalk.yellow(totalStars)}`);
      console.log(`   Total forks received: ${chalk.blue(totalForks)}`);
      
      // Most popular repositories
      const popularRepos = repos
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 5);
      
      if (popularRepos.length > 0) {
        console.log(chalk.bold.green('\n⭐ Most Popular Repositories:'));
        popularRepos.forEach((repo, index) => {
          console.log(`   ${index + 1}. ${chalk.cyan(repo.name)} - ${repo.stargazers_count} stars`);
        });
      }
      
    } catch (error) {
      spinner.fail('Failed to fetch user information');
      displayError(error);
      throw error;
    }
  }

  async debugArchivedRepositories() {
    const spinner = createSpinner('Fetching all repositories...');
    
    try {
      const repos = await this.client.listRepositories();
      spinner.succeed('Repositories fetched successfully');
      
      console.log(chalk.bold.cyan('\n🔍 Debug: Repository Archive Status'));
      console.log(chalk.gray(`Total repositories found: ${repos.length}`));
      
      const archivedRepos = repos.filter(repo => repo.archived);
      const activeRepos = repos.filter(repo => !repo.archived);
      
      console.log(chalk.green(`\n✅ Active repositories: ${activeRepos.length}`));
      activeRepos.forEach((repo, index) => {
        console.log(`   ${index + 1}. ${chalk.cyan(repo.name)} ${repo.private ? chalk.red('(Private)') : chalk.green('(Public)')}`);
      });
      
      console.log(chalk.gray(`\n📦 Archived repositories: ${archivedRepos.length}`));
      if (archivedRepos.length > 0) {
        archivedRepos.forEach((repo, index) => {
          console.log(`   ${index + 1}. ${chalk.cyan(repo.name)} ${repo.private ? chalk.red('(Private)') : chalk.green('(Public)')} - ${chalk.gray('Archived')}`);
        });
      } else {
        console.log(chalk.yellow('   No archived repositories found.'));
        console.log(chalk.gray('   This could mean:'));
        console.log(chalk.gray('   - You haven\'t archived any repositories yet'));
        console.log(chalk.gray('   - The repositories were archived through GitHub web interface'));
        console.log(chalk.gray('   - There might be an API permission issue'));
      }
      
      // Check for repositories that might be archived but not showing up
      console.log(chalk.bold.yellow('\n🔧 Troubleshooting Tips:'));
      console.log(chalk.gray('1. Make sure you archived the repository using this tool'));
      console.log(chalk.gray('2. Check if the repository appears in your GitHub profile'));
      console.log(chalk.gray('3. Verify your GitHub token has the correct permissions'));
      console.log(chalk.gray('4. Try refreshing the repository list'));
      
    } catch (error) {
      spinner.fail('Failed to fetch repositories');
      displayError(error);
    }
  }

  async changeRepositoryVisibility() {
    try {
      const repos = await this.client.listRepositories();
      
      if (repos.length === 0) {
        displayWarning('No repositories found.');
        return;
      }

      const selectedRepo = await selectRepository(repos, 'Select a repository to change visibility:', true);
      
      // Handle back option
      if (selectedRepo === 'back') {
        return;
      }
      
      // Show current repository details
      displayRepository(selectedRepo, true);
      
      const currentVisibility = selectedRepo.private ? 'Private' : 'Public';
      const newVisibility = selectedRepo.private ? 'Public' : 'Private';
      
      const confirm = await confirmAction(
        `Are you sure you want to change "${selectedRepo.name}" from ${currentVisibility} to ${newVisibility}?`
      );
      
      if (!confirm) {
        displayInfo('Visibility change cancelled.');
        return;
      }

      const spinner = createSpinner(`Changing "${selectedRepo.name}" to ${newVisibility}...`);
      
      try {
        const username = await this.client.getUsername();
        const updatedRepo = await this.client.updateRepositoryVisibility(username, selectedRepo.name, !selectedRepo.private);
        spinner.succeed(`Repository "${selectedRepo.name}" is now ${newVisibility}`);
        displaySuccess(`Repository "${selectedRepo.name}" visibility changed to ${newVisibility}.`);
        
        // Show updated repository info
        console.log(chalk.bold.cyan('\n📦 Updated Repository:'));
        console.log(`   Name: ${chalk.cyan(updatedRepo.name)}`);
        console.log(`   Full name: ${chalk.gray(updatedRepo.full_name)}`);
        console.log(`   Visibility: ${updatedRepo.private ? chalk.red('🔒 Private') : chalk.green('🌐 Public')}`);
        console.log(`   URL: ${chalk.underline.blue(updatedRepo.html_url)}`);
        
      } catch (error) {
        spinner.fail(`Failed to change visibility of "${selectedRepo.name}"`);
        displayError(error);
      }
      
    } catch (error) {
      displayError(error);
    }
  }

  async bulkChangeRepositoryVisibility() {
    try {
      // Ask user what visibility they want to set
      const { default: inquirer } = await import('inquirer');
      const { targetVisibility } = await inquirer.prompt([
        {
          type: 'list',
          name: 'targetVisibility',
          message: 'What visibility do you want to set for the selected repositories?',
          choices: [
            {
              name: '🌐 Public',
              value: false,
              short: 'Public'
            },
            {
              name: '🔒 Private',
              value: true,
              short: 'Private'
            }
          ]
        }
      ]);

      // Get repositories based on current visibility (opposite of target)
      const currentVisibility = targetVisibility ? 'Public' : 'Private';
      const targetVisibilityText = targetVisibility ? 'Private' : 'Public';
      
      let eligibleRepos;
      if (targetVisibility) {
        // Want to make private, so get public repositories
        eligibleRepos = await this.client.listPublicRepositories();
      } else {
        // Want to make public, so get private repositories
        eligibleRepos = await this.client.listPrivateRepositories();
      }

      if (eligibleRepos.length === 0) {
        displayInfo(`All repositories are already ${targetVisibilityText.toLowerCase()}.`);
        return;
      }

      const selectedRepos = await selectMultipleRepositories(
        eligibleRepos, 
        `Select repositories to change to ${targetVisibilityText}:`,
        true
      );

      // Handle back option
      if (selectedRepos === 'back') {
        return;
      }

      if (selectedRepos.length === 0) {
        displayInfo('No repositories selected.');
        return;
      }

      const confirm = await confirmBulkAction(
        selectedRepos, 
        `change visibility to ${targetVisibilityText}`, 
        targetVisibilityText
      );

      if (!confirm) {
        displayInfo('Bulk visibility change cancelled.');
        return;
      }

      const spinner = createSpinner(`Changing visibility for ${selectedRepos.length} repositories...`);
      
      try {
        const username = await this.client.getUsername();
        const { results, errors } = await this.client.bulkUpdateVisibility(username, selectedRepos, targetVisibility);
        spinner.succeed(`Bulk visibility change completed`);
        
        displayBulkResults(results, errors, 'visibility change', targetVisibilityText);
        
      } catch (error) {
        spinner.fail('Failed to perform bulk visibility change');
        displayError(error);
      }
      
    } catch (error) {
      displayError(error);
    }
  }

  async archiveRepository() {
    try {
      const repos = await this.client.listActiveRepositories();
      
      if (repos.length === 0) {
        displayWarning('No active repositories found to archive.');
        return;
      }

      const selectedRepo = await selectRepository(repos, 'Select a repository to archive:', true);
      
      // Handle back option
      if (selectedRepo === 'back') {
        return;
      }
      
      // Show repository details before archiving
      displayRepository(selectedRepo, true);
      
      const confirm = await confirmAction(
        `Are you sure you want to archive the repository "${selectedRepo.name}"? This will make it read-only.`
      );
      
      if (!confirm) {
        displayInfo('Repository archiving cancelled.');
        return;
      }

      const spinner = createSpinner(`Archiving repository "${selectedRepo.name}"...`);
      
      try {
        const username = await this.client.getUsername();
        const archivedRepo = await this.client.archiveRepository(username, selectedRepo.name);
        spinner.succeed(`Repository "${selectedRepo.name}" archived successfully`);
        displaySuccess(`Repository "${selectedRepo.name}" has been archived and is now read-only.`);
        
        // Show archived repository info
        console.log(chalk.bold.cyan('\n📦 Archived Repository:'));
        console.log(`   Name: ${chalk.cyan(archivedRepo.name)}`);
        console.log(`   Full name: ${chalk.gray(archivedRepo.full_name)}`);
        console.log(`   Status: ${chalk.gray('📦 Archived (read-only)')}`);
        console.log(`   URL: ${chalk.underline.blue(archivedRepo.html_url)}`);
        
      } catch (error) {
        spinner.fail(`Failed to archive repository "${selectedRepo.name}"`);
        displayError(error);
      }
      
    } catch (error) {
      displayError(error);
    }
  }

  async bulkArchiveRepositories() {
    try {
      const repos = await this.client.listActiveRepositories();
      
      if (repos.length === 0) {
        displayWarning('No active repositories found to archive.');
        return;
      }

      const selectedRepos = await selectMultipleRepositories(
        repos, 
        'Select repositories to archive:',
        true
      );

      // Handle back option
      if (selectedRepos === 'back') {
        return;
      }

      if (selectedRepos.length === 0) {
        displayInfo('No repositories selected.');
        return;
      }

      const confirm = await confirmBulkAction(
        selectedRepos, 
        'archive', 
        'Archived (read-only)'
      );

      if (!confirm) {
        displayInfo('Bulk archiving cancelled.');
        return;
      }

      const spinner = createSpinner(`Archiving ${selectedRepos.length} repositories...`);
      
      try {
        const username = await this.client.getUsername();
        const { results, errors } = await this.client.bulkArchiveRepositories(username, selectedRepos);
        spinner.succeed(`Bulk archiving completed`);
        
        displayBulkResults(results, errors, 'archiving', 'Archived');
        
      } catch (error) {
        spinner.fail('Failed to perform bulk archiving');
        displayError(error);
      }
      
    } catch (error) {
      displayError(error);
    }
  }

  async unarchiveRepository() {
    try {
      const repos = await this.client.listArchivedRepositories();
      
      if (repos.length === 0) {
        displayWarning('No archived repositories found.');
        return;
      }

      const selectedRepo = await selectRepository(repos, 'Select a repository to unarchive:', true);
      
      // Handle back option
      if (selectedRepo === 'back') {
        return;
      }
      
      // Show repository details before unarchiving
      displayRepository(selectedRepo, true);
      
      const confirm = await confirmAction(
        `Are you sure you want to unarchive the repository "${selectedRepo.name}"? This will make it editable again.`
      );
      
      if (!confirm) {
        displayInfo('Repository unarchiving cancelled.');
        return;
      }

      const spinner = createSpinner(`Unarchiving repository "${selectedRepo.name}"...`);
      
      try {
        const username = await this.client.getUsername();
        const unarchivedRepo = await this.client.unarchiveRepository(username, selectedRepo.name);
        spinner.succeed(`Repository "${selectedRepo.name}" unarchived successfully`);
        displaySuccess(`Repository "${selectedRepo.name}" has been unarchived and is now editable.`);
        
        // Show unarchived repository info
        console.log(chalk.bold.cyan('\n📦 Unarchived Repository:'));
        console.log(`   Name: ${chalk.cyan(unarchivedRepo.name)}`);
        console.log(`   Full name: ${chalk.gray(unarchivedRepo.full_name)}`);
        console.log(`   Status: ${chalk.green('✅ Active (editable)')}`);
        console.log(`   URL: ${chalk.underline.blue(unarchivedRepo.html_url)}`);
        
      } catch (error) {
        spinner.fail(`Failed to unarchive repository "${selectedRepo.name}"`);
        displayError(error);
      }
      
    } catch (error) {
      displayError(error);
    }
  }

  async bulkUnarchiveRepositories() {
    try {
      const repos = await this.client.listArchivedRepositories();
      
      if (repos.length === 0) {
        displayWarning('No archived repositories found.');
        return;
      }

      const selectedRepos = await selectMultipleRepositories(
        repos, 
        'Select repositories to unarchive:',
        true
      );

      // Handle back option
      if (selectedRepos === 'back') {
        return;
      }

      if (selectedRepos.length === 0) {
        displayInfo('No repositories selected.');
        return;
      }

      const confirm = await confirmBulkAction(
        selectedRepos, 
        'unarchive', 
        'Active (editable)'
      );

      if (!confirm) {
        displayInfo('Bulk unarchiving cancelled.');
        return;
      }

      const spinner = createSpinner(`Unarchiving ${selectedRepos.length} repositories...`);
      
      try {
        const username = await this.client.getUsername();
        const { results, errors } = await this.client.bulkUnarchiveRepositories(username, selectedRepos);
        spinner.succeed(`Bulk unarchiving completed`);
        
        displayBulkResults(results, errors, 'unarchiving', 'Active');
        
      } catch (error) {
        spinner.fail('Failed to perform bulk unarchiving');
        displayError(error);
      }
      
    } catch (error) {
      displayError(error);
    }
  }
}

export default GitHubCommands; 