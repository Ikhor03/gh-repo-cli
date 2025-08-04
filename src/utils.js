import chalk from 'chalk';
import ora from 'ora';

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

export const displayRepository = (repo, showDetails = false) => {
  const visibility = repo.private ? chalk.red('🔒 Private') : chalk.green('🌐 Public');
  const fork = repo.fork ? chalk.yellow('🔀 Fork') : '';
  const language = repo.language ? chalk.blue(`📝 ${repo.language}`) : '';
  const archived = repo.archived ? chalk.gray('📦 Archived') : '';
  
  console.log(chalk.bold.cyan(`\n📦 ${repo.name}`));
  console.log(`   ${chalk.gray(repo.full_name)}`);
  
  if (repo.description) {
    console.log(`   ${chalk.white(truncateText(repo.description, 80))}`);
  }
  
  console.log(`   ${visibility} ${fork} ${language} ${archived}`);
  console.log(`   ⭐ ${repo.stargazers_count} | 🔀 ${repo.forks_count}`);
  console.log(`   📅 Updated: ${formatDate(repo.updated_at)}`);
  console.log(`   🔗 ${chalk.underline.blue(repo.html_url)}`);
  
  if (showDetails) {
    console.log(`   📅 Created: ${formatDate(repo.created_at)}`);
    console.log(`   🎯 Default branch: ${repo.default_branch || 'main'}`);
    if (repo.size !== undefined) {
      console.log(`   📊 Size: ${formatSize(repo.size * 1024)}`);
    }
    if (repo.open_issues_count !== undefined) {
      console.log(`   🐛 Open issues: ${repo.open_issues_count}`);
    }
    if (repo.topics && repo.topics.length > 0) {
      console.log(`   🏷️  Topics: ${repo.topics.join(', ')}`);
    }
  }
};

export const displayRepositoryList = (repos, showDetails = false) => {
  if (repos.length === 0) {
    console.log(chalk.yellow('No repositories found.'));
    return;
  }

  console.log(chalk.bold.green(`\n📋 Found ${repos.length} repository${repos.length === 1 ? '' : 'ies'}:`));
  
  repos.forEach((repo, index) => {
    console.log(chalk.gray(`\n${index + 1}.`));
    displayRepository(repo, showDetails);
  });
};

export const createSpinner = (text) => {
  return ora(text).start();
};

export const confirmAction = async (message) => {
  const { default: inquirer } = await import('inquirer');
  
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: message,
      default: false
    }
  ]);
  
  return confirm;
};

export const selectRepository = async (repos, message = 'Select a repository:') => {
  const { default: inquirer } = await import('inquirer');
  
  if (repos.length === 0) {
    throw new Error('No repositories available for selection.');
  }

  const choices = repos.map((repo, index) => ({
    name: `${repo.name}${repo.description ? ` - ${truncateText(repo.description, 40)}` : ''}`,
    value: repo,
    short: repo.name
  }));

  const { selectedRepo } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedRepo',
      message: message,
      choices: choices,
      pageSize: 10
    }
  ]);

  return selectedRepo;
};

export const selectMultipleRepositories = async (repos, message = 'Select repositories:') => {
  const { default: inquirer } = await import('inquirer');
  
  if (repos.length === 0) {
    throw new Error('No repositories available for selection.');
  }

  const choices = [
    {
      name: '✅ Select All',
      value: 'select-all',
      short: 'Select All'
    },
    {
      name: '❌ Select None',
      value: 'select-none',
      short: 'Select None'
    },
    new inquirer.Separator(),
    ...repos.map((repo, index) => ({
      name: `${repo.name}${repo.description ? ` - ${truncateText(repo.description, 40)}` : ''}`,
      value: repo.name,
      short: repo.name,
      checked: false
    }))
  ];

  const { selectedRepos } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedRepos',
      message: message,
      choices: choices,
      pageSize: 15,
      validate: (input) => {
        if (input.length === 0) {
          return 'Please select at least one repository';
        }
        return true;
      }
    }
  ]);

  // Handle select all/none options
  if (selectedRepos.includes('select-all')) {
    return repos;
  } else if (selectedRepos.includes('select-none')) {
    return [];
  } else {
    return repos.filter(repo => selectedRepos.includes(repo.name));
  }
};

export const confirmBulkAction = async (repos, action, targetState) => {
  const { default: inquirer } = await import('inquirer');
  
  console.log(chalk.bold.yellow(`\n⚠️  Bulk Action Confirmation`));
  console.log(chalk.gray(`Action: ${action}`));
  console.log(chalk.gray(`Target State: ${targetState}`));
  console.log(chalk.gray(`Repositories to process: ${repos.length}`));
  
  if (repos.length <= 5) {
    console.log(chalk.cyan('\nSelected repositories:'));
    repos.forEach((repo, index) => {
      console.log(`   ${index + 1}. ${chalk.cyan(repo.name)}`);
    });
  } else {
    console.log(chalk.cyan('\nSelected repositories:'));
    repos.slice(0, 3).forEach((repo, index) => {
      console.log(`   ${index + 1}. ${chalk.cyan(repo.name)}`);
    });
    console.log(chalk.gray(`   ... and ${repos.length - 3} more`));
  }

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Are you sure you want to ${action} ${repos.length} repository${repos.length === 1 ? '' : 'ies'}?`,
      default: false
    }
  ]);

  return confirm;
};

export const getSearchQuery = async () => {
  const { default: inquirer } = await import('inquirer');
  
  const { query } = await inquirer.prompt([
    {
      type: 'input',
      name: 'query',
      message: 'Enter search query:',
      validate: (input) => {
        if (input.trim().length === 0) {
          return 'Search query cannot be empty';
        }
        return true;
      }
    }
  ]);

  return query.trim();
};

export const displayError = (error) => {
  console.log(chalk.red(`\n❌ Error: ${error.message}`));
  if (error.response?.status) {
    console.log(chalk.gray(`Status: ${error.response.status}`));
  }
};

export const displaySuccess = (message) => {
  console.log(chalk.green(`\n✅ ${message}`));
};

export const displayWarning = (message) => {
  console.log(chalk.yellow(`\n⚠️  ${message}`));
};

export const displayInfo = (message) => {
  console.log(chalk.blue(`\nℹ️  ${message}`));
};

export const displayBulkResults = (results, errors, action, targetState) => {
  console.log(chalk.bold.green(`\n✅ Bulk ${action} Results`));
  console.log(chalk.gray(`Target State: ${targetState}`));
  
  if (results.length > 0) {
    console.log(chalk.green(`\n✅ Successfully processed ${results.length} repository${results.length === 1 ? '' : 'ies'}:`));
    results.forEach((result, index) => {
      console.log(`   ${index + 1}. ${chalk.cyan(result.name)}`);
    });
  }
  
  if (errors.length > 0) {
    console.log(chalk.red(`\n❌ Failed to process ${errors.length} repository${errors.length === 1 ? '' : 'ies'}:`));
    errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${chalk.cyan(error.name)} - ${chalk.red(error.error)}`);
    });
  }
  
  const totalProcessed = results.length + errors.length;
  const successRate = totalProcessed > 0 ? Math.round((results.length / totalProcessed) * 100) : 0;
  
  console.log(chalk.bold.cyan(`\n📊 Summary:`));
  console.log(`   Total processed: ${totalProcessed}`);
  console.log(`   Successful: ${results.length}`);
  console.log(`   Failed: ${errors.length}`);
  console.log(`   Success rate: ${successRate}%`);
}; 