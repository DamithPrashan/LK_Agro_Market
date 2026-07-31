import { useTranslation } from "react-i18next";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from "recharts";

import "../../csss/AdminDashboard/charts.css";

function DashboardCharts(){
  const { t } = useTranslation();

  const data=[
    {
      name: t("admin.dashboard.newFarmers"),
      value: 7
    },
    {
      name: t("admin.dashboard.newBuyers"),
      value: 12
    },
    {
      name: t("admin.dashboard.transactions"),
      value: 34
    },
    {
      name: t("admin.dashboard.complaintsSummary"),
      value: 5
    }
  ];

  const colors=[
    "#4caf50",
    "#8bc34a",
    "#ffb74d",
    "#ef5350"
  ];

  return(
    <div className="chart-box">
      <h2>{t("admin.dashboard.thisWeekSummary")}</h2>

      <PieChart
        width={400}
        height={300}
      >
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={90}
          dataKey="value"
          label
        >
          {
            data.map((entry,index)=>(
              <Cell
                key={index}
                fill={colors[index]}
              />
            ))
          }
        </Pie>
        <Tooltip/>
        <Legend/>
      </PieChart>
    </div>
  )
}

export default DashboardCharts;