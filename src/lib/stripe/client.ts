/**
 * Client Stripe côté serveur
 *
 * IMPORTANT: Ne jamais exposer la clé secrète côté client !
 * Utiliser uniquement dans les API routes et Server Components.
 */

import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

/**
 * Vérifie si Stripe est correctement configuré
 */
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/**
 * Récupère l'instance Stripe (singleton)
 * Lance une erreur si Stripe n'est pas configuré
 */
export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY non configurée');
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });
  }

  return stripeInstance;
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

  const stripe = getStripe();
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Types utilitaires pour Stripe
 */
export type StripeCheckoutSession = Stripe.Checkout.Session;
export type StripePaymentIntent = Stripe.PaymentIntent;
export type StripeEvent = Stripe.Event;

