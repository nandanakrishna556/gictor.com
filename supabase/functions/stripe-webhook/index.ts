import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Map subscription price IDs -> total monthly credits delivered
const PRICE_TO_CREDITS: Record<string, number> = {
  "price_1TdOh3Jzf8eDXLMZ8inf1qYZ": 1.7,
  "price_1TdOhNJzf8eDXLMZlGdHKNU6": 9,
  "price_1TdOhfJzf8eDXLMZScwouVCX": 27,
  "price_1TdOi4Jzf8eDXLMZ0teAHouz": 61,
  "price_1TdOiIJzf8eDXLMZhZSHMl1P": 130,
  "price_1TdOiwJzf8eDXLMZwokNhBZj": 230,
};

const PRODUCT_TO_PLAN: Record<string, string> = {
  "prod_Ucdzjww2wSiE1Y": "trial",
  "prod_UcdzyGbUFQxYYH": "starter",
  "prod_UcdzZxCSby0rTU": "creator",
  "prod_Uce0fI11YcWVSG": "pro",
  "prod_Uce0fhFJM8wHwd": "studio",
  "prod_Uce0ao4H63hmqT": "agency",
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

  const logEvent = async (entry: {
    event_type: string;
    stripe_event_id?: string;
    status?: string;
    user_id?: string | null;
    user_email?: string | null;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
    stripe_price_id?: string | null;
    plan?: string | null;
    credits_granted?: number | null;
    billing_reason?: string | null;
    error_message?: string | null;
    payload?: Record<string, unknown>;
  }) => {
    try {
      await supabaseAdmin.from("subscription_events").insert({
        status: "received",
        ...entry,
        payload: entry.payload ?? {},
      });
    } catch (err) {
      console.error("Failed to write audit event:", err);
    }
  };

  try {
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return new Response(JSON.stringify({ error: "Webhook not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err instanceof Error ? err.message : "Unknown error");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    console.log(`Processing event: ${event.type} (${event.id})`);

    const grantCredits = async (userId: string, credits: number, description: string) => {
      if (!userId || !credits) return;
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("credits")
        .eq("id", userId)
        .single();
      if (profileError) throw profileError;
      const currentCredits = Number(profile?.credits || 0);
      const newCredits = currentCredits + credits;
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ credits: newCredits, updated_at: new Date().toISOString() })
        .eq("id", userId);
      if (updateError) throw updateError;
      const { error: txError } = await supabaseAdmin
        .from("credit_transactions")
        .insert({
          user_id: userId,
          amount: credits,
          transaction_type: "purchase",
          description,
        });
      if (txError) console.error("Error logging transaction:", txError);
      console.log(`Granted ${credits} credits to ${userId}. New balance: ${newCredits}`);
    };

    const resolveUserIdByEmail = async (email?: string | null) => {
      if (!email) return undefined;
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      return data?.id as string | undefined;
    };

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const credits = Number(session.metadata?.credits || 0);
      const priceId = session.metadata?.price_id ?? null;

      if (session.payment_status === "paid" && userId && credits) {
        try {
          await grantCredits(userId, credits, `Subscription credits (${credits})`);
          await logEvent({
            event_type: event.type,
            stripe_event_id: event.id,
            status: "credits_granted",
            user_id: userId,
            user_email: session.customer_email,
            stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
            stripe_price_id: priceId,
            credits_granted: credits,
            billing_reason: "checkout",
            payload: { session_id: session.id },
          });
        } catch (err) {
          await logEvent({
            event_type: event.type,
            stripe_event_id: event.id,
            status: "error",
            user_id: userId,
            error_message: err instanceof Error ? err.message : String(err),
            payload: { session_id: session.id },
          });
          throw err;
        }
      } else {
        await logEvent({
          event_type: event.type,
          stripe_event_id: event.id,
          status: "skipped",
          user_id: userId,
          payload: { reason: "not paid or missing metadata", session_id: session.id },
        });
      }
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice & {
        subscription?: string | null;
        billing_reason?: string;
      };
      const billingReason = invoice.billing_reason;
      const subscriptionId = invoice.subscription as string | undefined;

      if ((billingReason === "subscription_cycle" || billingReason === "subscription_update") && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;
        const productId = subscription.items.data[0]?.price.product as string | undefined;
        const credits = priceId ? PRICE_TO_CREDITS[priceId] : undefined;
        const plan = productId ? PRODUCT_TO_PLAN[productId] ?? null : null;
        const metaUserId = (subscription.metadata?.user_id as string | undefined) ||
          (invoice.metadata?.user_id as string | undefined);
        const resolvedUserId = metaUserId || await resolveUserIdByEmail(invoice.customer_email);

        if (resolvedUserId && credits) {
          try {
            await grantCredits(resolvedUserId, credits, `Monthly renewal (${credits} credits)`);
            if (plan) {
              await supabaseAdmin.from("profiles").update({ plan }).eq("id", resolvedUserId);
            }
            await logEvent({
              event_type: event.type,
              stripe_event_id: event.id,
              status: "credits_granted",
              user_id: resolvedUserId,
              user_email: invoice.customer_email,
              stripe_customer_id: typeof invoice.customer === "string" ? invoice.customer : null,
              stripe_subscription_id: subscriptionId,
              stripe_price_id: priceId,
              plan,
              credits_granted: credits,
              billing_reason: billingReason,
              payload: { invoice_id: invoice.id },
            });
          } catch (err) {
            await logEvent({
              event_type: event.type,
              stripe_event_id: event.id,
              status: "error",
              user_id: resolvedUserId,
              error_message: err instanceof Error ? err.message : String(err),
              payload: { invoice_id: invoice.id },
            });
            throw err;
          }
        } else {
          await logEvent({
            event_type: event.type,
            stripe_event_id: event.id,
            status: "skipped",
            user_email: invoice.customer_email,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: priceId,
            billing_reason: billingReason,
            payload: { reason: "missing user or unknown price", invoice_id: invoice.id },
          });
        }
      } else {
        await logEvent({
          event_type: event.type,
          stripe_event_id: event.id,
          status: "skipped",
          billing_reason: billingReason,
          stripe_subscription_id: subscriptionId,
          payload: { reason: "billing_reason not eligible for renewal grant", invoice_id: invoice.id },
        });
      }
    }

    // Audit other subscription lifecycle events for support visibility
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price.id ?? null;
      const productId = sub.items.data[0]?.price.product as string | undefined;
      const plan = productId ? PRODUCT_TO_PLAN[productId] ?? null : null;
      const customerId = typeof sub.customer === "string" ? sub.customer : null;
      let email: string | null = null;
      let userId: string | undefined;
      try {
        if (customerId) {
          const customer = await stripe.customers.retrieve(customerId);
          if (!("deleted" in customer) || !customer.deleted) {
            email = (customer as Stripe.Customer).email ?? null;
            userId = await resolveUserIdByEmail(email);
          }
        }
      } catch (e) {
        console.error("Failed to load customer for audit:", e);
      }
      if (userId && plan && event.type !== "customer.subscription.deleted") {
        await supabaseAdmin.from("profiles").update({ plan }).eq("id", userId);
      }
      await logEvent({
        event_type: event.type,
        stripe_event_id: event.id,
        status: "logged",
        user_id: userId ?? null,
        user_email: email,
        stripe_customer_id: customerId,
        stripe_subscription_id: sub.id,
        stripe_price_id: priceId,
        plan,
        payload: { status: sub.status },
      });
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
