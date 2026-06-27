const { Op } = require("sequelize");
const { sequelize, Client, Debt, DebtPayment } = require("../models");

const MAX_LIMIT = 100;

const listDebts = async (req, res, next) => {
  try {
    const { statut, client_id, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const where = {};
    if (statut) where.statut = statut;
    if (client_id) where.client_id = Number(client_id);

    const clientWhere = search
      ? { nom: { [Op.like]: `%${search.trim()}%` } }
      : {};

    const { count, rows } = await Debt.findAndCountAll({
      where,
      include: [
        {
          model: Client,
          as: "client",
          attributes: ["id", "nom", "telephone"],
          where: clientWhere,
          required: Boolean(search),
        },
      ],
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    const debts = rows.map((d) => ({
      ...d.toJSON(),
      montant_restant: Math.max(
        0,
        Number(d.montant_total) - Number(d.montant_paye)
      ),
    }));

    res.json({ success: true, debts, total: count, page, limit });
  } catch (err) {
    next(err);
  }
};

const getDebt = async (req, res, next) => {
  try {
    const debt = await Debt.findByPk(req.params.id, {
      include: [
        { model: Client, as: "client", attributes: ["id", "nom", "telephone", "email"] },
        {
          model: DebtPayment,
          as: "payments",
          order: [["date_paiement", "DESC"]],
        },
      ],
    });

    if (!debt) {
      return res.status(404).json({ success: false, message: "Dette introuvable." });
    }

    res.json({
      success: true,
      debt: {
        ...debt.toJSON(),
        montant_restant: Math.max(0, Number(debt.montant_total) - Number(debt.montant_paye)),
      },
    });
  } catch (err) {
    next(err);
  }
};

const createDebt = async (req, res, next) => {
  try {
    const { client_id, sale_receipt_id, montant_total, notes } = req.body;

    const client = await Client.findByPk(client_id);
    if (!client) {
      return res.status(404).json({ success: false, message: "Client introuvable." });
    }

    const debt = await Debt.create({
      client_id,
      sale_receipt_id: sale_receipt_id || null,
      montant_total,
      montant_paye: 0,
      statut: "en_cours",
      notes: notes || null,
      created_by: req.user.id,
    });

    res.status(201).json({ success: true, debt });
  } catch (err) {
    next(err);
  }
};

const addPayment = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const debt = await Debt.findByPk(req.params.id, {
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!debt) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Dette introuvable." });
    }

    if (debt.statut !== "en_cours") {
      await t.rollback();
      return res.status(409).json({
        success: false,
        message: "Impossible d'ajouter un paiement : la dette est déjà soldée ou annulée.",
      });
    }

    const montant_restant = Number(debt.montant_total) - Number(debt.montant_paye);
    const montant = Number(req.body.montant);

    if (montant > montant_restant + 0.005) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `Le paiement (${montant}) dépasse le solde restant (${montant_restant.toFixed(2)}).`,
      });
    }

    const payment = await DebtPayment.create(
      {
        debt_id: debt.id,
        montant,
        mode_paiement: req.body.mode_paiement || "Cash",
        date_paiement: req.body.date_paiement,
        note: req.body.note || null,
        created_by: req.user.id,
      },
      { transaction: t }
    );

    const new_montant_paye = Number(debt.montant_paye) + montant;
    const new_statut =
      new_montant_paye >= Number(debt.montant_total) - 0.005 ? "remboursee" : "en_cours";

    await debt.update(
      { montant_paye: new_montant_paye, statut: new_statut },
      { transaction: t }
    );

    await t.commit();

    res.status(201).json({
      success: true,
      payment,
      debt: {
        ...debt.toJSON(),
        montant_paye: new_montant_paye,
        statut: new_statut,
        montant_restant: Math.max(0, Number(debt.montant_total) - new_montant_paye),
      },
    });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

const updateDebt = async (req, res, next) => {
  try {
    const debt = await Debt.findByPk(req.params.id);

    if (!debt) {
      return res.status(404).json({ success: false, message: "Dette introuvable." });
    }

    const updates = {};
    if (req.body.notes !== undefined) updates.notes = req.body.notes;
    if (req.body.statut) {
      if (req.body.statut === "remboursee" && Number(debt.montant_paye) < Number(debt.montant_total) - 0.005) {
        return res.status(400).json({
          success: false,
          message: "Impossible de marquer comme remboursée : le montant payé est insuffisant.",
        });
      }
      updates.statut = req.body.statut;
    }

    await debt.update(updates);
    res.json({ success: true, debt });
  } catch (err) {
    next(err);
  }
};

const deleteDebt = async (req, res, next) => {
  try {
    const debt = await Debt.findByPk(req.params.id);

    if (!debt) {
      return res.status(404).json({ success: false, message: "Dette introuvable." });
    }

    if (Number(debt.montant_paye) > 0) {
      return res.status(409).json({
        success: false,
        message: "Impossible de supprimer une dette avec des paiements enregistrés.",
      });
    }

    await debt.destroy();
    res.json({ success: true, message: "Dette supprimée." });
  } catch (err) {
    next(err);
  }
};

module.exports = { listDebts, getDebt, createDebt, addPayment, updateDebt, deleteDebt };
