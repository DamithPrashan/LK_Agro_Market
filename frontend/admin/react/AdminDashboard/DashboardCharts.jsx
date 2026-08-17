import React from "react";
import { useTranslation } from "react-i18next";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export default function DashboardCharts({ weekSummary }) {
  const { t } = useTranslation();

  const data = [
    {
      name: t("admin.dashboard.newFarmers"),
      value: Number(weekSummary?.newFarmers ?? 0),
      color: "#006c49",
    },
    {
      name: t("admin.dashboard.newBuyers"),
      value: Number(weekSummary?.newBuyers ?? 0),
      color: "#8dd892",
    },
    {
      name: t("admin.dashboard.transactions"),
      value: Number(weekSummary?.transactions ?? 0),
      color: "#003527",
    },
    {
      name: t("admin.dashboard.complaintsSummary"),
      value: Number(weekSummary?.complaints ?? 0),
      color: "#ef5350",
    },
  ];

  const total = data.reduce(
    (sum, item) => sum + item.value,
    0
  );

  return (
    <article className="admin-panel admin-summary-card">

      <h2>
        {t("admin.dashboard.thisWeekSummary")}
      </h2>

      <div className="admin-donut-area">

        {/* =========================
            DONUT CHART
        ========================= */}

        <div className="admin-donut-wrapper">

          <ResponsiveContainer
            width="100%"
            height={210}
          >
            <PieChart>

              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={83}
                stroke="none"
              >

                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color}
                  />
                ))}

              </Pie>

              <Tooltip />

            </PieChart>
          </ResponsiveContainer>


          {/* CENTER TOTAL */}

          <div className="admin-donut-center">

            <span>
              Total
            </span>

            <strong>
              {total}
            </strong>

          </div>

        </div>


        {/* =========================
            LEGEND
        ========================= */}

        <div className="admin-summary-legend">

          {data.map((item) => (

            <div
              className="admin-summary-legend-row"
              key={item.name}
            >

              <div>

                <span
                  className="admin-legend-dot"
                  style={{
                    backgroundColor: item.color,
                  }}
                />

                <span>
                  {item.name}
                </span>

              </div>

              <strong>
                {item.value}
              </strong>

            </div>

          ))}

        </div>

      </div>

    </article>
  );
}