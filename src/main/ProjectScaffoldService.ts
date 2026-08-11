export class ProjectScaffoldService {
  async getAvailableTemplates() {
    return [
      { id: 'react-static', name: 'React Static Site', description: 'A simple React site with Tailwind' },
      { id: 'electron-app', name: 'Electron Desktop App', description: 'Cross-platform desktop application' },
      { id: 'node-api', name: 'Node.js API', description: 'Backend service with Express' }
    ];
  }

  async createProject(request: any, onProgress: (progress: any) => void) {
    onProgress({ status: 'initializing', percentage: 10 });
    // Mock project creation
    setTimeout(() => onProgress({ status: 'scaffolding', percentage: 40 }), 500);
    setTimeout(() => onProgress({ status: 'installing-deps', percentage: 70 }), 1000);
    setTimeout(() => onProgress({ status: 'complete', percentage: 100 }), 1500);
    
    return { success: true, path: request.path };
  }
}

export default ProjectScaffoldService;
