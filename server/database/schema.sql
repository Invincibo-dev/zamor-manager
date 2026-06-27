-- Zamor Manager — Database Schema
-- Généré automatiquement via: node server/scripts/generate-schema.js > server/database/schema.sql
-- Dernière mise à jour: 2026-06-27
-- NE PAS MODIFIER MANUELLEMENT — relancer le script après chaque changement de modèle.
--
-- Tables incluses (14):
--   clients, company_settings, debt_payments, debts, expenses,
--   login_attempts, login_history, phones, products, receipt_items,
--   repairs, sale_receipts, stock_movements, users

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;


-- Table: users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','vendeur','gestionnaire') NOT NULL DEFAULT 'vendeur',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Table: company_settings
CREATE TABLE IF NOT EXISTS `company_settings` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL DEFAULT 'Zamor Multi Services Acces',
  `logo_data` mediumtext,
  `address` varchar(500) DEFAULT NULL,
  `phone` varchar(100) DEFAULT NULL,
  `exchange_rate` decimal(10,4) DEFAULT '132.0000',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Table: products
CREATE TABLE IF NOT EXISTS `products` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `quantite_stock` int NOT NULL DEFAULT '0',
  `seuil_alerte` int NOT NULL DEFAULT '5',
  `prix_achat` decimal(12,2) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Table: clients
CREATE TABLE IF NOT EXISTS `clients` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(200) NOT NULL,
  `telephone` varchar(50) DEFAULT NULL,
  `email` varchar(200) DEFAULT NULL,
  `notes` text,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Table: sale_receipts
CREATE TABLE IF NOT EXISTS `sale_receipts` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `code_recu` varchar(20) NOT NULL,
  `session_id` varchar(64) NOT NULL,
  `vendeur_id` int unsigned NOT NULL,
  `date` datetime NOT NULL,
  `total_general` decimal(12,2) NOT NULL DEFAULT '0.00',
  `mode_paiement` varchar(50) NOT NULL,
  `signature_vendeur` varchar(255) DEFAULT NULL,
  `devise` enum('HTG','USD') NOT NULL DEFAULT 'HTG',
  `taux_change` decimal(10,4) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code_recu` (`code_recu`),
  UNIQUE KEY `sale_receipts_session_id_unique` (`session_id`),
  KEY `vendeur_id` (`vendeur_id`),
  KEY `sale_receipts_date_idx` (`date`),
  CONSTRAINT `sale_receipts_ibfk_1` FOREIGN KEY (`vendeur_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Table: phones
CREATE TABLE IF NOT EXISTS `phones` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `imei` varchar(20) NOT NULL,
  `modele` varchar(200) NOT NULL,
  `couleur` varchar(100) DEFAULT NULL,
  `prix_achat` decimal(12,2) NOT NULL,
  `prix_vente` decimal(12,2) NOT NULL,
  `statut` enum('disponible','vendu','en_reparation') NOT NULL DEFAULT 'disponible',
  `notes` text,
  `sale_receipt_id` int unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `imei` (`imei`),
  KEY `sale_receipt_id` (`sale_receipt_id`),
  CONSTRAINT `phones_ibfk_1` FOREIGN KEY (`sale_receipt_id`) REFERENCES `sale_receipts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Table: receipt_items
CREATE TABLE IF NOT EXISTS `receipt_items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `receipt_id` int unsigned NOT NULL,
  `product_id` int unsigned DEFAULT NULL,
  `phone_id` int unsigned DEFAULT NULL,
  `nom_produit` varchar(255) NOT NULL,
  `quantite` int unsigned NOT NULL,
  `prix_unitaire` decimal(12,2) NOT NULL,
  `prix_achat` decimal(12,2) DEFAULT NULL,
  `total` decimal(12,2) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `receipt_id` (`receipt_id`),
  KEY `product_id` (`product_id`),
  KEY `phone_id` (`phone_id`),
  CONSTRAINT `receipt_items_ibfk_1` FOREIGN KEY (`receipt_id`) REFERENCES `sale_receipts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `receipt_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `receipt_items_ibfk_3` FOREIGN KEY (`phone_id`) REFERENCES `phones` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Table: repairs
CREATE TABLE IF NOT EXISTS `repairs` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `ticket` varchar(20) NOT NULL,
  `client_nom` varchar(200) NOT NULL,
  `client_telephone` varchar(50) DEFAULT NULL,
  `phone_id` int unsigned DEFAULT NULL,
  `phone_description` varchar(200) DEFAULT NULL,
  `panne` text NOT NULL,
  `cout_estimation` decimal(12,2) DEFAULT NULL,
  `cout_final` decimal(12,2) DEFAULT NULL,
  `statut` enum('en_attente','en_cours','termine','livre') NOT NULL DEFAULT 'en_attente',
  `date_depot` date NOT NULL,
  `date_livraison_estimee` date DEFAULT NULL,
  `date_livraison_reelle` date DEFAULT NULL,
  `notes` text,
  `created_by` int unsigned NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ticket` (`ticket`),
  KEY `phone_id` (`phone_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `repairs_ibfk_1` FOREIGN KEY (`phone_id`) REFERENCES `phones` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `repairs_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Table: stock_movements
CREATE TABLE IF NOT EXISTS `stock_movements` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int unsigned NOT NULL,
  `type` enum('sale','restock','adjustment','loss') NOT NULL,
  `quantity` int NOT NULL,
  `reference_id` int unsigned DEFAULT NULL,
  `note` text,
  `created_by` int unsigned NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `stock_movements_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `stock_movements_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Table: debts
CREATE TABLE IF NOT EXISTS `debts` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `client_id` int unsigned NOT NULL,
  `sale_receipt_id` int unsigned DEFAULT NULL,
  `montant_total` decimal(12,2) NOT NULL,
  `montant_paye` decimal(12,2) NOT NULL DEFAULT '0.00',
  `statut` enum('en_cours','remboursee','annulee') NOT NULL DEFAULT 'en_cours',
  `notes` text,
  `created_by` int unsigned NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `client_id` (`client_id`),
  KEY `sale_receipt_id` (`sale_receipt_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `debts_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `debts_ibfk_2` FOREIGN KEY (`sale_receipt_id`) REFERENCES `sale_receipts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `debts_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Table: debt_payments
CREATE TABLE IF NOT EXISTS `debt_payments` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `debt_id` int unsigned NOT NULL,
  `montant` decimal(12,2) NOT NULL,
  `mode_paiement` varchar(50) NOT NULL DEFAULT 'Cash',
  `date_paiement` date NOT NULL,
  `note` text,
  `created_by` int unsigned NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `debt_id` (`debt_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `debt_payments_ibfk_1` FOREIGN KEY (`debt_id`) REFERENCES `debts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `debt_payments_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Table: expenses
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `categorie` varchar(100) NOT NULL,
  `montant` decimal(12,2) NOT NULL,
  `date_depense` date NOT NULL,
  `note` text,
  `created_by` int unsigned NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Table: login_attempts  (rate limiting — créée par server.js au démarrage)
CREATE TABLE IF NOT EXISTS `login_attempts` (
  `ip` varchar(45) NOT NULL,
  `count` int unsigned NOT NULL DEFAULT '1',
  `reset_at` datetime NOT NULL,
  PRIMARY KEY (`ip`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- Table: login_history  (audit des connexions — créée par server.js au démarrage)
CREATE TABLE IF NOT EXISTS `login_history` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned DEFAULT NULL,
  `email` varchar(200) NOT NULL,
  `ip` varchar(45) NOT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `success` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_lh_user` (`user_id`),
  KEY `idx_lh_created` (`created_at`),
  KEY `idx_lh_success` (`success`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


SET FOREIGN_KEY_CHECKS = 1;
