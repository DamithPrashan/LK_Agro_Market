import React from "react";
import "../csss/NotificationPanel.css";

function NotificationPanel({ show }) {
    if (!show) return null;

    return (
        <div className="notification-panel">

            <div className="notification-header">
                <h3>Notifications</h3>
                <span>Mark all read</span>
            </div>

            <div className="notification-item">
                <div className="icon success">✓</div>

                <div className="notification-content">
                    <h4>Reservation Accepted</h4>
                    <p>Your order #1001 has been accepted.</p>
                    <small>2 minutes ago</small>
                </div>

                <div className="dot green"></div>
            </div>

            <div className="notification-item">
                <div className="icon info">🔔</div>

                <div className="notification-content">
                    <h4>New Order Received</h4>
                    <p>You have received a new order request.</p>
                    <small>1 hour ago</small>
                </div>

                <div className="dot blue"></div>
            </div>

            <div className="notification-item">
                <div className="icon warning">💰</div>

                <div className="notification-content">
                    <h4>Payment Confirmed</h4>
                    <p>Payment received for order #998.</p>
                    <small>Yesterday</small>
                </div>

                <div className="dot orange"></div>
            </div>

            <div className="notification-footer">
                View all notifications
            </div>

        </div>
    );
}

export default NotificationPanel;