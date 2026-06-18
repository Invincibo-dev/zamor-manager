[dotenv@17.3.1] injecting env (10) from .env -- tip: 🛠️  run anywhere with `dotenvx run -- yourcommand`
-- Zamor Manager — Database Schema
-- Généré automatiquement via: node server/scripts/generate-schema.js > server/database/schema.sql
-- Date: 2026-06-18
-- NE PAS MODIFIER MANUELLEMENT — relancer le script après chaque changement de modèle.

SET FOREIGN_KEY_CHECKS = 0;


-- Table: users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','vendeur') NOT NULL DEFAULT 'vendeur',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Table: sale_receipts
CREATE TABLE IF NOT EXISTS `sale_receipts` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `code_recu` varchar(20) NOT NULL,
  `vendeur_id` int unsigned NOT NULL,
  `date` datetime NOT NULL,
  `total_general` decimal(12,2) NOT NULL DEFAULT '0.00',
  `mode_paiement` varchar(50) NOT NULL,
  `signature_vendeur` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `session_id` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code_recu` (`code_recu`),
  UNIQUE KEY `sale_receipts_session_id_unique` (`session_id`),
  KEY `vendeur_id` (`vendeur_id`),
  KEY `sale_receipts_date_idx` (`date`),
  CONSTRAINT `sale_receipts_ibfk_1` FOREIGN KEY (`vendeur_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Table: receipt_items
CREATE TABLE IF NOT EXISTS `receipt_items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `receipt_id` int unsigned NOT NULL,
  `nom_produit` varchar(255) NOT NULL,
  `quantite` int unsigned NOT NULL,
  `prix_unitaire` decimal(12,2) NOT NULL,
  `total` decimal(12,2) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `receipt_id` (`receipt_id`),
  CONSTRAINT `receipt_items_ibfk_1` FOREIGN KEY (`receipt_id`) REFERENCES `sale_receipts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


SET FOREIGN_KEY_CHECKS = 1;
