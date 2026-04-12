import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Map Stripe product IDs to plan names
const PRODUCT_TO_PLAN: Record<string, string> = {
  "prod_UJtZRirS1cMRzT": "starter",
  "prod_UJtZ1QXGXhmPrU": "creator",
  "prod_UJtZQmVzwRmF7P": "pro",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    // Use anon key client with user's auth header for JWT validation
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) throw new Error(`Authentication error: ${claimsError?.message || "invalid claims"}`);
    
    const userId = claimsData.claims.sub as string;
    const email = claimsData.claims.email as string;
    if (!userId || !email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId, email });

    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) throw new Error(`Failed to load profile: ${profileError.message}`);

    const existingPlan = profileData?.plan ?? null;
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found, keeping existing plan", { existingPlan });
      return new Response(JSON.stringify({ subscribed: false, plan: existingPlan }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      logStep("No active subscription, keeping existing plan", { existingPlan });
      return new Response(JSON.stringify({ subscribed: false, plan: existingPlan }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0].price.id;
    const productId = subscription.items.data[0].price.product as string;
    const plan = PRODUCT_TO_PLAN[productId];
    const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();

    if (!plan) {
      logStep("Unknown product mapping, keeping existing plan", { productId, existingPlan, subscriptionEnd });
      return new Response(JSON.stringify({
        subscribed: true,
        plan: existingPlan,
        price_id: priceId,
        subscription_end: subscriptionEnd,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Active subscription found", { productId, plan, priceId, subscriptionEnd });

    await supabaseClient.from("profiles").update({ plan }).eq("id", user.id);

    return new Response(JSON.stringify({
      subscribed: true,
      plan,
      price_id: priceId,
      subscription_end: subscriptionEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
