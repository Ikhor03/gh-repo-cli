#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import inquirer from 'inquirer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setup() {
  console.log(chalk.bold.cyan('🚀 GitHub Repository Manager Setup'));
  console.log(chalk.gray('Let\'s get you set up to manage your GitHub repositories!\n'));

  // Check if .env already exists
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'A .env file already exists. Do you want to overwrite it?',
        default: false
      }
    ]);

    if (!overwrite) {
      console.log(chalk.yellow('Setup cancelled. Your existing .env file was preserved.'));
      return;
    }
  }

  console.log(chalk.blue('📋 To get your GitHub Personal Access Token:'));
  console.log(chalk.gray('1. Go to https://github.com/settings/tokens'));
  console.log(chalk.gray('2. Click "Generate new token (classic)"'));
      console.log(chalk.gray('3. Select the following scopes:'));
    console.log(chalk.gray('   - repo (Full control of private repositories)'));
    console.log(chalk.gray('   - delete_repo (Delete repositories)'));
    console.log(chalk.gray('   - admin:org (For organization repositories)'));
  console.log(chalk.gray('4. Copy the generated token\n'));

  const { token, username } = await inquirer.prompt([
    {
      type: 'password',
      name: 'token',
      message: 'Enter your GitHub Personal Access Token:',
      validate: (input) => {
        if (!input || input.trim().length === 0) {
          return 'Token cannot be empty';
        }
        if (input.length < 20) {
          return 'Token seems too short. Please check your token.';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'username',
      message: 'Enter your GitHub username (optional, will be fetched from token):',
      default: ''
    }
  ]);

  // Create .env content
  let envContent = `# GitHub Personal Access Token\n`;
  envContent += `# Get your token from: https://github.com/settings/tokens\n`;
  envContent += `# Make sure it has the following permissions:\n`;
  envContent += `# - repo (Full control of private repositories)\n`;
  envContent += `# - delete_repo (Delete repositories)\n`;
  envContent += `GITHUB_TOKEN=${token.trim()}\n\n`;

  if (username.trim()) {
    envContent += `# GitHub Username (optional, will be fetched from token if not provided)\n`;
    envContent += `GITHUB_USERNAME=${username.trim()}\n`;
  } else {
    envContent += `# GitHub Username (optional, will be fetched from token if not provided)\n`;
    envContent += `# GITHUB_USERNAME=your_github_username_here\n`;
  }

  try {
    fs.writeFileSync(envPath, envContent);
    console.log(chalk.green('\n✅ Setup completed successfully!'));
    console.log(chalk.gray('Your .env file has been created with your GitHub token.'));
    console.log(chalk.gray('\nYou can now run the program:'));
    console.log(chalk.cyan('  npm start'));
    console.log(chalk.gray('or'));
    console.log(chalk.cyan('  node index.js'));
    console.log(chalk.gray('\nFor command line usage, try:'));
    console.log(chalk.cyan('  node index.js help'));
  } catch (error) {
    console.log(chalk.red('\n❌ Failed to create .env file:'));
    console.log(chalk.red(error.message));
    console.log(chalk.gray('\nPlease create the .env file manually by copying env.example'));
  }
}

// Run setup
setup().catch(console.error); 