import React, { useEffect, useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useSkillStore } from '../store/skillStore';
import { Skill } from '../../common/types/skill';
import { Search, ToggleLeft as Toggle, BookOpen, Code } from 'lucide-react';

export default function SkillManagerPanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const { skills, isLoading, error, fetchSkills, searchSkills, toggleSkill } = useSkillStore();
  
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Browser', 'Files', 'System', 'AI', 'Plugin', 'Workflow'];

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleSearch = async () => {
    await searchSkills({
      query: searchQuery,
      category: selectedCategory === 'All' ? undefined : selectedCategory
    });
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    await toggleSkill(id, !enabled);
  };

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'bg-synapse-darker' : 'bg-white'}`}>
      {/* Header */}
      <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
        <h2 className="text-lg font-bold mb-4">Skill Manager</h2>

        {/* Search Bar */}
        <div className="flex gap-2 mb-4">
          <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <Search size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search skills..."
              className={`flex-1 bg-transparent outline-none ${isDarkMode ? 'text-white' : 'text-black'}`}
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 rounded bg-synapse-accent text-white hover:opacity-90 transition-opacity"
          >
            Search
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`px-3 py-1 rounded text-sm ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className={`p-2 rounded text-sm mt-2 ${isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`}>
            {error}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Skill List */}
        <div className={`w-1/3 border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} overflow-y-auto`}>
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading skills...</div>
          ) : skills.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No skills found</div>
          ) : (
            <div className="space-y-2 p-4">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  onClick={() => setSelectedSkill(skill)}
                  className={`p-3 rounded cursor-pointer transition-colors ${
                    selectedSkill?.id === skill.id
                      ? 'bg-synapse-accent text-white'
                      : isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{skill.name}</div>
                      <div className="text-xs opacity-75">{skill.category}</div>
                    </div>
                    <div className={`w-4 h-4 rounded ${skill.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skill Details */}
        <div className="flex-1 overflow-y-auto p-4">
          {selectedSkill ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold mb-2">{selectedSkill.name}</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {selectedSkill.description}
                </p>
              </div>

              {/* Metadata */}
              <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-semibold">Version:</span> {selectedSkill.version}
                  </div>
                  <div>
                    <span className="font-semibold">Author:</span> {selectedSkill.author}
                  </div>
                  <div>
                    <span className="font-semibold">Category:</span> {selectedSkill.category}
                  </div>
                  <div>
                    <span className="font-semibold">Source:</span> {selectedSkill.source}
                  </div>
                </div>
              </div>

              {/* Capabilities */}
              {selectedSkill.capabilities.length > 0 && (
                <div>
                  <span className="font-semibold block mb-2">Capabilities:</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedSkill.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className={`px-2 py-1 rounded text-xs ${
                          isDarkMode
                            ? 'bg-blue-900 text-blue-200'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Permissions */}
              {selectedSkill.permissions.length > 0 && (
                <div>
                  <span className="font-semibold block mb-2">Permissions:</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedSkill.permissions.map((perm) => (
                      <span
                        key={perm}
                        className={`px-2 py-1 rounded text-xs ${
                          isDarkMode
                            ? 'bg-yellow-900 text-yellow-200'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Documentation */}
              {selectedSkill.documentation && (
                <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen size={16} />
                    <span className="font-semibold">Documentation</span>
                  </div>
                  <p className="text-sm">{selectedSkill.documentation}</p>
                </div>
              )}

              {/* Examples */}
              {selectedSkill.examples && selectedSkill.examples.length > 0 && (
                <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Code size={16} />
                    <span className="font-semibold">Examples</span>
                  </div>
                  <div className="space-y-2">
                    {selectedSkill.examples.map((example, idx) => (
                      <pre
                        key={idx}
                        className={`p-2 rounded text-xs overflow-x-auto ${
                          isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                        }`}
                      >
                        {example}
                      </pre>
                    ))}
                  </div>
                </div>
              )}

              {/* Toggle Button */}
              <button
                onClick={() => handleToggle(selectedSkill.id, selectedSkill.enabled)}
                className={`w-full px-4 py-2 rounded font-semibold transition-colors flex items-center justify-center gap-2 ${
                  selectedSkill.enabled
                    ? isDarkMode
                      ? 'bg-red-900 hover:bg-red-800 text-red-200'
                      : 'bg-red-100 hover:bg-red-200 text-red-800'
                    : isDarkMode
                    ? 'bg-green-900 hover:bg-green-800 text-green-200'
                    : 'bg-green-100 hover:bg-green-200 text-green-800'
                }`}
              >
                <Toggle size={16} />
                {selectedSkill.enabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a skill to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
