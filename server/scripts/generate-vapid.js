/**
 * Génère une paire de clés VAPID pour les push notifications.
 * Usage: node server/scripts/generate-vapid.js
 * Coller les lignes générées dans le fichier .env du serveur.
 */
const webpush = require("web-push");
const keys = webpush.generateVAPIDKeys();
console.log("# Coller dans server/.env :");
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:admin@zamor.app`);
