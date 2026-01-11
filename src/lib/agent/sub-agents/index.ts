/**
 * Module des sous-agents pour Tousgether
 * 
 * Export centralisé de tous les sous-agents et leurs types
 */

// Types partagés
export * from './types'

// Sous-agents métier
export { MarketingSubAgent, marketingSubAgent } from './business/marketing'
export { SalesSubAgent, salesSubAgent } from './business/sales'
export { AccountingSubAgent, accountingSubAgent } from './business/accounting'

// Sous-agents techniques
export { VisionSubAgent, visionSubAgent } from './technical/vision'

