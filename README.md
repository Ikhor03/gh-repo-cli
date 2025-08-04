# GitHub Repository Manager

A powerful Node.js CLI tool to manage your GitHub repositories with ease. List, search, view details, and delete repositories through an interactive interface or command line.

## Features

- 📋 **List Repositories**: View all your GitHub repositories with detailed information
- 🔍 **Search Repositories**: Search repositories by name, description, or other criteria
- 📖 **Repository Details**: Get comprehensive information about specific repositories
- 🔒 **Change Visibility**: Toggle repositories between public and private
- 🔒 **Bulk Visibility Management**: Change visibility for multiple repositories at once
- 📦 **Archive/Unarchive**: Archive repositories to make them read-only or unarchive them
- 📦 **Bulk Archive/Unarchive**: Archive or unarchive multiple repositories at once
- 🗑️ **Delete Repositories**: Safely delete repositories with confirmation prompts
- 👤 **User Information**: View your GitHub profile statistics and repository analytics
- 🎨 **Beautiful UI**: Colorful, emoji-rich interface with loading spinners
- 🔧 **Flexible Usage**: Both interactive and command-line modes

### Repository Management Features

#### Visibility Management
- **Public to Private**: Convert public repositories to private
- **Private to Public**: Convert private repositories to public
- **Bulk Operations**: Change visibility for multiple repositories at once
- **Smart Filtering**: Only show repositories that can be changed to target visibility
- **Confirmation Prompts**: Safe confirmation before making changes
- **Status Display**: Clear indication of current visibility status

#### Archive Management
- **Archive Repositories**: Make repositories read-only without deleting them
- **Unarchive Repositories**: Restore archived repositories to editable state
- **Bulk Operations**: Archive or unarchive multiple repositories at once
- **Archive Status**: Visual indicators for archived repositories
- **Smart Filtering**: Only show relevant repositories (active vs archived)

#### Safety Features
- **Repository Verification**: Verify repositories exist before operations
- **Confirmation Dialogs**: Require explicit confirmation for destructive actions
- **Bulk Operation Safety**: Comprehensive confirmation and progress tracking for bulk operations
- **Error Handling**: Comprehensive error messages and recovery
- **Status Feedback**: Clear success/failure messages with details
- **Progress Tracking**: Real-time feedback during bulk operations

## Prerequisites

- Node.js (version 16 or higher)
- GitHub Personal Access Token

## Setup

1. **Clone or download this repository**
   ```bash
   git clone <repository-url>
   cd github-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a GitHub Personal Access Token**
   - Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
   - Click "Generate new token (classic)"
   - Select the following scopes:
     - `repo` (Full control of private repositories)
     - `delete_repo` (Delete repositories)
   - Copy the generated token

4. **Configure environment variables**

   **Option A: Use the setup script (recommended)**
   ```bash
   npm run setup
   ```
   This will guide you through the setup process interactively.

   **Option B: Manual setup**
   ```bash
   cp env.example .env
   ```
   
   Edit the `.env` file and add your GitHub token:
   ```
   GITHUB_TOKEN=your_github_personal_access_token_here
   GITHUB_USERNAME=your_github_username_here  # Optional
   ```

## Usage

### Interactive Mode

Run the program without arguments to start the interactive interface:

```bash
npm start
# or
node index.js
```

You'll see a menu with the following options:
- 📋 List all repositories
- 🔍 Search repositories
- 📖 View repository details
- 🔒 Change repository visibility
- 🔒 Bulk change repository visibility
- 📦 Archive repository
- 📦 Bulk archive repositories
- 📦 Unarchive repository
- 📦 Bulk unarchive repositories
- 🗑️ Delete repository (interactive)
- 🗑️ Delete repository by name
- 👤 Show user information
- ❌ Exit

### Command Line Mode

You can also use the program directly from the command line:

```bash
# List all repositories
node index.js list

# List repositories with detailed information
node index.js list --details

# Search repositories
node index.js search "react"

# Change repository visibility
node index.js visibility my-repo-name

# Archive a repository
node index.js archive old-project

# Unarchive a repository
node index.js unarchive old-project

# Delete a specific repository
node index.js delete my-repo-name

# Show user information
node index.js info

# Show help
node index.js help
```

## Examples

### List Repositories
```bash
node index.js list
```
Output:
```
📋 Found 15 repositories:

1.
📦 my-awesome-project
   username/my-awesome-project
   A really cool project I'm working on
   🌐 Public 📝 JavaScript
   ⭐ 42 | 🔀 12
   📅 Updated: Dec 15, 2023, 2:30 PM
   🔗 https://github.com/username/my-awesome-project
```

### Search Repositories
```bash
node index.js search "react"
```
Output:
```
🔍 Found 3 repositories matching "react":

1.
📦 react-todo-app
   username/react-todo-app
   A simple todo app built with React
   🌐 Public 📝 JavaScript
   ⭐ 15 | 🔀 3
   📅 Updated: Dec 10, 2023, 1:45 PM
   🔗 https://github.com/username/react-todo-app
```

### Change Repository Visibility
```bash
node index.js visibility my-repo
```
The program will:
1. Verify the repository exists
2. Show current repository details
3. Ask for confirmation to change visibility
4. Toggle between public and private if confirmed

### Archive Repository
```bash
node index.js archive old-project
```
The program will:
1. Verify the repository exists
2. Show repository details
3. Ask for confirmation
4. Archive the repository (make it read-only) if confirmed

### Unarchive Repository
```bash
node index.js unarchive old-project
```
The program will:
1. Verify the repository exists
2. Show repository details
3. Ask for confirmation
4. Unarchive the repository (make it editable again) if confirmed

### Bulk Change Repository Visibility
```bash
# Interactive mode - select from menu
```
The program will:
1. Ask you to choose target visibility (Public or Private)
2. Show only repositories that can be changed to that visibility
3. Allow multiple selection with checkboxes
4. Show confirmation with selected repositories
5. Process all selected repositories
6. Display detailed results with success/failure summary

### Bulk Archive Repositories
```bash
# Interactive mode - select from menu
```
The program will:
1. Show only active (non-archived) repositories
2. Allow multiple selection with checkboxes
3. Show confirmation with selected repositories
4. Archive all selected repositories
5. Display detailed results with success/failure summary

### Bulk Unarchive Repositories
```bash
# Interactive mode - select from menu
```
The program will:
1. Show only archived repositories
2. Allow multiple selection with checkboxes
3. Show confirmation with selected repositories
4. Unarchive all selected repositories
5. Display detailed results with success/failure summary

### Delete Repository
```bash
node index.js delete old-project
```
The program will:
1. Verify the repository exists
2. Show repository details
3. Ask for confirmation
4. Delete the repository if confirmed

## Repository Information Displayed

For each repository, the program shows:
- Repository name and full name
- Description (truncated if too long)
- Visibility (Public/Private)
- Fork status
- Primary programming language
- Archive status (if archived)
- Star and fork counts
- Last updated date
- GitHub URL
- Creation date (in detailed view)
- Default branch
- Repository size
- Open issues count
- Topics/tags

## Bulk Operations Effectiveness

The bulk operations feature significantly improves efficiency for users managing multiple repositories:

### **Time Savings**
- **Before**: Process repositories one by one (e.g., 10 repos = 10 separate operations)
- **After**: Process multiple repositories in a single operation (e.g., 10 repos = 1 bulk operation)

### **Use Cases**
- **Organization Management**: Quickly archive old projects across multiple repositories
- **Privacy Updates**: Bulk change visibility for multiple repositories
- **Repository Cleanup**: Mass archive repositories that are no longer actively maintained
- **Access Control**: Quickly make multiple repositories private or public

### **Safety Features**
- **Select All/None**: Quick selection options for large repository lists
- **Smart Filtering**: Only shows relevant repositories (e.g., only active repos for archiving)
- **Confirmation**: Clear summary of what will be changed before execution
- **Error Handling**: Continues processing even if some operations fail
- **Detailed Results**: Shows success/failure for each repository with summary statistics

### **Example Workflow**
1. Choose "Bulk archive repositories"
2. Select multiple repositories using checkboxes
3. Review confirmation showing selected repositories
4. Execute bulk operation
5. Review results showing success/failure for each repository

## User Information

The user information feature displays:
- GitHub username
- Total repository count
- Public vs private repository breakdown
- Archived repository count
- Fork count
- Total stars and forks received
- Most popular repositories

## Safety Features

- **Confirmation Prompts**: All delete operations require explicit confirmation
- **Repository Verification**: The program verifies repositories exist before attempting deletion
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Token Validation**: Validates GitHub token on startup

## Error Handling

The program handles various error scenarios:
- Invalid or expired GitHub token
- Network connectivity issues
- Repository not found
- Insufficient permissions
- Rate limiting

## Development

### Project Structure
```
github-management/
├── src/
│   ├── github-client.js    # GitHub API client
│   ├── commands.js         # Command handlers
│   └── utils.js           # Utility functions
├── index.js               # Main entry point
├── package.json           # Dependencies and scripts
├── env.example           # Environment variables template
└── README.md             # This file
```

### Dependencies
- `@octokit/rest`: GitHub API client
- `inquirer`: Interactive command line interface
- `chalk`: Terminal string styling
- `ora`: Terminal spinners
- `dotenv`: Environment variable management

### Running in Development
```bash
npm run dev
```

## Troubleshooting

### Common Issues

1. **"GitHub token not found"**
   - Make sure you've created a `.env` file with your `GITHUB_TOKEN`
   - Verify the token has the required permissions

2. **"Failed to get username"**
   - Check if your GitHub token is valid and not expired
   - Ensure the token has the `read:user` scope

3. **"Repository not found"**
   - Verify the repository name is correct
   - Check if you have access to the repository

4. **"Failed to delete repository"**
   - Ensure your token has the `delete_repo` scope
   - Check if you have admin access to the repository

### Getting Help

If you encounter issues:
1. Check the error messages for specific details
2. Verify your GitHub token permissions
3. Ensure you have the correct repository names
4. Check your internet connection

## Contributing

Feel free to contribute to this project by:
- Reporting bugs
- Suggesting new features
- Submitting pull requests
- Improving documentation

## License

This project is licensed under the MIT License.

## Disclaimer

⚠️ **Warning**: This tool can permanently delete repositories. Always double-check repository names and confirm deletion prompts. The authors are not responsible for any data loss. 