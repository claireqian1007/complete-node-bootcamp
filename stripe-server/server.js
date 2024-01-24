const express = require("express");
const app = express();
const { resolve } = require("path");
// Replace if using a different env file or config
const env = require("dotenv").config({ path: "./.env" });
const STRIPE_PUBLISHABLE_KEY =
  "pk_test_51OCeJYKNXPQRvFqlaRZAQxWUt1bAemwEc39PXeuTvvMRz7QZb0h7Q2hbMvu0uYvWvnMY3JHq3L3QX3cogYNzUuna00e2K1KLgp";
const STRIPE_SECRET_KEY =
  "sk_test_51OCeJYKNXPQRvFqlX1LQFjWWI4CfwYitZnoOHdFKWFgSCh5CTOyo4SuFhLRLZVYhf53t1HJLuVYzRsChYY7AzP3u00fxcFAl32";
const stripe = require("stripe")(STRIPE_SECRET_KEY, {
  apiVersion: "2020-08-27",
  appInfo: {
    // For sample support and debugging, not required for production:
    name: "stripe-samples/accept-a-payment/payment-element",
    version: "0.0.2",
    url: "https://github.com/stripe-samples",
  },
});

class SuccessResponse {
  constructor(data) {
    this.code = 200;
    this.message = "";
    this.data = data;
  }
}

app.use(express.static(__dirname));
app.use(
  express.json({
    // We need the raw body to verify webhook signatures.
    // Let's compute it only when hitting the Stripe webhook endpoint.
    verify: function (req, res, buf) {
      if (req.originalUrl.startsWith("/webhook")) {
        req.rawBody = buf.toString();
      }
    },
  })
);

app.get("/", (req, res) => {
  const path = resolve(__dirname + "/index.html");
  res.sendFile(path);
});

app.get("/config", (req, res) => {
  res.send(
    new SuccessResponse({
      publishableKey: STRIPE_PUBLISHABLE_KEY,
    })
  );
});

app.get("/products", async (req, res) => {
  try {
    const products = await stripe.products.list({
      limit: 3,
    });

    res.send(
      new SuccessResponse({
        products: products.data,
      })
    );
  } catch (e) {
    return res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
});

app.get("/prices", async (req, res) => {
  try {
    const prices = await stripe.prices.list({
      limit: 3,
    });

    res.send({
      prices,
    });
  } catch (e) {
    return res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
});

app.get("/create-payment-intent", async (req, res) => {
  // Create a PaymentIntent with the amount, currency, and a payment method type.
  //
  // See the documentation [0] for the full list of supported parameters.
  //
  // [0] https://stripe.com/docs/api/payment_intents/create
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      currency: "EUR",
      amount: 1999,
      automatic_payment_methods: {
        allow_redirects: "never",
        enabled: true,
      },
      payment_method_options: {
        // sofort: {
        //   preferred_language: "pl",
        // },
        card: {
          request_three_d_secure: "any",
        },
      },
    });

    // Send publishable key and PaymentIntent details to client
    res.send(
      new SuccessResponse({
        clientSecret: paymentIntent.client_secret,
      })
    );
  } catch (e) {
    return res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
});

app.post("/confirmPayment", async (req, res) => {
  const paymentIntent = await stripe.paymentIntents.confirm(
    req.body.paymentIntentId
    // { payment_method: req.body.paymentMethod }
  );
  if (paymentIntent.status === "succeeded") {
    res.send(200);
  }
});

// Expose a endpoint as a webhook handler for asynchronous events.
// Configure your webhook in the stripe developer dashboard
// https://dashboard.stripe.com/test/webhooks
app.post("/webhook", async (req, res) => {
  let data, eventType;

  // Check if webhook signing is configured.
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;
    let signature = req.headers["stripe-signature"];
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`);
      return res.sendStatus(400);
    }
    data = event.data;
    eventType = event.type;
  } else {
    // Webhook signing is recommended, but if the secret is not configured in `config.js`,
    // we can retrieve the event data directly from the request body.
    data = req.body.data;
    eventType = req.body.type;
  }

  if (eventType === "payment_intent.succeeded") {
    // Funds have been captured
    // Fulfill any orders, e-mail receipts, etc
    // To cancel the payment after capture you will need to issue a Refund (https://stripe.com/docs/api/refunds)
    console.log("💰 Payment captured!");
  } else if (eventType === "payment_intent.payment_failed") {
    console.log("❌ Payment failed.");
  }
  res.sendStatus(200);
});

app.post(
  "/webhook",
  express.json({ type: "application/json" }),
  (request, response) => {
    const event = request.body;

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        console.log("success!", paymentIntent);
        // Then define and call a method to handle the successful payment intent.
        // handlePaymentIntentSucceeded(paymentIntent);
        break;
      case "payment_method.attached":
        const paymentMethod = event.data.object;
        // Then define and call a method to handle the successful attachment of a PaymentMethod.
        // handlePaymentMethodAttached(paymentMethod);
        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    response.json({ received: true });
  }
);

app.listen(4242, () =>
  console.log(`Node server listening at http://localhost:4242`)
);
