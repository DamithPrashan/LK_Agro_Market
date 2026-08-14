<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

require_once 'connection/db.php';
require_once 'Apis/auth_check.php';

// Ensure user is logged in
require_login();

$user_id = $_SESSION['user']['id'];

// Fetch inputs
$reservation_id = isset($_POST['order_id']) ? intval($_POST['order_id']) : 0;
$reason = isset($_POST['reason']) ? trim($_POST['reason']) : '';
$description = isset($_POST['description']) ? trim($_POST['description']) : '';

if ($reservation_id === 0 || empty($reason) || empty($description)) {
    echo json_encode(["success" => false, "message" => "Please fill in all required fields."]);
    exit;
}

try {
    $pdo->beginTransaction();

    // 1. Get buyer_id for the logged-in user
    $buyerQuery = $pdo->prepare("SELECT buyer_id FROM buyer WHERE user_id = ?");
    $buyerQuery->execute([$user_id]);
    $buyer = $buyerQuery->fetch();
    
    if (!$buyer) {
        echo json_encode(["success" => false, "message" => "Invalid buyer account."]);
        $pdo->rollBack();
        exit;
    }
    
    $buyer_id = $buyer['buyer_id'];

    // 2. Validate that the reservation exists and belongs to the buyer
    $resQuery = $pdo->prepare("
        SELECT r.reservation_id, rc.buyer_id, c.farmer_id, u_farmer.user_id as farmer_user_id, c.crop_name
        FROM reservation r
        JOIN reserve_crop rc ON r.reserve_crop_id = rc.reserve_crop_id
        JOIN crop c ON rc.crop_id = c.crop_id
        JOIN farmer f ON c.farmer_id = f.farmer_id
        JOIN user u_farmer ON f.user_id = u_farmer.user_id
        WHERE r.reservation_id = ? AND rc.buyer_id = ?
    ");
    $resQuery->execute([$reservation_id, $buyer_id]);
    $reservation = $resQuery->fetch();

    if (!$reservation) {
        echo json_encode(["success" => false, "message" => "Order not found or permission denied."]);
        $pdo->rollBack();
        exit;
    }

    $farmer_user_id = $reservation['farmer_user_id'];
    $crop_name = $reservation['crop_name'];

    // 3. Handle evidence photo upload
    $evidence_path = null;
    if (isset($_FILES['evidence']) && $_FILES['evidence']['error'] === UPLOAD_ERR_OK) {
        $upload_dir = 'uploads/';
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0755, true);
        }
        
        $file_ext = pathinfo($_FILES['evidence']['name'], PATHINFO_EXTENSION);
        $file_name = 'complaint_' . time() . '_' . uniqid() . '.' . $file_ext;
        
        if (move_uploaded_file($_FILES['evidence']['tmp_name'], $upload_dir . $file_name)) {
            $evidence_path = 'backend/uploads/' . $file_name;
        }
    }

    // 4. Insert into complaints table
    $insertSql = "
        INSERT INTO complaints (reservation_id, buyer_id, reason, description, evidence_file, status) 
        VALUES (?, ?, ?, ?, ?, 'submitted')
    ";
    $insertStmt = $pdo->prepare($insertSql);
    $insertStmt->execute([
        $reservation_id,
        $buyer_id,
        $reason,
        $description,
        $evidence_path
    ]);
    
    $complaint_id = $pdo->lastInsertId();

    // 5. Trigger notifications (inserts into notifications table)
    require_once 'create_notification.php';
    $farmer_notif_data = json_encode([
        "complaint_id" => $complaint_id,
        "orderId" => $reservation_id,
        "link" => "farmer/complaints.php"
    ]);

    // Notify the Farmer
    $farmerMsg = "A buyer has submitted a complaint for Order #{$reservation_id} ({$crop_name}). Reason: {$reason}.";
    create_notification($farmer_user_id, 'New Dispute Filed', $farmerMsg, 'complaintSubmitted', $farmer_notif_data);

    // Notify all Admins
    $adminQuery = $pdo->query("SELECT user_id FROM user WHERE role = 'admin'");
    $admins = $adminQuery->fetchAll(PDO::FETCH_COLUMN);
    
    $admin_notif_data = json_encode([
        "complaint_id" => $complaint_id,
        "orderId" => $reservation_id,
        "link" => "admin/complaint/" . $complaint_id
    ]);

    $adminMsg = "Dispute #{$complaint_id} has been opened for Order #{$reservation_id}. Reason: {$reason}.";
    foreach ($admins as $admin_user_id) {
        create_notification($admin_user_id, 'New Dispute Submitted', $adminMsg, 'complaintSubmitted', $admin_notif_data);
    }

    $pdo->commit();

    echo json_encode([
        "success" => true,
        "message" => "Complaint submitted successfully. Dispute #{$complaint_id} opened.",
        "complaint_id" => $complaint_id
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>
