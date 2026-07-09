
import { AIPrompt } from '../common/types/prompt.js';

export const BUILT_IN_PROMPTS: AIPrompt[] = [
  {
    id: 'builtin-coding-refactor',
    title: 'Code Refactoring',
    content: 'Refactor the following code to improve readability, maintainability, and efficiency while preserving its functionality:\n\n```{{language}}\n{{code}}\n```',
    type: 'template',
    category: 'Coding',
    tags: ['refactor', 'clean-code'],
    isFavorite: false,
    isBuiltIn: true,
    variables: ['language', 'code'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'builtin-coding-optimize',
    title: 'Performance Optimization',
    content: 'Analyze and optimize the following code for better performance and resource usage:\n\n```{{language}}\n{{code}}\n```',
    type: 'template',
    category: 'Coding',
    tags: ['optimize', 'performance'],
    isFavorite: false,
    isBuiltIn: true,
    variables: ['language', 'code'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'builtin-debug-analyze',
    title: 'Error Analysis',
    content: 'Analyze the following error message and code snippet to identify the root cause and suggest a fix:\n\nError: {{error}}\n\nCode:\n```{{language}}\n{{code}}\n```',
    type: 'template',
    category: 'Debugging',
    tags: ['debug', 'error-fix'],
    isFavorite: false,
    isBuiltIn: true,
    variables: ['error', 'language', 'code'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'builtin-review-security',
    title: 'Security Audit',
    content: 'Review the following code for potential security vulnerabilities, such as SQL injection, XSS, or insecure data handling:\n\n```{{language}}\n{{code}}\n```',
    type: 'template',
    category: 'Code Review',
    tags: ['security', 'audit'],
    isFavorite: false,
    isBuiltIn: true,
    variables: ['language', 'code'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'builtin-writing-summarize',
    title: 'Text Summarization',
    content: 'Provide a concise summary of the following text, highlighting the key points and main takeaways:\n\n{{text}}',
    type: 'template',
    category: 'Writing',
    tags: ['summarize', 'concise'],
    isFavorite: false,
    isBuiltIn: true,
    variables: ['text'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'builtin-research-synthesis',
    title: 'Information Synthesis',
    content: 'Synthesize the information from the following sources into a coherent report, identifying common themes and conflicting data:\n\n{{sources}}',
    type: 'template',
    category: 'Research',
    tags: ['synthesis', 'report'],
    isFavorite: false,
    isBuiltIn: true,
    variables: ['sources'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'builtin-planning-decompose',
    title: 'Task Decomposition',
    content: 'Break down the following goal into a set of manageable subtasks, including estimated difficulty and dependencies:\n\nGoal: {{goal}}',
    type: 'template',
    category: 'Planning',
    tags: ['decompose', 'tasks'],
    isFavorite: false,
    isBuiltIn: true,
    variables: ['goal'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];
