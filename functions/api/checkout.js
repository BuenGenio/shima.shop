import Stripe from 'stripe';

const PRODUCTS = {
  cookies: {
    name: 'Cookies',
    fullPrice: 78800,
    items: {
      'variety-6pack':         { name: 'Protein Cookie Variety 6-Pack',          price: 2000 },
      'cinnamon-almond-12':    { name: 'Cinnamon & Almond 12 Cookie Set',       price: 3360 },
      'double-choc-12':        { name: 'Double Chocolate 12 Cookie Set',        price: 3360 },
      'chunk-choc-walnut-12':  { name: 'Chunk Chocolate & Walnut 12 Cookie Set', price: 3360 },
      'chocolate-set':         { name: 'Protein Cookie Set — Chocolate',        price: 3000 },
      'breakfast-granola-12':  { name: 'Breakfast Granola 12 Cookie Set',       price: 3360 },
      'double-choc-6':         { name: 'Double Chocolate 6 Cookies',            price: 1980 },
      'breakfast-granola-6':   { name: 'Breakfast Granola 6 Cookies',           price: 1980 },
      'matcha-macadamia-6':    { name: 'Matcha & Macadamia 6 Cookies',          price: 1980 },
      'mix-set-12':            { name: 'Protein Cookies Mix Set 12 Cookies',    price: 3000 },
      'bulk-mix-set':          { name: 'Protein Cookies Bulk Mix Set 8 Cookies', price: 5700 },
      'double-choc-24':        { name: 'Double Chocolate 24 Cookies',           price: 6420 },
      'breakfast-granola-24':  { name: 'Breakfast Granola 24 Cookies',          price: 6420 },
      'matcha-macadamia-24':   { name: 'Matcha & Macadamia 24 Cookies',         price: 6420 },
      'cinnamon-almond-6':     { name: 'Cinnamon & Almond 6 Cookies',          price: 1980 },
      'chunky-choc-walnut-6':  { name: 'Chunky Choc & Walnut 6 pieces',        price: 1980 },
      'salted-caramel-choc':   { name: 'Salted Caramel & Chocolate',            price: 1980 },
      'trial-set':             { name: 'Protein Cookie Trial Set 6 Cookies',    price: 2100 },
      'white-day-limited':     { name: 'White Day Limited Edition 6 Cookies',   price: 2100 },
      'salted-caramel-choc-12': { name: 'Salted Caramel & Chocolate 12 Cookie Set', price: 3360 },
      'matcha-macadamia-12':   { name: 'Matcha & Macadamia 12 Cookie Set',      price: 3360 },
      'bulk-48':               { name: '業務用クッキー 48枚',                      price: 9600 },
    },
  },
};

export async function onRequestPost(context) {
  const { env, request } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const { kitId, selectedItems } = await request.json();

    const kit = PRODUCTS[kitId];
    if (!kit) {
      return Response.json(
        { error: 'Unknown kit' },
        { status: 400, headers: corsHeaders },
      );
    }

    const validItems = (selectedItems || []).filter(id => kit.items[id]);
    if (validItems.length === 0) {
      return Response.json(
        { error: 'No valid items selected' },
        { status: 400, headers: corsHeaders },
      );
    }

    const allSelected = validItems.length === Object.keys(kit.items).length;

    let lineItems;
    if (allSelected) {
      lineItems = [{
        price_data: {
          currency: 'jpy',
          product_data: { name: `${kit.name} (Complete)` },
          unit_amount: kit.fullPrice,
        },
        quantity: 1,
      }];
    } else {
      lineItems = validItems.map(id => ({
        price_data: {
          currency: 'jpy',
          product_data: { name: kit.items[id].name },
          unit_amount: kit.items[id].price,
        },
        quantity: 1,
      }));
    }

    const origin = new URL(request.url).origin;

    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
      metadata: {
        kit: kitId,
        items: validItems.join(','),
      },
    });

    return Response.json({ url: session.url }, { headers: corsHeaders });
  } catch (err) {
    console.error('Checkout error:', err);
    return Response.json(
      { error: 'Failed to create checkout session' },
      { status: 500, headers: corsHeaders },
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
