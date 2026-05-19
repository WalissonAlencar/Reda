import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const { data: { user }, error: userError } = await adminSupabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', details: userError?.message }), { status: 401, headers: corsHeaders });
    }

    const requestBody = await req.json();
    const { packageId, redirectUrl } = requestBody;
    let { credits, amount } = requestBody;
    if (packageId) {
      const { data: pkg, error: pkgError } = await adminSupabase
        .from('credit_packages')
        .select('*')
        .eq('id', packageId)
        .single();
      
      if (pkgError || !pkg) {
        return new Response(JSON.stringify({ error: 'Invalid or missing package' }), { status: 400, headers: corsHeaders });
      }
      credits = pkg.credits;
      amount = pkg.price;
    }

    if (!credits || !amount) {
      return new Response(JSON.stringify({ error: 'Missing credits, amount or packageId' }), { status: 400, headers: corsHeaders });
    }

    const { data: purchase, error: purchaseError } = await adminSupabase
      .from('student_purchases')
      .insert({
        student_id: user.id,
        amount: Number(amount),
        credits_added: Number(credits),
        status: 'pending'
      })
      .select()
      .single();

    if (purchaseError) {
      throw new Error(`Failed to create purchase entry: ${purchaseError.message}`);
    }

    const mpAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') || 'APP_USR-3305005765157252-051908-c159861bc134359899fcaf474b291ef4-1090555523';
    const notificationUrl = `${supabaseUrl}/functions/v1/mercado-pago-webhook`;
    
    let finalRedirectUrl = redirectUrl || 'https://redarum.com.br';
    if (finalRedirectUrl.includes('localhost') || finalRedirectUrl.includes('127.0.0.1') || !finalRedirectUrl.startsWith('https')) {
      finalRedirectUrl = 'https://redarum.com.br';
    }

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mpAccessToken}`
      },
      body: JSON.stringify({
        items: [
          {
            id: purchase.id,
            title: `${credits} Crédito(s) de Redação - Redarum`,
            quantity: 1,
            unit_price: Number(amount),
            currency_id: 'BRL'
          }
        ],
        payer: {
          email: user.email,
          name: user.user_metadata?.name || ''
        },
        back_urls: {
          success: finalRedirectUrl,
          failure: finalRedirectUrl,
          pending: finalRedirectUrl
        },
        auto_return: 'approved',
        external_reference: purchase.id,
        notification_url: notificationUrl
      })
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      throw new Error(`Mercado Pago preference creation failed: ${errorText}`);
    }

    const preference = await mpResponse.json();

    await adminSupabase
      .from('student_purchases')
      .update({ preference_id: preference.id })
      .eq('id', purchase.id);

    return new Response(
      JSON.stringify({ 
        id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
