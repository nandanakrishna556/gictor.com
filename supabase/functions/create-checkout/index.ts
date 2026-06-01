import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map of valid subscription price IDs -> total credits delivered per month
const PRICE_TO_CREDITS: Record<string, number> = {
  "price_1TdOh3Jzf8eDXLMZ8inf1qYZ": 1.7,   // Trial $6
  "price_1TdOhNJzf8eDXLMZlGdHKNU6": 9,     // Starter $29
  "price_1TdOhfJzf8eDXLMZScwouVCX": 27,    // Creator $79
  "price_1TdOi4Jzf8eDXLMZ0teAHouz": 61,    // Pro $149 (51 + 10 bonus)
  "price_1TdOiIJzf8eDXLMZhZSHMl1P": 130,   // Studio $299 (105 + 25 bonus)
  "price_1TdOiwJzf8eDXLMZwokNhBZj": 230,   // Agency $499 (180 + 50 bonus)
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const { priceId } = await req.json();

    if (!priceId || !(priceId in PRICE_TO_CREDITS)) {
      throw new Error("Invalid price ID");
    }

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if a Stripe customer already exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create subscription checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/billing?success=true`,
      cancel_url: `${req.headers.get("origin")}/billing?canceled=true`,
      metadata: {
        user_id: user.id,
        price_id: priceId,
        credits: String(PRICE_TO_CREDITS[priceId]),
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Checkout error:", error instanceof Error ? error.message : String(error));
    return new Response(JSON.stringify({ error: "Unable to start checkout" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
