const { Op, fn, col, literal, QueryTypes } = require("sequelize");
const { sequelize, SaleReceipt, User, Product } = require("../models");
const { mysqlPool } = require("../config/database");

const buildRange = (start, end) => ({
  [Op.between]: [`${start} 00:00:00`, `${end} 23:59:59`],
});

const sumReceipts = (where) =>
  SaleReceipt.findOne({
    where,
    attributes: [
      [fn("COALESCE", fn("SUM", col("total_general")), 0), "total"],
      [fn("COUNT", col("id")), "nombre"],
    ],
    raw: true,
  });

const getDashboard = async (_req, res, next) => {
  try {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const year = now.getFullYear();
    const month0 = now.getMonth();

    // Mois courant
    const monthStartStr = `${year}-${String(month0 + 1).padStart(2, "0")}-01`;
    const monthEndStr = new Date(year, month0 + 1, 0).toISOString().slice(0, 10);

    // Mois précédent
    const prevMonthDate = new Date(year, month0 - 1, 1);
    const prevMonthStartStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}-01`;
    const prevMonthEndStr = new Date(year, month0, 0).toISOString().slice(0, 10);

    // Semaine courante (lun–dim)
    const dayOfWeek = now.getDay();
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStartDate = new Date(now);
    weekStartDate.setDate(now.getDate() + diffToMon);
    const weekStartStr = weekStartDate.toISOString().slice(0, 10);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    const weekEndStr = weekEndDate.toISOString().slice(0, 10);

    // Semaine précédente
    const prevWeekStartDate = new Date(weekStartDate);
    prevWeekStartDate.setDate(weekStartDate.getDate() - 7);
    const prevWeekStartStr = prevWeekStartDate.toISOString().slice(0, 10);
    const prevWeekEndDate = new Date(weekEndDate);
    prevWeekEndDate.setDate(weekEndDate.getDate() - 7);
    const prevWeekEndStr = prevWeekEndDate.toISOString().slice(0, 10);

    // Année
    const yearStartStr = `${year}-01-01`;
    const yearEndStr = `${year}-12-31`;

    // Graphiques
    const d7Date = new Date(now);
    d7Date.setDate(now.getDate() - 6);
    const d7Str = d7Date.toISOString().slice(0, 10);

    const d30Date = new Date(now);
    d30Date.setDate(now.getDate() - 29);
    const d30Str = d30Date.toISOString().slice(0, 10);

    const d12mDate = new Date(year, month0 - 11, 1);
    const d12mStr = d12mDate.toISOString().slice(0, 10);

    const [
      ventesJour,
      ventesSemaine,
      ventesMois,
      ventesAnnee,
      prevSemaine,
      prevMois,
      beneficeRow,
      stockTotal,
      alertes,
      chart7j,
      chart30j,
      chart12m,
      paymentBreakdown,
      topSellers,
      recentSales,
    ] = await Promise.all([
      sumReceipts({ date: buildRange(todayStr, todayStr) }),
      sumReceipts({ date: buildRange(weekStartStr, weekEndStr) }),
      sumReceipts({ date: buildRange(monthStartStr, monthEndStr) }),
      sumReceipts({ date: buildRange(yearStartStr, yearEndStr) }),
      sumReceipts({ date: buildRange(prevWeekStartStr, prevWeekEndStr) }),
      sumReceipts({ date: buildRange(prevMonthStartStr, prevMonthEndStr) }),

      // Bénéfice mois : somme (prix_unitaire - prix_achat) * quantite sur les items du mois
      sequelize
        .query(
          `SELECT COALESCE(SUM((ri.prix_unitaire - ri.prix_achat) * ri.quantite), 0) AS benefice
           FROM receipt_items ri
           INNER JOIN sale_receipts sr ON ri.receipt_id = sr.id
           WHERE sr.date BETWEEN :start AND :end
             AND ri.prix_achat IS NOT NULL`,
          {
            replacements: {
              start: `${monthStartStr} 00:00:00`,
              end: `${monthEndStr} 23:59:59`,
            },
            type: QueryTypes.SELECT,
          }
        )
        .then((rows) => rows[0] || { benefice: 0 }),

      // Stock total
      Product.findOne({
        attributes: [[fn("COALESCE", fn("SUM", col("quantite_stock")), 0), "total"]],
        raw: true,
      }),

      // Produits en alerte (quantite_stock <= seuil_alerte)
      Product.findAll({
        where: literal("quantite_stock <= seuil_alerte"),
        attributes: ["id", "nom", "quantite_stock", "seuil_alerte"],
        order: [["quantite_stock", "ASC"]],
        raw: true,
      }),

      // Graphique 7 jours
      SaleReceipt.findAll({
        where: { date: { [Op.gte]: `${d7Str} 00:00:00` } },
        attributes: [
          [fn("DATE", col("date")), "day"],
          [fn("COUNT", col("id")), "nombre_ventes"],
          [fn("COALESCE", fn("SUM", col("total_general")), 0), "total"],
        ],
        group: [fn("DATE", col("date"))],
        order: [[fn("DATE", col("date")), "ASC"]],
        raw: true,
      }),

      // Graphique 30 jours
      SaleReceipt.findAll({
        where: { date: { [Op.gte]: `${d30Str} 00:00:00` } },
        attributes: [
          [fn("DATE", col("date")), "day"],
          [fn("COUNT", col("id")), "nombre_ventes"],
          [fn("COALESCE", fn("SUM", col("total_general")), 0), "total"],
        ],
        group: [fn("DATE", col("date"))],
        order: [[fn("DATE", col("date")), "ASC"]],
        raw: true,
      }),

      // Graphique 12 mois
      SaleReceipt.findAll({
        where: { date: buildRange(d12mStr, todayStr) },
        attributes: [
          [fn("DATE_FORMAT", col("date"), "%Y-%m"), "month"],
          [fn("COUNT", col("id")), "nombre_ventes"],
          [fn("COALESCE", fn("SUM", col("total_general")), 0), "total"],
        ],
        group: [fn("DATE_FORMAT", col("date"), "%Y-%m")],
        order: [[fn("DATE_FORMAT", col("date"), "%Y-%m"), "ASC"]],
        raw: true,
      }),

      // Répartition paiements ce mois
      SaleReceipt.findAll({
        where: { date: buildRange(monthStartStr, monthEndStr) },
        attributes: [
          "mode_paiement",
          [fn("COUNT", col("id")), "nombre_ventes"],
          [fn("COALESCE", fn("SUM", col("total_general")), 0), "total"],
        ],
        group: ["mode_paiement"],
        raw: true,
      }),

      // Top vendeurs ce mois
      SaleReceipt.findAll({
        where: { date: buildRange(monthStartStr, monthEndStr) },
        attributes: [
          "vendeur_id",
          [fn("COUNT", col("SaleReceipt.id")), "nombre_ventes"],
          [fn("COALESCE", fn("SUM", col("total_general")), 0), "total"],
        ],
        include: [{ model: User, as: "vendeur", attributes: ["id", "name"] }],
        group: ["vendeur_id", "vendeur.id", "vendeur.name"],
        order: [[fn("SUM", col("total_general")), "DESC"]],
        limit: 5,
        subQuery: false,
      }),

      // Ventes récentes
      SaleReceipt.findAll({
        include: [{ model: User, as: "vendeur", attributes: ["id", "name"] }],
        order: [
          ["date", "DESC"],
          ["id", "DESC"],
        ],
        limit: 10,
      }),
    ]);

    // ─── Stats services (Natcash + Recharges) ────────────────────────────────
    const serviceStats = await (async () => {
      try {
        const [[natDay]] = await mysqlPool.query(
          `SELECT COUNT(*) AS count, COALESCE(SUM(amount),0) AS total FROM natcash_transactions WHERE DATE(created_at)=?`,
          [todayStr]
        );
        const [[natMonth]] = await mysqlPool.query(
          `SELECT COUNT(*) AS count, COALESCE(SUM(amount),0) AS total FROM natcash_transactions WHERE created_at BETWEEN ? AND ?`,
          [`${monthStartStr} 00:00:00`, `${monthEndStr} 23:59:59`]
        );
        const [natByType] = await mysqlPool.query(
          `SELECT service_type, COUNT(*) AS count, COALESCE(SUM(amount),0) AS total FROM natcash_transactions WHERE created_at BETWEEN ? AND ? GROUP BY service_type`,
          [`${monthStartStr} 00:00:00`, `${monthEndStr} 23:59:59`]
        );
        const [[rchDay]] = await mysqlPool.query(
          `SELECT COUNT(*) AS count, COALESCE(SUM(amount),0) AS total FROM recharges WHERE DATE(created_at)=?`,
          [todayStr]
        );
        const [[rchMonth]] = await mysqlPool.query(
          `SELECT COUNT(*) AS count, COALESCE(SUM(amount),0) AS total FROM recharges WHERE created_at BETWEEN ? AND ?`,
          [`${monthStartStr} 00:00:00`, `${monthEndStr} 23:59:59`]
        );
        const [rchByCompany] = await mysqlPool.query(
          `SELECT company, COUNT(*) AS count, COALESCE(SUM(amount),0) AS total FROM recharges WHERE created_at BETWEEN ? AND ? GROUP BY company`,
          [`${monthStartStr} 00:00:00`, `${monthEndStr} 23:59:59`]
        );
        return {
          natcash_count_today: Number(natDay.count),
          natcash_amount_today: Number(natDay.total),
          natcash_count_month: Number(natMonth.count),
          natcash_amount_month: Number(natMonth.total),
          natcash_by_type: natByType,
          recharge_count_today: Number(rchDay.count),
          recharge_amount_today: Number(rchDay.total),
          recharge_count_month: Number(rchMonth.count),
          recharge_amount_month: Number(rchMonth.total),
          recharge_by_company: rchByCompany,
        };
      } catch {
        return null;
      }
    })();

    return res.status(200).json({
      success: true,
      kpi: {
        ventes_jour: {
          total: Number(ventesJour?.total || 0),
          nombre: Number(ventesJour?.nombre || 0),
        },
        ventes_semaine: {
          total: Number(ventesSemaine?.total || 0),
          nombre: Number(ventesSemaine?.nombre || 0),
        },
        ventes_mois: {
          total: Number(ventesMois?.total || 0),
          nombre: Number(ventesMois?.nombre || 0),
        },
        ventes_annee: {
          total: Number(ventesAnnee?.total || 0),
          nombre: Number(ventesAnnee?.nombre || 0),
        },
        prev_semaine: {
          total: Number(prevSemaine?.total || 0),
          nombre: Number(prevSemaine?.nombre || 0),
        },
        prev_mois: {
          total: Number(prevMois?.total || 0),
          nombre: Number(prevMois?.nombre || 0),
        },
        benefice_mois: Number(beneficeRow?.benefice || 0),
        stock_total: Number(stockTotal?.total || 0),
        alertes_count: alertes.length,
      },
      alertes,
      chart_7j: chart7j,
      chart_30j: chart30j,
      chart_12m: chart12m,
      payment_breakdown: paymentBreakdown,
      top_sellers: topSellers,
      recent_sales: recentSales,
      services: serviceStats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard };
