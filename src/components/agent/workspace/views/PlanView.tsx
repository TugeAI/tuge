'use client'

import { CheckCircle2, Circle, Loader2 } from 'lucide-react'
import type { PlanStep } from '../types'

interface PlanViewProps {
  steps?: PlanStep[]
}

const DEFAULT_STEPS: PlanStep[] = [
  { id: '1', label: 'Analyser la demande utilisateur', status: 'completed' },
  { id: '2', label: 'Rechercher les informations pertinentes', status: 'completed' },
  { id: '3', label: 'Générer la réponse', status: 'in_progress' },
  { id: '4', label: 'Valider et formater', status: 'pending' },
]

/**
 * Vue Plan - Étapes d'exécution de l'agent
 */
export function PlanView({ steps = DEFAULT_STEPS }: PlanViewProps) {
  return (
    <div className="p-4 space-y-2">
      <div className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">
        Étapes en cours
      </div>
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={`
            flex items-start gap-3 px-3 py-2.5 rounded-lg
            ${step.status === 'in_progress' ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-white/[0.02]'}
          `}
        >
          <div className="mt-0.5">
            {step.status === 'completed' && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            {step.status === 'in_progress' && (
              <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
            )}
            {step.status === 'pending' && (
              <Circle className="w-4 h-4 text-white/30" />
            )}
          </div>
          <div className="flex-1">
            <div className={`text-sm ${
              step.status === 'in_progress' 
                ? 'text-white/90' 
                : step.status === 'completed' 
                  ? 'text-white/60' 
                  : 'text-white/40'
            }`}>
              {step.label}
            </div>
          </div>
          <span className="text-xs text-white/30 font-mono">{index + 1}</span>
        </div>
      ))}
    </div>
  )
}

export default PlanView


