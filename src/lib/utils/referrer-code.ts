/**
 * Utilitaires pour la génération de codes de parrainage
 * 
 * Format du code : TUG-XXXXXX (préfixe + 6 caractères alphanumériques)
 * Exemple : TUG-A1B2C3
 */

/**
 * Caractères autorisés pour les codes parrain
 * Exclut les caractères ambigus : 0, O, I, L, 1
 */
const ALLOWED_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/**
 * Préfixe des codes parrain Tuge
 */
const CODE_PREFIX = 'TUG'

/**
 * Longueur de la partie aléatoire du code
 */
const RANDOM_PART_LENGTH = 6

/**
 * Génère un code de parrainage unique
 * 
 * @returns Code au format TUG-XXXXXX
 * 
 * @example
 * generateReferrerCode() // "TUG-A3B7K2"
 */
export function generateReferrerCode(): string {
  const randomPart = generateRandomString(RANDOM_PART_LENGTH)
  return `${CODE_PREFIX}-${randomPart}`
}

/**
 * Génère une chaîne aléatoire de la longueur spécifiée
 * Utilise crypto.getRandomValues pour une meilleure entropie
 * 
 * @param length - Longueur de la chaîne à générer
 * @returns Chaîne aléatoire
 */
function generateRandomString(length: number): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  
  let result = ''
  for (let i = 0; i < length; i++) {
    result += ALLOWED_CHARS[array[i] % ALLOWED_CHARS.length]
  }
  
  return result
}

/**
 * Valide le format d'un code parrain
 * 
 * @param code - Code à valider
 * @returns true si le format est valide
 * 
 * @example
 * isValidReferrerCodeFormat("TUG-A3B7K2") // true
 * isValidReferrerCodeFormat("INVALID")    // false
 */
export function isValidReferrerCodeFormat(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false
  }
  
  const normalized = code.toUpperCase().trim()
  const pattern = new RegExp(`^${CODE_PREFIX}-[${ALLOWED_CHARS}]{${RANDOM_PART_LENGTH}}$`)
  
  return pattern.test(normalized)
}

/**
 * Normalise un code parrain (majuscules, trim)
 * 
 * @param code - Code à normaliser
 * @returns Code normalisé ou null si invalide
 */
export function normalizeReferrerCode(code: string | null | undefined): string | null {
  if (!code || typeof code !== 'string') {
    return null
  }
  
  const normalized = code.toUpperCase().trim()
  
  // Vérifie le format après normalisation
  if (!isValidReferrerCodeFormat(normalized)) {
    return null
  }
  
  return normalized
}

/**
 * Extrait un code parrain d'une URL
 * Cherche le paramètre 'ref' ou 'referrer'
 * 
 * @param url - URL contenant potentiellement un code parrain
 * @returns Code parrain extrait ou null
 * 
 * @example
 * extractReferrerCodeFromUrl("https://tuge.app?ref=TUG-A3B7K2") // "TUG-A3B7K2"
 */
export function extractReferrerCodeFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    
    // Cherche dans les paramètres de requête
    const refParam = urlObj.searchParams.get('ref') 
      || urlObj.searchParams.get('referrer')
      || urlObj.searchParams.get('r')
    
    if (refParam) {
      return normalizeReferrerCode(refParam)
    }
    
    return null
  } catch {
    // URL invalide
    return null
  }
}

