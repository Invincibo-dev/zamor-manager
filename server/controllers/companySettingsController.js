const CompanySettings = require("../models/CompanySettings");

const DEFAULTS = {
  name: "Zamor Multi Services Acces",
  address: "Sèka la source, kole ak antèn Digicel lan",
  phone: "+1 (267) 254-4284 / +509 3217-2809",
  logo_data: null,
};

const getOrCreate = () =>
  CompanySettings.findOrCreate({ where: { id: 1 }, defaults: DEFAULTS });

const getCompanySettings = async (_req, res, next) => {
  try {
    const [settings] = await getOrCreate();
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    next(error);
  }
};

const updateCompanySettings = async (req, res, next) => {
  try {
    const { name, address, phone } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Le nom de l'entreprise est requis.",
      });
    }

    if (name.trim().length > 200) {
      return res.status(400).json({
        success: false,
        message: "Le nom ne peut pas dépasser 200 caractères.",
      });
    }

    if (phone && phone.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Le numéro de téléphone est trop long.",
      });
    }

    const [settings] = await getOrCreate();

    const exchangeRate = req.body.exchange_rate
      ? parseFloat(req.body.exchange_rate)
      : null;

    if (exchangeRate !== null && (isNaN(exchangeRate) || exchangeRate <= 0)) {
      return res.status(400).json({
        success: false,
        message: "Le taux de change doit être un nombre positif.",
      });
    }

    const updates = {
      name: name.trim(),
      address: address ? address.trim() : "",
      phone: phone ? phone.trim() : "",
      ...(exchangeRate !== null ? { exchange_rate: exchangeRate } : {}),
    };

    if (req.file) {
      // Convertit le fichier en mémoire en data URL persistable en base
      const base64 = req.file.buffer.toString("base64");
      updates.logo_data = `data:${req.file.mimetype};base64,${base64}`;
    }

    await settings.update(updates);

    return res.status(200).json({ success: true, settings });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCompanySettings, updateCompanySettings };
