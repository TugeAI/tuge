/**
 * GET /api/credits/wallet
 * 
 * Récupère le solde de crédits, l'historique, les stats 7j et le parrainage.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// Calcule les stats sur 7 jours à partir de l'historique
function calculateStats7Days(ledgerEntries: Array<{ type: string; amount: number; created_at: string }>) {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  // Initialise les 7 derniers jours
  const dailyData: Record<string, { consumed: number; gained: number }> = {}
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const key = date.toISOString().split('T')[0]
    dailyData[key] = { consumed: 0, gained: 0 }
  }

  let totalConsumed = 0
  let totalGained = 0

  // Parcourt les entrées des 7 derniers jours
  for (const entry of ledgerEntries) {
    const entryDate = new Date(entry.created_at)
    if (entryDate < sevenDaysAgo) continue

    const dateKey = entryDate.toISOString().split('T')[0]
    if (!dailyData[dateKey]) continue

    if (entry.amount < 0) {
      dailyData[dateKey].consumed += Math.abs(entry.amount)
      totalConsumed += Math.abs(entry.amount)
    } else {
      dailyData[dateKey].gained += entry.amount
      totalGained += entry.amount
    }
  }

  // Convertit en tableau pour le sparkline
  const sparklineData = Object.entries(dailyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      consumed: data.consumed,
      gained: data.gained,
      net: data.gained - data.consumed,
    }))

  // Calcule la tendance (compare les 3 derniers jours aux 3 précédents)
  const recent3Days = sparklineData.slice(-3).reduce((sum, d) => sum + d.consumed, 0)
  const previous3Days = sparklineData.slice(0, 3).reduce((sum, d) => sum + d.consumed, 0)
  const trend = previous3Days > 0 
    ? Math.round(((recent3Days - previous3Days) / previous3Days) * 100) 
    : 0

  return {
    sparkline: sparklineData,
    totalConsumed,
    totalGained,
    dailyAverage: Math.round(totalConsumed / 7 * 10) / 10,
    trend, // Positif = plus de consommation, négatif = moins
  }
}

export async function GET(request: NextRequest) {
  try {
    // Vérifie l'authentification
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const adminClient = createAdminClient()

    // Récupère le wallet via RPC (avec reset auto des crédits gratuits expirés)
    const { data: walletData, error: walletError } = await adminClient.rpc('get_user_wallet', {
      p_user_id: user.id
    })

    if (walletError) {
      console.error('[Wallet] Erreur RPC get_user_wallet:', walletError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération du wallet' },
        { status: 500 }
      )
    }

    const wallet = walletData?.[0] || {
      paid_credits: 0,
      daily_free_credits: 0,
      total_credits: 0,
      can_claim_today: true,
    }

    // Récupère l'historique récent (optionnel, via query param)
    const url = new URL(request.url)
    const includeHistory = url.searchParams.get('history') === 'true'
    const historyLimit = parseInt(url.searchParams.get('limit') || '20', 10)

    let history = null
    if (includeHistory) {
      const { data: ledgerData } = await adminClient
        .from('credit_ledger')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(historyLimit)

      history = ledgerData || []
    }

    // Récupère les données des 7 derniers jours pour les stats
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: stats7jData } = await adminClient
      .from('credit_ledger')
      .select('type, amount, created_at')
      .eq('user_id', user.id)
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: true })

    const stats = calculateStats7Days(stats7jData || [])

    // Récupère le solde MLM
    const { data: mlmBalance } = await adminClient
      .from('mlm_balances')
      .select('balance_eur, total_earned_eur')
      .eq('user_id', user.id)
      .single()

    // Récupère les données de parrainage
    const { data: profileData } = await adminClient
      .from('profiles')
      .select('referrer_code')
      .eq('id', user.id)
      .single()

    // Compte les filleuls directs
    const { count: referralsCount } = await adminClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('referred_by', user.id)

    return NextResponse.json({
      wallet: {
        paid_credits: wallet.paid_credits,
        daily_free_credits: wallet.daily_free_credits,
        total_credits: wallet.total_credits,
        can_claim_today: wallet.can_claim_today,
      },
      mlm: mlmBalance || {
        balance_eur: 0,
        total_earned_eur: 0,
      },
      stats,
      referral: {
        code: profileData?.referrer_code || null,
        referrals_count: referralsCount || 0,
      },
      history,
    })

  } catch (error) {
    console.error('[Wallet] Erreur inattendue:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

