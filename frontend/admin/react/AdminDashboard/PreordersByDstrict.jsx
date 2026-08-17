import { useTranslation } from "react-i18next";

export default function PreordersByDistrict({
  districts = [],
}) {
  const { t } = useTranslation();

  const colors = [
    "#003527",
    "#006c49",
    "#10b981",
    "#8dd892",
  ];

  const maxOrders =
    districts.length > 0
      ? Math.max(
          ...districts.map((district) =>
            Number(district.orders ?? 0)
          )
        )
      : 0;

  return (
    <article className="admin-panel admin-district-card">

      <h2>
        {t(
          "admin.dashboard.preordersByDistrict"
        )}
      </h2>

      <div className="admin-district-list">

        {districts.length > 0 ? (

          districts.map(
            (district, index) => {

              const orders =
                Number(
                  district.orders ?? 0
                );

              const width =
                maxOrders > 0
                  ? (orders / maxOrders) * 100
                  : 0;

              return (
                <div
                  className="admin-district-row"
                  key={`${district.district}-${index}`}
                >

                  <div className="admin-district-info">

                    <span>
                      {district.district}
                    </span>

                    <span>
                      {orders}{" "}
                      {t("admin.dashboard.orderCount", { count: orders })}
                    </span>

                  </div>

                  <div className="admin-progress-track">

                    <div
                      className="admin-progress-fill"
                      style={{
                        width: `${width}%`,
                        backgroundColor:
                          colors[index] ??
                          colors[colors.length - 1],
                      }}
                    />

                  </div>

                </div>
              );
            }
          )

        ) : (

          <div className="admin-district-empty">
            {t("admin.dashboard.noPreorderData")}
          </div>

        )}

      </div>

    </article>
  );
}
