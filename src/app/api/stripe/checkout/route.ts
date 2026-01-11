/**
 * POST /api/stripe/checkout
 * 
 * Crée une session Stripe Checkout pour l'achat de crédits.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { stripe, isStripeConfigured } from '@/lib/stripe/client'
import { BILLING, getPackById } from '@/lib/billingConfig'

// Schéma de validation
const checkoutSchema = z.object({
  pack_id: z.string().optional(),
  // Pour pay-as-you-go
  custom_amount: z.number().min(BILLING.MIN_PURCHASE_EUR).optional(),
  custom_credits: z.number().min(1).optional(),
}).refine(
  (data) => data.pack_id || (data.custom_amount && data.custom_credits),
  { message: 'pack_id ou custom_amount/custom_credits requis' }
)

export async function POST(request: NextRequest) {
  try {
    // Vérifie que Stripe est configuré
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe non configuré' },
        { status: 503 }
      )
    }

    // Vérifie l'authentification
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Parse et valide le body
    const body = await request.json()
    const validation = checkoutSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { pack_id, custom_amount, custom_credits } = validation.data

    // Détermine le montant et les crédits
    let amountEur: number
    let credits: number
    let packName: string

    if (pack_id) {
      const pack = getPackById(pack_id)
      if (!pack) {
        return NextResponse.json(
          { error: 'Pack invalide' },
          { status: 400 }
        )
      }
      amountEur = pack.price
      credits = pack.credits
      packName = pack.name
    } else {
      amountEur = custom_amount!
      credits = custom_credits!
      packName = `${credits} crédits`
    }

    // Vérifie le montant minimum
    if (amountEur < BILLING.MIN_PURCHASE_EUR) {
      return NextResponse.json(
        { error: `Montant minimum: ${BILLING.MIN_PURCHASE_EUR}€` },
        { status: 400 }
      )
    }

    // Récupère l'email de l'utilisateur
    const userEmail = user.email || undefined

    // Crée la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Tuge - ${packName}`,
              description: `${credits} crédits IA`,
            },
            unit_amount: Math.round(amountEur * 100), // Stripe utilise les centimes
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        pack_id: pack_id || 'custom',
        credits: credits.toString(),
        amount_eur: amountEur.toString(),
      },
      success_url: `${getBaseUrl(request)}/wallet?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getBaseUrl(request)}/wallet?canceled=true`,
    })

    return NextResponse.json({
      checkout_url: session.url,
      session_id: session.id,
    })

  } catch (error) {
    console.error('[StripeCheckout] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session de paiement' },
      { status: 500 }
    )
  }
}

/**
 * Récupère l'URL de base pour les redirections
 */
function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host') || 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  return `${protocol}://${host}`
}

