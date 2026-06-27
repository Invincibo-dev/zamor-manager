const { Op, Sequelize } = require("sequelize");
const { Client, Debt } = require("../models");

const MAX_LIMIT = 100;

const listClients = async (req, res, next) => {
  try {
    const search = req.query.search?.trim();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const where = search
      ? {
          [Op.or]: [
            { nom: { [Op.like]: `%${search}%` } },
            { telephone: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    const { count, rows } = await Client.findAndCountAll({
      where,
      attributes: {
        include: [
          [
            Sequelize.literal(
              "(SELECT COALESCE(SUM(montant_total - montant_paye), 0) FROM debts WHERE debts.client_id = `Client`.`id` AND debts.statut = 'en_cours')"
            ),
            "solde_du",
          ],
        ],
      },
      order: [["nom", "ASC"]],
      limit,
      offset,
    });

    res.json({ success: true, clients: rows, total: count, page, limit });
  } catch (err) {
    next(err);
  }
};

const getClient = async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.id, {
      attributes: {
        include: [
          [
            Sequelize.literal(
              "(SELECT COALESCE(SUM(montant_total - montant_paye), 0) FROM debts WHERE debts.client_id = `Client`.`id` AND debts.statut = 'en_cours')"
            ),
            "solde_du",
          ],
        ],
      },
      include: [
        {
          model: Debt,
          as: "debts",
          order: [["created_at", "DESC"]],
        },
      ],
    });

    if (!client) {
      return res.status(404).json({ success: false, message: "Client introuvable." });
    }

    res.json({ success: true, client });
  } catch (err) {
    next(err);
  }
};

const createClient = async (req, res, next) => {
  try {
    const client = await Client.create(req.body);
    res.status(201).json({ success: true, client });
  } catch (err) {
    next(err);
  }
};

const updateClient = async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.id);

    if (!client) {
      return res.status(404).json({ success: false, message: "Client introuvable." });
    }

    await client.update(req.body);
    res.json({ success: true, client });
  } catch (err) {
    next(err);
  }
};

const deleteClient = async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.id);

    if (!client) {
      return res.status(404).json({ success: false, message: "Client introuvable." });
    }

    const debtCount = await Debt.count({ where: { client_id: client.id } });

    if (debtCount > 0) {
      return res.status(409).json({
        success: false,
        message: "Impossible de supprimer un client ayant des dettes enregistrées.",
      });
    }

    await client.destroy();
    res.json({ success: true, message: "Client supprimé." });
  } catch (err) {
    next(err);
  }
};

module.exports = { listClients, getClient, createClient, updateClient, deleteClient };
