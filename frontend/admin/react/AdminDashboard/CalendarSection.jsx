import { useTranslation } from "react-i18next";
import Calendar from "react-calendar";
import "../../csss/AdminDashboard/calendar.css";

function CalendarSection(){
  const { t } = useTranslation();

  return(
    <div className="calendar-box">
      <h2>{t("admin.dashboard.schedule")}</h2>
      <Calendar/>
    </div>
  )
}

export default CalendarSection;