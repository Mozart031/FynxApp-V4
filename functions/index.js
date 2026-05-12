const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { google } = require("googleapis");

admin.initializeApp();
const db = admin.firestore();

// ── CONFIGURACIÓN DE GOOGLE PLAY API ──────────────────────────────────────────
// El usuario debe subir su service-account.json a Google Cloud Console
// y otorgar permisos de "Administrador de Finanzas" en Play Console.
const auth = new google.auth.GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/androidpublisher"],
});

const androidPublisher = google.androidpublisher({
  version: "v3",
  auth,
});

/**
 * Endpoint para recibir Webhooks de Google Play (RTDN)
 * Soluciona el bug de cancelaciones automáticas por falta de ACK (HTTP 200).
 */
exports.googlePlayWebhook = functions.https.onRequest(async (req, res) => {
  // 1 — Responder HTTP 200 INMEDIATAMENTE para evitar reintentos de Google
  res.status(200).send("OK");

  try {
    const message = req.body.message;
    if (!message || !message.data) {
      console.warn("No message data received.");
      return;
    }

    const data = JSON.parse(Buffer.from(message.data, "base64").toString());
    console.log("RTDN Data:", JSON.stringify(data));

    if (!data.subscriptionNotification) {
      console.log("Not a subscription notification, ignoring.");
      return;
    }

    const { purchaseToken, subscriptionId } = data.subscriptionNotification;
    const notificationType = data.subscriptionNotification.notificationType;

    // 2 — Verificar idempotencia (No procesar el mismo token dos veces)
    const tokenRef = db.collection("_processedTokens").doc(purchaseToken);
    const tokenDoc = await tokenRef.get();
    
    // Si ya existe y no es una cancelación, ignoramos
    if (tokenDoc.exists && notificationType !== 3) {
      console.log(`Token ${purchaseToken} already processed, skipping.`);
      return;
    }

    // 3 — Verificar estado real con Google Play Developer API
    // Esto es crucial para evitar fraudes y confirmar que la compra es válida.
    const packageName = "com.fynx.elite"; // Debe coincidir con el ID del paquete en Play Store
    const subscription = await androidPublisher.purchases.subscriptions.get({
      packageName,
      subscriptionId,
      token: purchaseToken,
    });

    const paymentState = subscription.data.paymentState;
    // paymentState: 0 (Pending), 1 (Received), 2 (Free Trial)
    const isActive = paymentState === 1 || paymentState === 2;

    console.log(`Subscription ${subscriptionId} status: ${paymentState} (Active: ${isActive})`);

    // 4 — Identificar al usuario y activar/desactivar Elite
    // El purchaseToken suele guardarse en el perfil del usuario durante la compra inicial.
    // Buscamos al usuario que tenga este token.
    const userQuery = await db.collection("usuarios")
      .where("latestPurchaseToken", "==", purchaseToken)
      .limit(1)
      .get();

    if (!userQuery.empty) {
      const userDoc = userQuery.docs[0];
      const uid = userDoc.id;

      if (isActive) {
        await userDoc.ref.update({
          premium: true,
          eliteSince: admin.firestore.FieldValue.serverTimestamp(),
          subscriptionId: subscriptionId,
        });
        console.log(`Elite activated for user ${uid}`);
      } else if (notificationType === 3 || notificationType === 12) {
        // 3: CANCELLED, 12: REVOKED
        await userDoc.ref.update({ premium: false });
        console.log(`Elite deactivated for user ${uid}`);
      }
    } else {
      console.warn(`No user found with purchaseToken: ${purchaseToken}`);
    }

    // 5 — Guardar token como procesado
    await tokenRef.set({
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      subscriptionId,
      notificationType,
    });

  } catch (error) {
    console.error("Webhook Error:", error.message);
    // No lanzamos error para que la función termine con éxito (ya enviamos el 200)
  }
});
