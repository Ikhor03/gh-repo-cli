import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';

dotenv.config();

class GitHubClient {
  constructor() {
    const token = process.env.GITHUB_TOKEN;
    
    if (!token) {
      throw new Error('GitHub token not found. Please set GITHUB_TOKEN in your .env file');
    }

    this.octokit = new Octokit({
      auth: token,
    });

    this.username = process.env.GITHUB_USERNAME;
  }

  async getUsername() {
    if (this.username) {
      return this.username;
    }

    try {
      const { data } = await this.octokit.users.getAuthenticated();
      this.username = data.login;
      return this.username;
    } catch (error) {
      throw new Error(`Failed to get username: ${error.message}`);
    }
  }

  async listRepositories(options = {}) {
    try {
      const { data: repos } = await this.octokit.repos.listForAuthenticatedUser({
        per_page: 100,
        page: 2,
        sort: 'updated',
        direction: 'asc',
        ...options
      });

      return repos.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        private: repo.private,
        fork: repo.fork,
        language: repo.language,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        updated_at: repo.updated_at,
        created_at: repo.created_at,
        html_url: repo.html_url,
        clone_url: repo.clone_url,
        archived: repo.archived || false
      }));
    } catch (error) {
      throw new Error(`Failed to list repositories: ${error.message}`);
    }
  }

  async listArchivedRepositories() {
    try {
      const repos = await this.listRepositories();
      return repos.filter(repo => repo.archived);
    } catch (error) {
      throw new Error(`Failed to list archived repositories: ${error.message}`);
    }
  }



  async listActiveRepositories() {
    try {
      const repos = await this.listRepositories();
      return repos.filter(repo => !repo.archived);
    } catch (error) {
      throw new Error(`Failed to list active repositories: ${error.message}`);
    }
  }

  async listPublicRepositories() {
    try {
        const repos = await this.listRepositories();
        return repos.filter(repo => !repo.private);
      } catch (error) {
        throw new Error(`Failed to list active repositories: ${error.message}`);
      }
  }

  async listPrivateRepositories() {
    try {
        const repos = await this.listRepositories();
        return repos.filter(repo => repo.private);
      } catch (error) {
        throw new Error(`Failed to list active repositories: ${error.message}`);
      }
  }

  async searchRepositories(query, options = {}) {
    try {
      const username = await this.getUsername();
      const { data } = await this.octokit.search.repos({
        q: `${query} user:${username}`,
        per_page: 100,
        sort: 'updated',
        ...options
      });

      return data.items.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        private: repo.private,
        fork: repo.fork,
        language: repo.language,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        updated_at: repo.updated_at,
        created_at: repo.created_at,
        html_url: repo.html_url,
        clone_url: repo.clone_url,
        archived: repo.archived || false
      }));
    } catch (error) {
      throw new Error(`Failed to search repositories: ${error.message}`);
    }
  }

  async getRepository(owner, repo) {
    try {
      const { data } = await this.octokit.repos.get({
        owner,
        repo
      });

      return {
        id: data.id,
        name: data.name,
        full_name: data.full_name,
        description: data.description,
        private: data.private,
        fork: data.fork,
        language: data.language,
        stargazers_count: data.stargazers_count,
        forks_count: data.forks_count,
        updated_at: data.updated_at,
        created_at: data.created_at,
        html_url: data.html_url,
        clone_url: data.clone_url,
        archived: data.archived || false,
        default_branch: data.default_branch,
        size: data.size,
        open_issues_count: data.open_issues_count,
        topics: data.topics || []
      };
    } catch (error) {
      throw new Error(`Failed to get repository: ${error.message}`);
    }
  }

  async deleteRepository(owner, repo) {
    try {
      await this.octokit.repos.delete({
        owner,
        repo
      });
      return true;
    } catch (error) {
      throw new Error(`Failed to delete repository: ${error.message}`);
    }
  }

  async getRepositoryStats(owner, repo) {
    try {
      const [contributors, languages, commits] = await Promise.all([
        this.octokit.repos.listContributors({ owner, repo }).catch(() => ({ data: [] })),
        this.octokit.repos.listLanguages({ owner, repo }).catch(() => ({ data: {} })),
        this.octokit.repos.listCommits({ owner, repo, per_page: 1 }).catch(() => ({ data: [] }))
      ]);

      return {
        contributors_count: contributors.data.length,
        languages: languages.data,
        last_commit: commits.data[0] || null
      };
    } catch (error) {
      throw new Error(`Failed to get repository stats: ${error.message}`);
    }
  }

  async updateRepositoryVisibility(owner, repo, isPrivate) {
    try {
      const { data } = await this.octokit.repos.update({
        owner,
        repo,
        private: isPrivate
      });

      return {
        id: data.id,
        name: data.name,
        full_name: data.full_name,
        private: data.private,
        html_url: data.html_url
      };
    } catch (error) {
      throw new Error(`Failed to update repository visibility: ${error.message}`);
    }
  }

  async archiveRepository(owner, repo) {
    try {
      const { data } = await this.octokit.repos.update({
        owner,
        repo,
        archived: true
      });

      return {
        id: data.id,
        name: data.name,
        full_name: data.full_name,
        archived: data.archived,
        html_url: data.html_url
      };
    } catch (error) {
      throw new Error(`Failed to archive repository: ${error.message}`);
    }
  }

  async unarchiveRepository(owner, repo) {
    try {
      const { data } = await this.octokit.repos.update({
        owner,
        repo,
        archived: false
      });

      return {
        id: data.id,
        name: data.name,
        full_name: data.full_name,
        archived: data.archived,
        html_url: data.html_url
      };
    } catch (error) {
      throw new Error(`Failed to unarchive repository: ${error.message}`);
    }
  }

  async bulkUpdateVisibility(owner, repos, isPrivate) {
    const results = [];
    const errors = [];

    for (const repo of repos) {
      try {
        const result = await this.updateRepositoryVisibility(owner, repo.name, isPrivate);
        results.push({ ...result, success: true });
      } catch (error) {
        errors.push({ name: repo.name, error: error.message });
      }
    }

    return { results, errors };
  }

  async bulkArchiveRepositories(owner, repos) {
    const results = [];
    const errors = [];

    for (const repo of repos) {
      try {
        const result = await this.archiveRepository(owner, repo.name);
        results.push({ ...result, success: true });
      } catch (error) {
        errors.push({ name: repo.name, error: error.message });
      }
    }

    return { results, errors };
  }

  async bulkUnarchiveRepositories(owner, repos) {
    const results = [];
    const errors = [];

    for (const repo of repos) {
      try {
        const result = await this.unarchiveRepository(owner, repo.name);
        results.push({ ...result, success: true });
      } catch (error) {
        errors.push({ name: repo.name, error: error.message });
      }
    }

    return { results, errors };
  }

  async bulkDeleteRepositories(owner, repos) {
    const results = [];
    const errors = [];

    for (const repo of repos) {
      try {
        await this.deleteRepository(owner, repo.name);
        results.push({ name: repo.name, success: true });
      } catch (error) {
        errors.push({ name: repo.name, error: error.message });
      }
    }

    return { results, errors };
  }
}

export default GitHubClient; 