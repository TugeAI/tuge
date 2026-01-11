/**
 * Route /auth - Redirige vers /auth/login
 * 
 * Cette route est conservée pour la compatibilité avec les anciens liens
 * mais redirige automatiquement vers la page de connexion par défaut.
 * 
 * L'ancien système OTP (ConversationalAuth) est désactivé mais le code
 * est conservé dans les composants pour une éventuelle réactivation future.
 */

import { redirect } from 'next/navigation';

export default function AuthPage() {
  // Redirection permanente vers la page de connexion
  redirect('/auth/login');
}
