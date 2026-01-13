import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    
    let event: Stripe.Event;
    
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // For testing without webhook signature verification
      event = JSON.parse(body);
    }

    console.log(`Processing event: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      if (session.payment_status === "paid" && session.metadata) {
        const userId = session.metadata.user_id;
        const credits = parseInt(session.metadata.credits, 10);
        
        if (userId && credits) {
          console.log(`Adding ${credits} credits to user ${userId}`);
          
          // Get current credits
          const { data: profile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("credits")
            .eq("id", userId)
            .single();
          
          if (profileError) {
            console.error("Error fetching profile:", profileError);
            throw profileError;
          }
          
          const currentCredits = profile?.credits || 0;
          const newCredits = currentCredits + credits;
          
          // Update credits
          const { error: updateError } = await supabaseAdmin
            .from("profiles")
            .update({ credits: newCredits, updated_at: new Date().toISOString() })
            .eq("id", userId);
          
          if (updateError) {
            console.error("Error updating credits:", updateError);
            throw updateError;
          }
          
          // Log transaction
          const { error: txError } = await supabaseAdmin
            .from("credit_transactions")
            .insert({
              user_id: userId,
              amount: credits,
              transaction_type: "purchase",
              description: `Purchased ${credits} credits`,
            });
          
          if (txError) {
            console.error("Error logging transaction:", txError);
          }
          
          console.log(`Successfully added ${credits} credits. New balance: ${newCredits}`);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
