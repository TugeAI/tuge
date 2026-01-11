/**
 * Configuration de la version de l'application
 * 
 * La version est définie manuellement ici pour éviter les problèmes d'import JSON.
 * À mettre à jour lors des releases.
 */

// Version de l'application (synchronisée avec package.json)
export const APP_VERSION = '0.1.0'

/**
 * Retourne la version formatée pour l'affichage (ex: "0.1")
 * Retire le patch version pour un affichage plus propre
 */
export function getDisplayVersion(): string {
  const parts = APP_VERSION.split('.')
  // Retourne major.minor (ex: "0.1" au lieu de "0.1.0")
  return `${parts[0]}.${parts[1]}`
}

export default APP_VERSION
