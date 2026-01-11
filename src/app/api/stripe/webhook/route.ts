/**
 * POST /api/stripe/webhook
 * 
 * Webhook Stripe pour traiter les événements de paiement.
 * - Confirme les achats
 * - Attribue les crédits
 * - Distribue les commissions MLM
 * 
 * IMPORTANT: Ce endpoint doit être exclu du CSRF et du parsing automatique du body.
 */

import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

// Désactive le parsing automatique du body pour Stripe
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Récupère le body brut et la signature
    const payload = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('[StripeWebhook] Signature manquante')
      return NextResponse.json(
        { error: 'Signature manquante' },
        { status: 400 }
      )
    }

    // Vérifie la signature du webhook
    let event: Stripe.Event
    try {
      event = constructWebhookEvent(payload, signature)
    } catch (err) {
      console.error('[StripeWebhook] Signature invalide:', err)
      return NextResponse.json(
        { error: 'Signature invalide' },
        { status: 400 }
      )
    }

    console.log('[StripeWebhook] Événement reçu:', event.type, event.id)

    // Traite les événements
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break

      default:
        console.log('[StripeWebhook] Événement ignoré:', event.type)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('[StripeWebhook] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur webhook' },
      { status: 500 }
    )
  }
}

/**
 * Traite une session checkout complétée
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('[StripeWebhook] Checkout complété:', session.id)

  // Récupère les métadonnées
  const userId = session.metadata?.user_id
  const packId = session.metadata?.pack_id
  const credits = parseInt(session.metadata?.credits || '0', 10)
  const amountEur = parseFloat(session.metadata?.amount_eur || '0')
  const paymentIntentId = session.payment_intent as string

  if (!userId || !credits || !amountEur || !paymentIntentId) {
    console.error('[StripeWebhook] Métadonnées manquantes:', session.metadata)
    return
  }

  const adminClient = createAdminClient()

  // Crée l'achat en pending (idempotent)
  const { data: purchaseData, error: purchaseError } = await adminClient.rpc('create_purchase', {
    p_user_id: userId,
    p_stripe_pi_id: paymentIntentId,
    p_stripe_session_id: session.id,
    p_amount_eur: amountEur,
    p_credits: credits,
    p_pack_id: packId || null,
  })

  if (purchaseError) {
    console.error('[StripeWebhook] Erreur création achat:', purchaseError)
    return
  }

  console.log('[StripeWebhook] Achat créé:', purchaseData?.[0])

  // Confirme l'achat et distribue le MLM
  const { data: confirmData, error: confirmError } = await adminClient.rpc(
    'confirm_purchase_and_distribute_mlm',
    { p_stripe_pi_id: paymentIntentId }
  )

  if (confirmError) {
    console.error('[StripeWebhook] Erreur confirmation achat:', confirmError)
    return
  }

  const result = confirmData?.[0]
  console.log('[StripeWebhook] Achat confirmé:', {
    purchase_id: result?.purchase_id,
    benefit: result?.benefit,
    mlm_distributed: result?.mlm_distributed,
    levels_paid: result?.levels_paid,
  })
}

/**
 * Traite un paiement réussi (fallback si checkout.session.completed manqué)
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('[StripeWebhook] Paiement réussi:', paymentIntent.id)

  const adminClient = createAdminClient()

  // Vérifie si l'achat existe déjà et le confirme si nécessaire
  const { data, error } = await adminClient.rpc(
    'confirm_purchase_and_distribute_mlm',
    { p_stripe_pi_id: paymentIntent.id }
  )

  if (error) {
    // Pas d'erreur si l'achat n'existe pas (sera créé par checkout.session.completed)
    if (!error.message.includes('non trouvé')) {
      console.error('[StripeWebhook] Erreur confirmation:', error)
    }
    return
  }

  console.log('[StripeWebhook] Confirmation via payment_intent.succeeded:', data?.[0])
}

/**
 * Traite un paiement échoué
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('[StripeWebhook] Paiement échoué:', paymentIntent.id)

  const adminClient = createAdminClient()

  // Met à jour le statut de l'achat si existe
  const { error } = await adminClient
    .from('purchases')
    .update({ status: 'failed' })
    .eq('stripe_payment_intent_id', paymentIntent.id)

  if (error) {
    console.error('[StripeWebhook] Erreur mise à jour statut failed:', error)
  }
}







