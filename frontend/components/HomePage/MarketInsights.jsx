import { useEffect, useState } from "react";

import "../../commonPages/csss/HomePage/MarketInsights.css";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  CartesianGrid,
} from "recharts";

const cropColors = [
  "#064E3B",
  "#0B7653",
  "#10B981",
  "#72CFA9",
  "#B8CEC4",
];

const districtColors = [
  "#064E3B",
  "#10B981",
  "#F59E0B",
  "#95D3BA",
];

export default function MarketInsights() {

  const [topCrops, setTopCrops] = useState([]);

  const [topDistricts, setTopDistricts] = useState([]);

  const [successfulOrders, setSuccessfulOrders] = useState([]);

  const [loading, setLoading] = useState(true);


  useEffect(() => {

    const loadMarketInsights = async () => {

      try {

        const response = await fetch(
          "/backend/Apis/get_market_insights.php"
        );

        const result = await response.json();

        if (result.success) {

          setTopCrops(result.data.topCrops || []);

          setTopDistricts(
            (result.data.topDistricts || []).map((item) => ({
              name: item.district,
              value: Number(item.listings),
              percentage: item.percentage,
            }))
          );

          setSuccessfulOrders(
            (result.data.successfulOrders || []).map((item) => ({
              week: item.week,
              value: Number(item.orders),
            }))
          );

        }

      } catch (error) {

        console.error(
          "Failed to load market insights:",
          error
        );

      } finally {

        setLoading(false);

      }

    };

    loadMarketInsights();

  }, []);


  /*
   * Largest crop quantity becomes 100%.
   * Other progress bars are relative to it.
   */
  const highestQuantity =
    topCrops.length > 0
      ? Math.max(
          ...topCrops.map((crop) =>
            Number(crop.quantity)
          )
        )
      : 1;


  return (
    <section className="market-insights">

      <div className="market-container">

        <div className="market-header">

          <div>

            <h2>Live Market Insights</h2>

            <p>
              Data-driven decisions for farmers and buyers.
            </p>

          </div>

        </div>


        <div className="insights-grid">

          {/* =================================
              TOP AVAILABLE CROPS
          ================================= */}

          <div className="insight-card">

            <h3>Top Available Crops (kg)</h3>

            {loading ? (

              <p>Loading...</p>

            ) : (

              <div className="demand-list">

                {topCrops.map((item, index) => {

                  const percentage =
                    highestQuantity > 0
                      ? (
                          Number(item.quantity) /
                          highestQuantity
                        ) * 100
                      : 0;

                  return (

                    <div
                      className="demand-row"
                      key={item.crop}
                    >

                      <span className="crop-name">
                        {item.crop}
                      </span>


                      <div className="demand-track">

                        <div
                          className="demand-fill"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor:
                              cropColors[
                                index % cropColors.length
                              ],
                          }}
                        />

                      </div>


                      <span className="demand-value">
                        {Number(
                          item.quantity
                        ).toLocaleString()}kg
                      </span>

                    </div>

                  );

                })}

              </div>

            )}

          </div>


          {/* =================================
              TOP DISTRICTS
          ================================= */}

          <div className="insight-card farmer-card">

            <h3>Top Farmer Distribution</h3>


            <div className="farmer-chart-wrapper">

              <ResponsiveContainer
                width="100%"
                height={190}
              >

                <PieChart>

                  {/* Decorative outer circle */}

                  <Pie
                    data={[
                      {
                        name: "Total",
                        value: 100,
                      },
                    ]}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={76}
                    outerRadius={78}
                    stroke="none"
                    fill="#E5E7EB"
                    isAnimationActive={false}
                  />


                  {/* District donut */}

                  <Pie
                    data={topDistricts}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={66}
                    paddingAngle={2}
                    stroke="none"
                  >

                    {topDistricts.map(
                      (item, index) => (

                        <Cell
                          key={item.name}
                          fill={
                            districtColors[
                              index %
                                districtColors.length
                            ]
                          }
                        />

                      )
                    )}

                  </Pie>

                  <Tooltip />

                </PieChart>

              </ResponsiveContainer>


              <div className="donut-center">

                <strong>Top 4</strong>

                <span>Districts</span>

              </div>

            </div>


            <div className="farmer-legend">

              {topDistricts.map(
                (item, index) => (

                  <div
                    className="farmer-legend-item"
                    key={item.name}
                  >

                    <span
                      className="legend-dot"
                      style={{
                        backgroundColor:
                          districtColors[
                            index %
                              districtColors.length
                          ],
                      }}
                    />


                    <div>

                      <span className="district-name">
                        {item.name}
                      </span>

                      <span className="district-value">
                        {item.percentage}%
                      </span>

                    </div>

                  </div>

                )
              )}

            </div>

          </div>


          {/* =================================
              SUCCESSFUL ORDERS
          ================================= */}

          <div className="insight-card volume-card">

            <h3>
              Successful Orders (30 Days)
            </h3>

            <div className="volume-chart">

              <ResponsiveContainer
                width="100%"
                height={220}
              >

                <LineChart
                  data={successfulOrders}
                  margin={{
                    top: 15,
                    right: 10,
                    bottom: 0,
                    left: 0,
                  }}
                >

                  <CartesianGrid
                    stroke="#EEF2F1"
                    strokeDasharray="3 3"
                    vertical={true}
                  />

                  <XAxis
                    dataKey="week"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#64748B",
                      fontSize: 11,
                      fontFamily: "Inter",
                    }}
                    interval={0}
                  />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#064E3B"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: "#10B981",
                      stroke: "#FFFFFF",
                      strokeWidth: 2,
                    }}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}