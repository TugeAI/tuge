/**
 * Client Stripe côté serveur
 * 
 * IMPORTANT: Ne jamais exposer la clé secrète côté client !
 * Utiliser uniquement dans les API routes et Server Components.
 */

import Stripe from 'stripe';

// Vérification des variables d'environnement
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('[Stripe] STRIPE_SECRET_KEY non configurée');
}

/**
 * Instance Stripe singleton
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

/**
 * Vérifie si Stripe est correctement configuré
 */
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/**
 * Construit la signature du webhook Stripe
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET non configuré');
  }
  
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Types utilitaires pour Stripe
 */
export type StripeCheckoutSession = Stripe.Checkout.Session;
export type StripePaymentIntent = Stripe.PaymentIntent;
export type StripeEvent = Stripe.Event;

