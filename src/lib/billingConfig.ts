/**
 * Configuration centralisée du système de facturation et crédits
 * 
 * IMPORTANT: Ces valeurs doivent être synchronisées avec les constantes SQL
 * dans la migration 004_credit_system.sql
 */

export const BILLING = {
  // ============================================================================
  // COÛTS VARIABLES
  // ============================================================================
  
  /** Coût estimé par action IA (en EUR) */
  COST_AI_PER_ACTION_EUR: 0.004,
  
  /** Coûts variables par transaction : Stripe fees, logs, compute (en EUR) */
  VARIABLE_COST_PER_TX_EUR: 0.30,

  // ============================================================================
  // COÛTS FIXES MENSUELS (pour calcul platform_cost_per_user)
  // ============================================================================
  
  /** Coût mensuel Supabase (en EUR) */
  SUPABASE_MONTHLY_COST_EUR: 100,
  
  /** Coût mensuel Resend - dynamique selon volume (en EUR) */
  RESEND_MONTHLY_COST_EUR: 20,

  // ============================================================================
  // MLM
  // ============================================================================
  
  /** Part du bénéfice redistribuée en MLM (50%) */
  MLM_SHARE_OF_PROFIT: 0.50,
  
  /** Nombre de niveaux MLM */
  MLM_LEVELS: 5,

  // ============================================================================
  // CRÉDITS
  // ============================================================================
  
  /** Crédits gratuits quotidiens */
  DAILY_FREE_CREDITS: 10,
  
  /** Achat minimum en EUR */
  MIN_PURCHASE_EUR: 10,

  // ============================================================================
  // PACKS DE CRÉDITS
  // ============================================================================
  
  PACKS: [
    { 
      id: 'starter_50', 
      name: 'Starter',
      credits: 50, 
      price: 10,
      description: 'Idéal pour découvrir',
      popular: false,
    },
    { 
      id: 'pro_500', 
      name: 'Pro',
      credits: 500, 
      price: 39,
      description: 'Le plus populaire',
      popular: true,
    },
    { 
      id: 'business_2000', 
      name: 'Business',
      credits: 2000, 
      price: 129,
      description: 'Pour les pros',
      popular: false,
    },
  ],

  // ============================================================================
  // RATE LIMITING
  // ============================================================================
  
  /** Actions max par minute */
  RATE_LIMIT_PER_MINUTE: 10,
  
  /** Actions max par heure */
  RATE_LIMIT_PER_HOUR: 100,

  // ============================================================================
  // ANTI-ABUS
  // ============================================================================
  
  /** Seuil d'alerte : coût utilisateur > X fois la moyenne */
  ABUSE_THRESHOLD_MULTIPLIER: 3,

} as const;

// ============================================================================
// TYPES DÉRIVÉS
// ============================================================================

export type CreditPack = typeof BILLING.PACKS[number];
export type CreditPackId = CreditPack['id'];

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Trouve un pack par son ID
 */
export function getPackById(packId: string): CreditPack | undefined {
  return BILLING.PACKS.find(pack => pack.id === packId);
}

/**
 * Calcule le bénéfice net d'une transaction
 */
export function calculateBenefit(
  amountEur: number,
  creditsGranted: number,
  platformCostPerUser: number
): number {
  const aiCost = creditsGranted * BILLING.COST_AI_PER_ACTION_EUR;
  const variableCost = BILLING.VARIABLE_COST_PER_TX_EUR;
  
  const benefit = amountEur - aiCost - variableCost - platformCostPerUser;
  
  // Arrondi à 2 décimales
  return Math.round(benefit * 100) / 100;
}

/**
 * Calcule le pool MLM (50% du bénéfice)
 */
export function calculateMlmPool(benefit: number): number {
  if (benefit <= 0) return 0;
  return Math.round(benefit * BILLING.MLM_SHARE_OF_PROFIT * 100) / 100;
}

/**
 * Calcule la commission par niveau MLM
 */
export function calculateCommissionPerLevel(mlmPool: number): number {
  if (mlmPool <= 0) return 0;
  return Math.round((mlmPool / BILLING.MLM_LEVELS) * 100) / 100;
}







