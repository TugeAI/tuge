'use client'

import { Trash2 } from 'lucide-react'
import type { LogEntry } from '../types'

interface LogsViewProps {
  logs?: LogEntry[]
  onClear?: () => void
}

const DEFAULT_LOGS: LogEntry[] = [
  { id: '1', timestamp: '14:32:15', type: 'tool_call', content: 'search_listings({ query: "iPhone" })' },
  { id: '2', timestamp: '14:32:16', type: 'response', content: '3 résultats trouvés' },
  { id: '3', timestamp: '14:32:18', type: 'tool_call', content: 'create_listing_draft({ title: "iPhone 12" })' },
  { id: '4', timestamp: '14:32:19', type: 'response', content: 'Brouillon créé avec succès' },
]

/**
 * Vue Logs - Historique des appels de l'agent
 */
export function LogsView({ logs = DEFAULT_LOGS, onClear }: LogsViewProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="text-xs font-medium text-white/50 uppercase tracking-wider">
          Historique des appels
        </div>
        {logs.length > 0 && onClear && (
          <button
            onClick={onClear}
            className="p-1.5 rounded text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
            title="Effacer les logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Logs */}
      <div className="flex-1 overflow-y-auto p-4 chat-scrollbar">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-white/40 text-sm">
            Aucun log pour le moment
          </div>
        ) : (
          <div className="font-mono text-xs space-y-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`
                  px-2 py-1.5 rounded
                  ${log.type === 'tool_call' ? 'bg-violet-500/10 text-violet-300' : ''}
                  ${log.type === 'response' ? 'bg-white/[0.02] text-white/60' : ''}
                  ${log.type === 'error' ? 'bg-red-500/10 text-red-300' : ''}
                  ${log.type === 'info' ? 'bg-cyan-500/10 text-cyan-300' : ''}
                `}
              >
                <span className="text-white/30">[{log.timestamp}]</span>{' '}
                <span>{log.content}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default LogsView

