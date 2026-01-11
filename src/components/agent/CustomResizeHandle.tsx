'use client'

import { Separator } from 'react-resizable-panels'

interface CustomResizeHandleProps {
  id?: string
}

/**
 * Simple resize handle pour les panels
 * Utilise Separator de react-resizable-panels v4
 */
export function CustomResizeHandle({ id }: CustomResizeHandleProps) {
  return (
    <Separator 
      id={id}
      className="w-3 hover:bg-violet-500/20 transition-colors cursor-col-resize flex items-center justify-center"
    >
      <div className="w-0.5 h-full bg-white/10 hover:bg-violet-500/60 transition-colors" />
    </Separator>
  )
}

