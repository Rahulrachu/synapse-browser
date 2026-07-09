import { Users, Cpu, Clock, Search, Code2, Bot, FileText, ChevronUp, ChevronDown } from "lucide-react";

const agents = [
  { name: "Planner Agent", status: "Idle", statusColor: "#22c55e", progress: 100, progressColor: "#22c55e", icon: <Users size={18} className="text-[#22c55e]" />, lastActivity: "2m ago", cpu: "4%" },
  { name: "Research Agent", status: "Working on task #42", statusColor: "#eab308", progress: 60, progressColor: "#eab308", icon: <Search size={18} className="text-[#eab308]" />, lastActivity: "2m ago", cpu: "4%" },
  { name: "Coding Agent", status: "Ready", statusColor: "#22c55e", progress: 100, progressColor: "#22c55e", icon: <Code2 size={18} className="text-[#22c55e]" />, lastActivity: "2m ago", cpu: "4%" },
  { name: "Reviewer Agent", status: "Paused", statusColor: "#3b82f6", progress: 45, progressColor: "#3b82f6", icon: <FileText size={18} className="text-[#3b82f6]" />, lastActivity: "2m ago", cpu: "4%" },
  { name: "Writer Agent", status: "Idle", statusColor: "#22c55e", progress: 100, progressColor: "#22c55e", icon: <FileText size={18} className="text-[#22c55e]" />, lastActivity: "2m ago", cpu: "4%" },
];

const tasks = [
  { id: 42, title: "Analyze recent market trends", progress: 60, assigned: "Research Agent", priority: null },
  { id: 43, title: "Generate summary report", priority: "High", time: "4h 39m", assigned: null },
  { id: 44, title: "Debug data ingestion pipeline", priority: "Medium", time: "13h 21m", assigned: null },
  { id: 45, title: "Draft email response", priority: "High", time: "11h 17m", assigned: null },
];

export default function AgentMonitorPanel() {
  return (
    <div className="h-full flex flex-col bg-[#111827]">
      {/* Header */}
      <div className="h-10 px-4 bg-[#0f172a] border-b border-[#1e293b] flex items-center">
        <span className="text-sm font-semibold text-white">Agent Monitor Panel</span>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-6 px-4 py-2.5 bg-[#0f172a] border-b border-[#1e293b]">
        <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
          <Users size={14} className="text-[#7c3aed]" />
          <span>7 Agents Active</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
          <Cpu size={14} className="text-[#7c3aed]" />
          <span>Memory Usage: 245MB</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
          <Clock size={14} className="text-[#7c3aed]" />
          <span>Uptime: 4h 23m</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Agent Dashboard</h3>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Planner Agent */}
          <AgentCard agent={agents[0]} />
          {/* Research Agent */}
          <AgentCard agent={agents[1]} />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {agents.slice(2).map((agent, i) => (
            <AgentCard key={i} agent={agent} compact />
          ))}
        </div>

        {/* Task Queue */}
        <h3 className="text-sm font-semibold text-white mb-3">Task Queue</h3>

        {/* Active Task */}
        <div className="bg-[#0f172a] rounded-lg border border-[#1e293b] mb-2">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e293b]">
            <span className="text-xs font-medium text-[#9ca3af]">Active Task (1)</span>
            <ChevronUp size={14} className="text-[#6b7280]" />
          </div>
          <div className="px-3 py-2.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-[#eab308]" />
              <span className="text-xs text-white">Task #{tasks[0].id}: {tasks[0].title}</span>
            </div>
            <div className="w-full h-2 bg-[#1e293b] rounded-full overflow-hidden mb-1">
              <div className="h-full bg-[#eab308] rounded-full" style={{ width: `${tasks[0].progress}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#4b5563]">Assigned: <span className="text-[#eab308]">Research Agent</span></span>
              <span className="text-[10px] text-[#6b7280]">{tasks[0].progress}%</span>
            </div>
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-[#0f172a] rounded-lg border border-[#1e293b]">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e293b]">
            <span className="text-xs font-medium text-[#9ca3af]">Pending Tasks (3)</span>
            <ChevronDown size={14} className="text-[#6b7280]" />
          </div>
          <div className="divide-y divide-[#1e293b]">
            {tasks.slice(1).map((task) => (
              <div key={task.id} className="px-3 py-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-[#7c3aed]" />
                  <span className="text-xs text-white">Task #{task.id}: {task.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-medium ${
                    task.priority === "High" ? "text-[#ef4444]" :
                    task.priority === "Medium" ? "text-[#eab308]" :
                    "text-[#6b7280]"
                  }`}>
                    Priority: {task.priority}
                  </span>
                  <span className="text-[10px] text-[#4b5563]">{task.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentCard({ agent, compact = false }: { agent: typeof agents[0]; compact?: boolean }) {
  return (
    <div className="bg-[#0f172a] rounded-lg border border-[#1e293b] p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: agent.statusColor }} />
          <span className="text-xs font-medium text-white">{agent.name}</span>
        </div>
        {agent.icon}
      </div>
      <div className="text-sm text-[#9ca3af] mb-2">{agent.status}</div>
      <div className="w-full h-1.5 bg-[#1e293b] rounded-full overflow-hidden mb-2">
        <div className="h-full rounded-full" style={{ width: `${agent.progress}%`, backgroundColor: agent.progressColor }} />
      </div>
      <div className="flex items-center justify-between text-[10px] text-[#4b5563]">
        <span>Last activity: {agent.lastActivity}</span>
        <span>CPU load: {agent.cpu}</span>
        <span className="text-[#9ca3af]">{agent.progress}%</span>
      </div>
    </div>
  );
}
