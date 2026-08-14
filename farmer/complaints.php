<?php
// farmer/complaints.php - Farmer Complaint Response UI
require_once __DIR__ . '/../backend/connection/db.php';
require_once __DIR__ . '/../backend/Apis/auth_check.php';

// Check farmer authentication
require_role('farmer');

$user_id = $_SESSION['user']['id'];
$farmer_name = $_SESSION['user']['name'] ?? 'Farmer';

// Fetch open complaints for crops belonging to this farmer (status = 'submitted')
$open_complaints = [];
try {
    $sql = "
        SELECT 
            c.id AS complaint_id,
            c.reservation_id,
            c.reason,
            c.description,
            c.evidence_file,
            c.status,
            c.created_at,
            u_buyer.name AS buyer_name,
            u_buyer.email AS buyer_email,
            cr.crop_name
        FROM complaints c
        JOIN reservation r ON c.reservation_id = r.reservation_id
        JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id
        JOIN crop cr ON rc.crop_id = cr.crop_id
        JOIN farmer f ON cr.farmer_id = f.farmer_id
        JOIN buyer b ON c.buyer_id = b.buyer_id
        JOIN user u_buyer ON b.user_id = u_buyer.user_id
        WHERE f.user_id = ? AND c.status = 'submitted'
        ORDER BY c.created_at DESC
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$user_id]);
    $open_complaints = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    $db_error = "Failed to load open complaints.";
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Open Complaints | Farmer Portal - LK Agro Market</title>
    <link rel="stylesheet" href="../frontend/farmer/csss/dashBoard.css">
    <style>
        .complaint-card {
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: var(--shadow-card);
            transition: border-color 0.2s ease;
        }
        .complaint-card:hover {
            border-color: #cbd5e1;
        }
        .complaint-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 1px dashed var(--color-border);
            padding-bottom: 14px;
            margin-bottom: 16px;
        }
        .complaint-header h3 {
            margin: 0;
            font-family: var(--font-display);
            font-size: 18px;
            color: var(--color-ink);
        }
        .complaint-header .badge {
            background: var(--color-gold-tint);
            color: #a97300;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            padding: 4px 12px;
            border-radius: 20px;
            border: 1px solid #fce7f3;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 12px;
            margin-bottom: 16px;
            font-size: 14px;
        }
        .info-item {
            color: var(--color-ink-muted);
        }
        .info-item strong {
            color: var(--color-ink);
        }
        .buyer-box {
            background: var(--color-bg);
            border-left: 4px solid var(--color-clay);
            padding: 14px 16px;
            border-radius: var(--radius-sm);
            margin-bottom: 20px;
        }
        .buyer-box p {
            margin: 4px 0;
            font-size: 14px;
        }
        .buyer-box .reason-tag {
            color: var(--color-clay);
            font-weight: 700;
        }
        .evidence-link {
            display: inline-block;
            margin-top: 8px;
            color: var(--color-primary);
            font-weight: 600;
            text-decoration: underline;
            font-size: 13px;
        }
        .response-form {
            background: #f8fafc;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            padding: 18px;
        }
        .response-form label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: var(--color-ink);
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.03em;
        }
        .response-form textarea {
            width: 100%;
            padding: 12px;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-sm);
            font-size: 14px;
            font-family: var(--font-body);
            resize: vertical;
            min-height: 90px;
            margin-bottom: 14px;
        }
        .response-form textarea:focus {
            outline: none;
            border-color: var(--color-primary);
            box-shadow: 0 0 0 3px var(--color-primary-tint);
        }
        .file-upload-wrap {
            margin-bottom: 16px;
        }
        .file-upload-wrap input[type="file"] {
            font-size: 13px;
        }
        .btn-submit-response {
            background: var(--color-primary);
            color: #ffffff;
            border: none;
            padding: 11px 24px;
            border-radius: var(--radius-sm);
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.15s ease;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        .btn-submit-response:hover:not(:disabled) {
            background: var(--color-primary-dark);
        }
        .btn-submit-response:disabled {
            opacity: 0.65;
            cursor: not-allowed;
        }
        .alert-msg {
            padding: 12px 16px;
            border-radius: var(--radius-sm);
            margin-bottom: 14px;
            font-size: 14px;
            font-weight: 600;
            display: none;
        }
        .alert-msg.error {
            background: var(--color-clay-tint);
            color: var(--color-clay);
            border: 1px solid #f5c2c2;
            display: block;
        }
        .alert-msg.success {
            background: var(--color-secondary-tint);
            color: var(--color-primary-dark);
            border: 1px solid #cce5d3;
            display: block;
        }
        .empty-state-card {
            background: var(--color-surface);
            border: 1px dashed var(--color-border);
            border-radius: var(--radius-lg);
            padding: 50px 20px;
            text-align: center;
            color: var(--color-ink-muted);
        }
        .empty-state-card svg {
            width: 48px;
            height: 48px;
            color: var(--color-border);
            margin-bottom: 12px;
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="content">
            <div class="page-header">
                <h1>Open Complaints</h1>
                <p>Review and respond to buyer disputes regarding crop reservations.</p>
            </div>

            <?php if (!empty($db_error)): ?>
                <div class="alert-msg error"><?= htmlspecialchars($db_error) ?></div>
            <?php endif; ?>

            <div id="complaints-list">
                <?php if (empty($open_complaints)): ?>
                    <div class="empty-state-card">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3>No open complaints right now.</h3>
                        <p>All crop disputes have been addressed.</p>
                    </div>
                <?php else: ?>
                    <?php foreach ($open_complaints as $c): ?>
                        <div class="complaint-card" id="complaint-card-<?= $c['complaint_id'] ?>">
                            <div class="complaint-header">
                                <div>
                                    <h3>Dispute #<?= htmlspecialchars($c['complaint_id']) ?> — Order #<?= htmlspecialchars($c['reservation_id']) ?> (<?= htmlspecialchars($c['crop_name']) ?>)</h3>
                                </div>
                                <span class="badge">Submitted</span>
                            </div>

                            <div class="info-grid">
                                <div class="info-item"><strong>Buyer Name:</strong> <?= htmlspecialchars($c['buyer_name']) ?></div>
                                <div class="info-item"><strong>Buyer Email:</strong> <?= htmlspecialchars($c['buyer_email']) ?></div>
                                <div class="info-item"><strong>Submitted On:</strong> <?= htmlspecialchars(date('M d, Y H:i', strtotime($c['created_at']))) ?></div>
                            </div>

                            <div class="buyer-box">
                                <p><strong>Reason:</strong> <span class="reason-tag"><?= htmlspecialchars($c['reason']) ?></span></p>
                                <p><strong>Buyer Description:</strong> "<?= htmlspecialchars($c['description']) ?>"</p>
                                <?php if (!empty($c['evidence_file'])): ?>
                                    <a class="evidence-link" href="/<?= htmlspecialchars($c['evidence_file']) ?>" target="_blank" rel="noopener noreferrer">📷 View Buyer Evidence File</a>
                                <?php endif; ?>
                            </div>

                            <div class="response-form">
                                <div id="alert-<?= $c['complaint_id'] ?>" class="alert-msg"></div>
                                <form onsubmit="submitFarmerResponse(event, <?= $c['complaint_id'] ?>)" enctype="multipart/form-data">
                                    <input type="hidden" name="complaint_id" value="<?= $c['complaint_id'] ?>">

                                    <label for="response_text_<?= $c['complaint_id'] ?>">Your Response <span style="color:red">*</span></label>
                                    <textarea 
                                        id="response_text_<?= $c['complaint_id'] ?>" 
                                        name="response_text" 
                                        required 
                                        minlength="10"
                                        placeholder="Provide detailed context regarding this dispute (min 10 characters)..."
                                    ></textarea>

                                    <div class="file-upload-wrap">
                                        <label for="evidence_<?= $c['complaint_id'] ?>">Attach Supporting Evidence (Optional - JPG, PNG, PDF <= 5MB)</label>
                                        <input 
                                            type="file" 
                                            id="evidence_<?= $c['complaint_id'] ?>" 
                                            name="evidence" 
                                            accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                                            onchange="validateFileSize(this)"
                                        >
                                    </div>

                                    <button type="submit" id="btn-<?= $c['complaint_id'] ?>" class="btn-submit-response">
                                        Submit Response
                                    </button>
                                </form>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <script>
        function validateFileSize(input) {
            if (input.files && input.files[0]) {
                const fileSizeMB = input.files[0].size / (1024 * 1024);
                if (fileSizeMB > 5) {
                    alert("File size exceeds 5MB limit. Please choose a smaller file.");
                    input.value = "";
                }
            }
        }

        async function submitFarmerResponse(event, complaintId) {
            event.preventDefault();
            const form = event.target;
            const submitBtn = document.getElementById(`btn-${complaintId}`);
            const alertBox = document.getElementById(`alert-${complaintId}`);

            alertBox.className = "alert-msg";
            alertBox.style.display = "none";
            alertBox.innerText = "";

            const responseText = form.querySelector('[name="response_text"]').value.trim();
            if (responseText.length < 10) {
                alertBox.className = "alert-msg error";
                alertBox.innerText = "Response text must be at least 10 characters long.";
                return;
            }

            const formData = new FormData(form);

            // Disable submit button and show loading indicator
            submitBtn.disabled = true;
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = `<span>Submitting...</span>`;

            try {
                const res = await fetch('../backend/farmer_respond.php', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });

                const data = await res.json();

                if (data.success) {
                    alertBox.className = "alert-msg success";
                    alertBox.innerText = data.message || "Response submitted successfully.";
                    
                    // Smoothly remove complaint card after short delay
                    setTimeout(() => {
                        const card = document.getElementById(`complaint-card-${complaintId}`);
                        if (card) {
                            card.style.transition = "opacity 0.4s ease, transform 0.4s ease";
                            card.style.opacity = "0";
                            card.style.transform = "translateY(-10px)";
                            setTimeout(() => {
                                card.remove();
                                const remainingCards = document.querySelectorAll('.complaint-card');
                                if (remainingCards.length === 0) {
                                    document.getElementById('complaints-list').innerHTML = `
                                        <div class="empty-state-card">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <h3>No open complaints right now.</h3>
                                            <p>All crop disputes have been addressed.</p>
                                        </div>
                                    `;
                                }
                            }, 400);
                        }
                    }, 800);
                } else {
                    alertBox.className = "alert-msg error";
                    alertBox.innerText = data.error || data.message || "Failed to submit response.";
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
            } catch (err) {
                console.error(err);
                alertBox.className = "alert-msg error";
                alertBox.innerText = "Network error. Please try again.";
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        }
    </script>
</body>
</html>
