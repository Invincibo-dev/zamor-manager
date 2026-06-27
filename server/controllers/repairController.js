const { Op } = require("sequelize");

const { sequelize, Repair, Phone, User } = require("../models");

const repairInclude = [
  {
    model: Phone,
    as: "phone",
    attributes: ["id", "imei", "modele", "couleur", "statut"],
    required: false,
  },
  {
    model: User,
    as: "creator",
    attributes: ["id", "name"],
  },
];

const listRepairs = async (req, res, next) => {
  try {
    const { statut, search, page = 1, limit = 50 } = req.query;

    const where = {};

    if (statut && ["en_attente", "en_cours", "termine", "livre"].includes(statut)) {
      where.statut = statut;
    }

    if (search && search.trim()) {
      where[Op.or] = [
        { ticket: { [Op.like]: `%${search.trim()}%` } },
        { client_nom: { [Op.like]: `%${search.trim()}%` } },
        { phone_description: { [Op.like]: `%${search.trim()}%` } },
        { panne: { [Op.like]: `%${search.trim()}%` } },
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await Repair.findAndCountAll({
      where,
      include: repairInclude,
      order: [["created_at", "DESC"]],
      limit: Math.min(Number(limit), 200),
      offset,
    });

    return res.status(200).json({
      success: true,
      total: count,
      page: Number(page),
      repairs: rows,
    });
  } catch (error) {
    next(error);
  }
};

const getRepair = async (req, res, next) => {
  try {
    const repair = await Repair.findByPk(req.params.id, { include: repairInclude });

    if (!repair) {
      return res.status(404).json({ success: false, message: "Réparation introuvable." });
    }

    return res.status(200).json({ success: true, repair });
  } catch (error) {
    next(error);
  }
};

const createRepair = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      client_nom,
      client_telephone,
      phone_id,
      phone_description,
      panne,
      cout_estimation,
      date_depot,
      date_livraison_estimee,
      notes,
    } = req.body;

    if (phone_id) {
      const phone = await Phone.findByPk(Number(phone_id), {
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      if (!phone) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: "Téléphone introuvable." });
      }

      if (phone.statut !== "disponible") {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          message: `Le téléphone "${phone.imei}" n'est pas disponible (statut: ${phone.statut}).`,
        });
      }

      await phone.update({ statut: "en_reparation" }, { transaction });
    }

    // Créer avec ticket temporaire, puis mettre à jour avec l'ID réel
    const repair = await Repair.create(
      {
        ticket: "PENDING",
        client_nom,
        client_telephone: client_telephone || null,
        phone_id: phone_id ? Number(phone_id) : null,
        phone_description: phone_description || null,
        panne,
        cout_estimation: cout_estimation ?? null,
        cout_final: null,
        statut: "en_attente",
        date_depot,
        date_livraison_estimee: date_livraison_estimee || null,
        notes: notes || null,
        created_by: req.user.id,
      },
      { transaction }
    );

    const year = new Date(date_depot).getFullYear();
    const ticket = `REP-${year}-${String(repair.id).padStart(4, "0")}`;
    await repair.update({ ticket }, { transaction });

    await transaction.commit();

    const created = await Repair.findByPk(repair.id, { include: repairInclude });

    return res.status(201).json({ success: true, repair: created });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

const updateRepair = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const repair = await Repair.findByPk(req.params.id, {
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    if (!repair) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Réparation introuvable." });
    }

    const oldStatut = repair.statut;
    const newStatut = req.body.statut || oldStatut;

    await repair.update(req.body, { transaction });

    // Remettre le téléphone en disponible une fois livré
    if (repair.phone_id && newStatut === "livre" && oldStatut !== "livre") {
      const phone = await Phone.findByPk(repair.phone_id, { transaction });

      if (phone && phone.statut === "en_reparation") {
        await phone.update({ statut: "disponible" }, { transaction });
      }
    }

    await transaction.commit();

    const updated = await Repair.findByPk(repair.id, { include: repairInclude });

    return res.status(200).json({ success: true, repair: updated });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

const deleteRepair = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const repair = await Repair.findByPk(req.params.id, {
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    if (!repair) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Réparation introuvable." });
    }

    if (repair.statut !== "en_attente") {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: "Seules les réparations en attente peuvent être supprimées.",
      });
    }

    if (repair.phone_id) {
      const phone = await Phone.findByPk(repair.phone_id, { transaction });

      if (phone && phone.statut === "en_reparation") {
        await phone.update({ statut: "disponible" }, { transaction });
      }
    }

    await repair.destroy({ transaction });
    await transaction.commit();

    return res.status(200).json({ success: true });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

module.exports = { listRepairs, getRepair, createRepair, updateRepair, deleteRepair };
