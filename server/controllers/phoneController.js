const { Op } = require("sequelize");

const { Phone, SaleReceipt, User } = require("../models");

const phoneInclude = [
  {
    model: SaleReceipt,
    as: "receipt",
    attributes: ["id", "code_recu", "date", "total_general"],
    required: false,
    include: [
      {
        model: User,
        as: "vendeur",
        attributes: ["id", "name"],
      },
    ],
  },
];

const listPhones = async (req, res, next) => {
  try {
    const { statut, search, page = 1, limit = 50 } = req.query;

    const where = {};

    if (statut && ["disponible", "vendu", "en_reparation"].includes(statut)) {
      where.statut = statut;
    }

    if (search && search.trim()) {
      where[Op.or] = [
        { imei: { [Op.like]: `%${search.trim()}%` } },
        { modele: { [Op.like]: `%${search.trim()}%` } },
        { couleur: { [Op.like]: `%${search.trim()}%` } },
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await Phone.findAndCountAll({
      where,
      include: phoneInclude,
      order: [["created_at", "DESC"]],
      limit: Math.min(Number(limit), 200),
      offset,
    });

    return res.status(200).json({
      success: true,
      total: count,
      page: Number(page),
      phones: rows,
    });
  } catch (error) {
    next(error);
  }
};

const getPhone = async (req, res, next) => {
  try {
    const phone = await Phone.findByPk(req.params.id, { include: phoneInclude });

    if (!phone) {
      return res.status(404).json({ success: false, message: "Téléphone introuvable." });
    }

    return res.status(200).json({ success: true, phone });
  } catch (error) {
    next(error);
  }
};

const createPhone = async (req, res, next) => {
  try {
    const { imei, modele, couleur, prix_achat, prix_vente, notes } = req.body;

    const existing = await Phone.findOne({ where: { imei } });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Un téléphone avec l'IMEI ${imei} existe déjà.`,
      });
    }

    const phone = await Phone.create({ imei, modele, couleur, prix_achat, prix_vente, notes });

    return res.status(201).json({ success: true, phone });
  } catch (error) {
    next(error);
  }
};

const updatePhone = async (req, res, next) => {
  try {
    const phone = await Phone.findByPk(req.params.id);

    if (!phone) {
      return res.status(404).json({ success: false, message: "Téléphone introuvable." });
    }

    await phone.update(req.body);

    return res.status(200).json({ success: true, phone });
  } catch (error) {
    next(error);
  }
};

const deletePhone = async (req, res, next) => {
  try {
    const phone = await Phone.findByPk(req.params.id);

    if (!phone) {
      return res.status(404).json({ success: false, message: "Téléphone introuvable." });
    }

    if (phone.statut !== "disponible") {
      return res.status(409).json({
        success: false,
        message: "Impossible de supprimer un téléphone vendu ou en réparation.",
      });
    }

    await phone.destroy();

    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

module.exports = { listPhones, getPhone, createPhone, updatePhone, deletePhone };
