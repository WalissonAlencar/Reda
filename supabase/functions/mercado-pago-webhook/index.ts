import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    
    let paymentId = url.searchParams.get('id') || url.searchParams.get('data.id');
    const topic = url.searchParams.get('topic') || url.searchParams.get('type');
    
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.data && body.data.id) {
          paymentId = body.data.id;
        }
      } catch (_) {
        // Ignore JSON parse errors
      }
    }

    if (!paymentId) {
      console.log('Webhook triggered, but no payment ID was found.');
      return new Response('No payment ID found', { status: 200 });
    }

    console.log(`Processing payment ID: ${paymentId}`);

    const mpAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') || 'APP_USR-3305005765157252-051908-c159861bc134359899fcaf474b291ef4-1090555523';
    
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`
      }
    });

    if (!mpResponse.ok) {
      console.error(`Failed to fetch payment details: ${await mpResponse.text()}`);
      return new Response('Failed to fetch payment from Mercado Pago', { status: 200 });
    }

    const payment = await mpResponse.json();
    const purchaseId = payment.external_reference;
    const paymentStatus = payment.status;

    if (!purchaseId) {
      console.error('No external_reference (purchaseId) found in payment.');
      return new Response('No external reference found', { status: 200 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const { data: purchase, error: purchaseError } = await adminSupabase
      .from('student_purchases')
      .select('*')
      .eq('id', purchaseId)
      .single();

    if (purchaseError || !purchase) {
      console.error(`Purchase record not found: ${purchaseId}`);
      return new Response('Purchase record not found', { status: 200 });
    }

    console.log(`Purchase ID: ${purchaseId}, Current Status: ${purchase.status}, New Payment Status: ${paymentStatus}`);

    if (paymentStatus === 'approved' && purchase.status !== 'approved') {
      const { error: updatePurchaseError } = await adminSupabase
        .from('student_purchases')
        .update({
          status: 'approved',
          payment_id: String(paymentId),
          payment_method: payment.payment_method_id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', purchaseId);

      if (updatePurchaseError) {
        throw new Error(`Failed to update purchase: ${updatePurchaseError.message}`);
      }

      const { data: user, error: userError } = await adminSupabase
        .from('users')
        .select('essay_credits')
        .eq('id', purchase.student_id)
        .single();

      if (userError || !user) {
        throw new Error(`Failed to fetch user profile: ${userError?.message}`);
      }

      const newCredits = (user.essay_credits || 0) + purchase.credits_added;
      const { error: updateUserError } = await adminSupabase
        .from('users')
        .update({ essay_credits: newCredits })
        .eq('id', purchase.student_id);

      if (updateUserError) {
        throw new Error(`Failed to update user credits: ${updateUserError.message}`);
      }

      console.log(`Successfully credited ${purchase.credits_added} credits to user ${purchase.student_id}. New balance: ${newCredits}`);
    } else if (paymentStatus !== 'approved' && purchase.status === 'pending') {
      await adminSupabase
        .from('student_purchases')
        .update({
          status: paymentStatus,
          payment_id: String(paymentId),
          payment_method: payment.payment_method_id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', purchaseId);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error(`Webhook error: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
});
