import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Force Node.js runtime and dynamic execution so the cron handler never returns cached results
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handleDailyCron(req: NextRequest) {
  const startTime = Date.now();

  // 1. Verify Vercel Cron Secret (if configured in environment variables)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing CRON_SECRET authorization header' },
        { status: 401 }
      );
    }
  }

  const tasksExecuted: string[] = [];

  try {
    // 2. Supabase Health Check & Keep-Alive Ping
    // Pinging Supabase daily prevents free-tier projects from pausing due to inactivity
    if (supabase) {
      const { data, error } = await supabase
        .from('plots')
        .select('id')
        .limit(1);

      if (error) {
        console.warn('[Cron:Daily] Supabase ping warning:', error.message);
        tasksExecuted.push(`Supabase ping warning: ${error.message}`);
      } else {
        tasksExecuted.push(`Supabase keep-alive ping successful (records verified: ${data?.length ?? 0})`);
      }
    } else {
      tasksExecuted.push('Supabase client not configured (running in DEMO mode)');
    }

    // 3. Prune in-memory presence players if any exist
    if (global.__presencePlayers && global.__presencePlayers.size > 0) {
      const cut = Date.now() - 60_000;
      let pruned = 0;
      for (const [id, p] of global.__presencePlayers.entries()) {
        if (p.lastSeen < cut) {
          global.__presencePlayers.delete(id);
          pruned++;
        }
      }
      tasksExecuted.push(`Pruned ${pruned} stale in-memory presence records`);
    }

    // 4. Custom daily jobs can be easily added here
    // e.g., daily analytics summary, expiring temporary reservations, etc.
    tasksExecuted.push('Daily maintenance check completed');

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      ok: true,
      job: 'daily-cron',
      executedAt: new Date().toISOString(),
      durationMs,
      tasks: tasksExecuted,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Cron:Daily] Error during cron execution:', err);
    return NextResponse.json(
      {
        ok: false,
        error: message,
        executedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/daily
 * Vercel Cron automatically invokes cron endpoints via GET requests.
 */
export async function GET(req: NextRequest) {
  return handleDailyCron(req);
}

/**
 * POST /api/cron/daily
 * Allows triggering the daily cron manually via curl, Postman, or external webhooks.
 */
export async function POST(req: NextRequest) {
  return handleDailyCron(req);
}
