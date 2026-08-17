import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiAlertTriangle, FiChevronLeft, FiChevronRight, FiPlus, FiSearch, FiTrash2, FiX } from "react-icons/fi";
import "../../csss/AdminDashboard/admin.css";

const initials = (name = "") => name.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase();
const formatDate = (value, locale) => value ? new Date(value).toLocaleDateString(locale) : "—";

export default function UserManagement() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "si" ? "si-LK" : i18n.language === "ta" ? "ta-LK" : "en-US";
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [warningUser, setWarningUser] = useState(null);
  const [warningMessage, setWarningMessage] = useState("");
  const [warningError, setWarningError] = useState("");
  const [sendingWarning, setSendingWarning] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    fetch("/backend/Apis/admin/userManagement/getUsers.php", { credentials: "include" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok || !body.success) throw new Error(t("admin.users.errors.load", { defaultValue: body.message }));
        setUsers(body.users || []);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [t]);

  const filteredUsers = useMemo(() => users.filter((user) => {
    const term = search.trim().toLowerCase();
    const searchMatch = !term || [user.name, user.email, user.district].some((value) => String(value || "").toLowerCase().includes(term));
    return searchMatch && (roleFilter === "all" || user.role === roleFilter) && (statusFilter === "all" || user.status === statusFilter);
  }), [users, search, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  const resetPage = (setter, value) => { setter(value); setCurrentPage(1); };

  const openWarning = (user) => {
    setWarningUser(user);
    setWarningMessage("");
    setWarningError("");
  };

  const sendWarning = async () => {
    if (warningMessage.trim().length < 10) return setWarningError(t("admin.users.errors.warningLength"));
    setSendingWarning(true);
    setWarningError("");
    try {
      const response = await fetch("/backend/Apis/admin/userManagement/sendWarning.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: warningUser.user_id, message: warningMessage.trim() }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(t("admin.users.errors.sendWarning", { defaultValue: body.message }));
      setNotice(t("admin.users.warningSent"));
      setWarningUser(null);
    } catch (requestError) {
      setWarningError(requestError.message);
    } finally {
      setSendingWarning(false);
    }
  };

  const requestRemoval = (user) => {
    if (!window.confirm(t("admin.users.removeConfirm", { name: user.name }))) return;
    setNotice(t("admin.users.removeUnavailable"));
  };

  return <div className="user-management-page">
    <section className="user-management-header"><div><h1>{t("admin.users.title")}</h1><p>{t("admin.users.subtitle")}</p></div><button type="button" className="user-add-btn" onClick={() => navigate("/register")}><FiPlus /> {t("admin.users.addUser")}</button></section>
    {error && <div className="user-management-notice error">{error}</div>}
    {notice && <div className="user-management-notice">{notice}</div>}

    <section className="user-filter-card">
      <div className="user-search-box"><FiSearch /><input type="text" placeholder={t("admin.users.searchPlaceholder")} value={search} onChange={(event) => resetPage(setSearch, event.target.value)} /></div>
      <div className="user-filter-group">
        <div className="user-filter-item"><label>{t("admin.users.role")}:</label><select value={roleFilter} onChange={(event) => resetPage(setRoleFilter, event.target.value)}><option value="all">{t("admin.users.allRoles")}</option><option value="farmer">{t("admin.users.roles.farmer")}</option><option value="buyer">{t("admin.users.roles.buyer")}</option><option value="admin">{t("admin.users.roles.admin")}</option></select></div>
        <div className="user-filter-item"><label>{t("admin.common.status")}:</label><select value={statusFilter} onChange={(event) => resetPage(setStatusFilter, event.target.value)}><option value="all">{t("admin.users.allStatus")}</option><option value="active">{t("admin.users.status.active")}</option><option value="inactive">{t("admin.users.status.inactive")}</option></select></div>
      </div>
    </section>

    <section className="user-table-card"><div className="user-table-scroll"><table className="user-management-table"><colgroup><col /><col /><col /><col /><col /><col /><col /></colgroup><thead><tr><th>{t("admin.users.user")}</th><th>{t("admin.users.role")}</th><th>{t("admin.common.district")}</th><th>{t("admin.users.joinedDate")}</th><th>{t("admin.common.status")}</th><th>{t("admin.common.priority")}</th><th>{t("admin.common.actions")}</th></tr></thead><tbody>
      {loading ? <tr><td colSpan="7" className="user-empty">{t("admin.users.loading")}</td></tr> : currentUsers.length ? currentUsers.map((user) => <tr key={user.user_id}>
        <td><div className="user-info"><div className={`user-management-avatar ${user.role}`}>{user.profile_image ? <img src={user.profile_image} alt={user.name} /> : initials(user.name)}</div><div><strong>{user.name}</strong><span>{user.email}</span></div></div></td>
        <td><span className={`user-role-badge ${user.role}`}>{t(`admin.users.roles.${user.role}`)}</span></td>
        <td className="user-muted">{user.district}</td><td className="user-muted">{formatDate(user.created_at, locale)}</td>
        <td><span className={`user-status-badge ${user.status}`}><span />{t(`admin.users.status.${user.status}`)}</span></td>
        <td><span className={`user-priority-badge ${user.priority}`}>{t(`admin.users.priority.${user.priority}`)}</span>{user.active_complaint_count > 0 && <small className="user-priority-detail">{t("admin.users.complaintSummary", { active: user.active_complaint_count, overdue: user.overdue_complaint_count })}</small>}</td>
        <td><div className="user-actions"><button type="button" className="user-warning-btn" title={user.priority === "normal" ? t("admin.users.noWarningRequired") : t("admin.users.issueWarning")} disabled={user.priority === "normal"} onClick={() => openWarning(user)}><FiAlertTriangle /></button><button type="button" className="user-delete-btn" title={t("admin.users.removeUser")} onClick={() => requestRemoval(user)}><FiTrash2 /></button></div></td>
      </tr>) : <tr><td colSpan="7" className="user-empty">{t("admin.users.empty")}</td></tr>}
    </tbody></table></div>
      <div className="user-pagination"><p>{t("admin.users.pagination", { from: filteredUsers.length ? startIndex + 1 : 0, to: Math.min(startIndex + itemsPerPage, filteredUsers.length), total: filteredUsers.length })}</p><div className="user-pages"><button type="button" aria-label={t("admin.common.previousPage")} disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}><FiChevronLeft /></button>{Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => <button type="button" key={page} className={page === currentPage ? "active" : ""} onClick={() => setCurrentPage(page)}>{page}</button>)}<button type="button" aria-label={t("admin.common.nextPage")} disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}><FiChevronRight /></button></div></div>
    </section>

    {warningUser && <div className="user-warning-backdrop"><section className="user-warning-modal" role="dialog" aria-modal="true"><header><div><h2>{t("admin.users.issueWarning")}</h2><p>{warningUser.name}</p></div><button type="button" aria-label={t("admin.common.close")} onClick={() => setWarningUser(null)}><FiX /></button></header><div className="user-warning-summary"><span><strong>{t("admin.users.activeComplaints")}</strong>{warningUser.active_complaint_count}</span><span><strong>{t("admin.users.priority.overdue")}</strong>{warningUser.overdue_complaint_count}</span><span><strong>{t("admin.users.nearestDeadline")}</strong>{formatDate(warningUser.nearest_response_deadline, locale)}</span></div><label>{t("admin.users.warningMessage")}<textarea rows="5" value={warningMessage} onChange={(event) => setWarningMessage(event.target.value)} placeholder={t("admin.users.warningPlaceholder")} /></label>{warningError && <p className="user-warning-error">{warningError}</p>}<footer><button type="button" className="cancel" disabled={sendingWarning} onClick={() => setWarningUser(null)}>{t("admin.common.cancel")}</button><button type="button" className="send" disabled={sendingWarning} onClick={sendWarning}>{sendingWarning ? t("admin.users.sending") : t("admin.users.sendWarning")}</button></footer></section></div>}
  </div>;
}
