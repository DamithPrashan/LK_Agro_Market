import {
  useEffect,
  useState,
} from "react";

import { useTranslation } from "react-i18next";

import StatCard from "./StatCard";
import DashboardCharts from "./DashboardCharts";
import PreordersByDistrict from "./PreordersByDstrict";
import CalendarSection from "./CalendarSection";

import { useAuth } from "../../../../src/context/AuthContext";

import {
  FiUser,
  FiShoppingCart,
  FiPackage,
  FiAlertCircle,
} from "react-icons/fi";

import "../../csss/AdminDashboard/admin.css";


export default function AdminDashboard() {

  const { user } = useAuth();
  const { t } = useTranslation();


  /* =========================================
     WELCOME MESSAGE
  ========================================= */

  const [isReturningAdmin, setIsReturningAdmin] = useState(false);


  /* =========================================
     DASHBOARD STAT CARDS
  ========================================= */

  const [stats, setStats] = useState({
    farmers: 0,
    buyers: 0,
    orders: 0,
    complaints: 0,
  });


  /* =========================================
     THIS WEEK SUMMARY
  ========================================= */

  const [weekSummary, setWeekSummary] =
    useState({
      newFarmers: 0,
      newBuyers: 0,
      transactions: 0,
      complaints: 0,
    });


  /* =========================================
     PRE-ORDERS BY DISTRICT
  ========================================= */

  const [
    preordersByDistrict,
    setPreordersByDistrict,
  ] = useState([]);


  /* =========================================
     ADMIN CALENDAR ACTIVITIES
  ========================================= */

  const [
    adminActivities,
    setAdminActivities,
  ] = useState([]);


  const [
    activityDates,
    setActivityDates,
  ] = useState([]);


  /* =========================================
     LOADING
  ========================================= */

  const [loading, setLoading] =
    useState(true);


  /* =========================================
     WELCOME MESSAGE
  ========================================= */

  useEffect(() => {

    if (!user) {
      return;
    }


    const key =
      `hasLoggedIn_${user.id}`;


    if (localStorage.getItem(key)) {

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsReturningAdmin(true);

    } else {

      setIsReturningAdmin(false);


      localStorage.setItem(
        key,
        "true"
      );

    }

  }, [user]);


  /* =========================================
     FETCH DASHBOARD DATA
     Reusable for calendar refresh
  ========================================= */

  const fetchDashboardData = async () => {

    try {

      setLoading(true);


      const response =
        await fetch(
          "/backend/Apis/admin/dashboardStats.php"
        );


      if (!response.ok) {

        throw new Error(
          `HTTP error: ${response.status}`
        );

      }


      const data =
        await response.json();


      console.log(
        "Admin dashboard data:",
        data
      );


      /* =================================
         STAT CARDS
      ================================= */

      setStats({

        farmers:
          Number(
            data.farmers ?? 0
          ),

        buyers:
          Number(
            data.buyers ?? 0
          ),

        orders:
          Number(
            data.orders ?? 0
          ),

        complaints:
          Number(
            data.complaints ?? 0
          ),

      });


      /* =================================
         WEEK SUMMARY
      ================================= */

      if (data.thisWeekSummary) {

        setWeekSummary({

          newFarmers:
            Number(
              data.thisWeekSummary
                .newFarmers ?? 0
            ),

          newBuyers:
            Number(
              data.thisWeekSummary
                .newBuyers ?? 0
            ),

          transactions:
            Number(
              data.thisWeekSummary
                .transactions ?? 0
            ),

          complaints:
            Number(
              data.thisWeekSummary
                .complaints ?? 0
            ),

        });

      } else {

        setWeekSummary({
          newFarmers: 0,
          newBuyers: 0,
          transactions: 0,
          complaints: 0,
        });

      }


      /* =================================
         PRE-ORDERS BY DISTRICT
      ================================= */

      if (
        Array.isArray(
          data.preordersByDistrict
        )
      ) {

        setPreordersByDistrict(
          data.preordersByDistrict
        );

      } else {

        setPreordersByDistrict([]);

      }


      /* =================================
         ADMIN ACTIVITIES
      ================================= */

      if (
        Array.isArray(
          data.adminActivities
        )
      ) {

        setAdminActivities(
          data.adminActivities
        );

      } else {

        setAdminActivities([]);

      }


      /* =================================
         ACTIVITY DATES
      ================================= */

      if (
        Array.isArray(
          data.activityDates
        )
      ) {

        setActivityDates(
          data.activityDates
        );

      } else {

        setActivityDates([]);

      }


    } catch (error) {

      console.error(
        "Dashboard stats error:",
        error
      );


    } finally {

      setLoading(false);

    }

  };


  /* =========================================
     INITIAL DASHBOARD FETCH
  ========================================= */

  useEffect(() => {

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboardData();

  }, []);


  return (

    <div className="admin-dashboard-content">


      {/* =====================================
          WELCOME
      ===================================== */}

      <section className="admin-welcome">

        <h1>
          {user && t(isReturningAdmin ? "admin.dashboard.welcomeBack" : "admin.dashboard.welcome", { name: user.name })}
        </h1>

        <p>
          {t(
            "admin.dashboard.monitorActivity"
          )}
        </p>

      </section>


      {/* =====================================
          STATISTICS
      ===================================== */}

      <section className="admin-stat-grid">


        {/* FARMERS */}

        <StatCard
          title={t(
            "admin.dashboard.stats.farmers"
          )}
          value={
            loading
              ? "..."
              : stats.farmers
          }
          icon={
            <FiUser />
          }
          iconType="farmer"
          footer={t("admin.dashboard.thisWeekIncrease", { count: 2 })}
          positive
        />


        {/* BUYERS */}

        <StatCard
          title={t(
            "admin.dashboard.stats.buyers"
          )}
          value={
            loading
              ? "..."
              : stats.buyers
          }
          icon={
            <FiShoppingCart />
          }
          iconType="buyer"
          footer={t("admin.dashboard.stable")}
        />


        {/* ORDERS */}

        <StatCard
          title={t(
            "admin.dashboard.stats.orders"
          )}
          value={
            loading
              ? "..."
              : stats.orders
          }
          icon={
            <FiPackage />
          }
          iconType="order"
          footer={t("admin.dashboard.vsLastMonth", { percent: 12 })}
          positive
        />


        {/* COMPLAINTS */}

        <StatCard
          title={t(
            "admin.dashboard.stats.complaints"
          )}
          value={
            loading
              ? "..."
              : stats.complaints
          }
          icon={
            <FiAlertCircle />
          }
          iconType="complaint"
          footer={
            Number(
              stats.complaints
            ) === 0
              ? t("admin.dashboard.noActiveIssues")
              : t("admin.dashboard.needsAttention")
          }
        />


      </section>


      {/* =====================================
          ANALYTICS
      ===================================== */}

      <section className="admin-analytics-grid">


        {/* THIS WEEK SUMMARY */}

        <DashboardCharts
          weekSummary={
            weekSummary
          }
        />


        {/* PRE-ORDERS BY DISTRICT */}

        <PreordersByDistrict
          districts={
            preordersByDistrict
          }
        />


      </section>


      {/* =====================================
          ADMIN CALENDAR
      ===================================== */}

      <CalendarSection
        activities={
          adminActivities
        }
        activityDates={
          activityDates
        }
        onRefresh={
          fetchDashboardData
        }
      />


    </div>

  );
}
