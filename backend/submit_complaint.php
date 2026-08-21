<?php
declare(strict_types=1);
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
require_once __DIR__ . '/connection/db.php';
require_once __DIR__ . '/Apis/auth_check.php';
require_once __DIR__ . '/services/order_resolver.php';
require_once __DIR__ . '/create_notification.php';
require_role('buyer');

const COMPLAINT_EVIDENCE_MAX_BYTES = 5242880;
function complaint_fail(int $status,string $message): never { http_response_code($status); echo json_encode(['success'=>false,'message'=>$message]); exit; }

function complaint_evidence_mime(string $path): ?string
{
    if (class_exists('finfo')) {
        $detector = new finfo(FILEINFO_MIME_TYPE);
        $mime = $detector->file($path);
        return is_string($mime) ? $mime : null;
    }
    $image = @getimagesize($path);
    if (is_array($image) && isset($image['mime'])) return (string)$image['mime'];
    $handle = @fopen($path, 'rb');
    if ($handle !== false) {
        $signature = fread($handle, 5);
        fclose($handle);
        if ($signature === '%PDF-') return 'application/pdf';
    }
    return null;
}

$reservationId=(int)($_POST['order_id']??0);
$reason=trim((string)($_POST['reason']??''));
$description=trim((string)($_POST['description']??''));
if($reservationId<=0||$reason===''||$description==='') complaint_fail(422,'Please fill in all required fields.');

$createdEvidence=null;
$failureStage='reservation resolution';
try {
    $pdo->beginTransaction();
    $order=resolve_order_snapshot($pdo,$reservationId,true);
    if(!$order||$order['buyer_user_id']!==(int)$_SESSION['user']['id']) throw new DomainException('Order not found or permission denied.');
    if(!in_array($order['reservation_status'],['confirmed','ready','completed'],true)
        ||($order['reservation_source']==='cultivation'&&$order['source_status']!=='accepted')) {
        throw new DomainException('This reservation is not eligible for a complaint.');
    }
    if ($reason === 'Harvest Delay' && $order['reservation_source'] === 'cultivation' && $order['timing_model'] === 'growing_period') {
        $eligible = $order['cultivation_started_at'] !== null
            && (int)$order['agreed_growing_period_days'] > 0
            && $order['estimated_harvest_date'] !== null
            && date('Y-m-d') > $order['estimated_harvest_date']
            && !in_array($order['reservation_status'], ['ready', 'completed'], true);
        if (!$eligible) throw new DomainException('This order is not yet eligible for a harvest-delay complaint.');
    }
    if ($reason === 'Cultivation Start Delay') {
        $eligible = $order['reservation_source'] === 'cultivation'
            && $order['timing_model'] === 'growing_period'
            && $order['planned_start_date'] !== null
            && date('Y-m-d') > $order['planned_start_date']
            && $order['cultivation_started_at'] === null;
        if (!$eligible) throw new DomainException('This order is not eligible for a cultivation-start-delay complaint.');
    }

    $evidencePath=null;
$failureStage='evidence validation';
    if(isset($_FILES['evidence'])) {
        $file=$_FILES['evidence'];
        if($file['error']!==UPLOAD_ERR_NO_FILE) {
            if($file['error']!==UPLOAD_ERR_OK) throw new DomainException('Evidence upload failed.');
            if((int)$file['size']<=0||(int)$file['size']>COMPLAINT_EVIDENCE_MAX_BYTES) throw new DomainException('Evidence must be 5 MB or smaller.');
            $extension=strtolower(pathinfo((string)$file['name'],PATHINFO_EXTENSION));
            $allowed=['jpg'=>'image/jpeg','jpeg'=>'image/jpeg','png'=>'image/png','pdf'=>'application/pdf'];
            $mime=complaint_evidence_mime($file['tmp_name']);
            if(!isset($allowed[$extension])||$mime!==$allowed[$extension]) throw new DomainException('Evidence must be a JPG, PNG, or PDF file.');
            $directory=__DIR__.'/uploads';
            if(!is_dir($directory)&&!mkdir($directory,0755,true)&&!is_dir($directory)) throw new RuntimeException('Unable to prepare evidence storage.');
            $filename='complaint_'.bin2hex(random_bytes(16)).'.'.$extension;
            $createdEvidence=$directory.DIRECTORY_SEPARATOR.$filename;
            if(!move_uploaded_file($file['tmp_name'],$createdEvidence)) throw new RuntimeException('Unable to store complaint evidence.');
            $evidencePath='backend/uploads/'.$filename;
        }
    }

$failureStage='complaint insertion';
    $insert=$pdo->prepare("INSERT INTO complaints(reservation_id,buyer_id,reason,description,evidence_file,status) VALUES(?,?,?,?,?,'submitted')");
    $insert->execute([$reservationId,$order['buyer_id'],$reason,$description,$evidencePath]);
    $complaintId=(int)$pdo->lastInsertId();
    $baseData=['complaint_id'=>$complaintId,'complaintId'=>$complaintId,'reservation_id'=>$reservationId,'orderId'=>$reservationId,
        'reservation_source'=>$order['reservation_source'],'crop_name'=>$order['crop_name'],'cropName'=>$order['crop_name']];
    $farmerData=$baseData+['link'=>'/farmer/complaints'];
    $farmerMessage="A buyer submitted a complaint for Order #{$reservationId} ({$order['crop_name']}). Reason: {$reason}.";
$failureStage='farmer notification';
    if(!create_notification($order['farmer_user_id'],'New Dispute Filed',$farmerMessage,'complaintSubmitted',json_encode($farmerData))) {
        throw new RuntimeException('Unable to notify the farmer.');
    }
    $admins=$pdo->query("SELECT user_id FROM user WHERE role='admin'")->fetchAll(PDO::FETCH_COLUMN);
$failureStage='administrator notification';
    foreach($admins as $adminUserId) {
        $adminData=$baseData+['link'=>'/admin/complaint/'.$complaintId];
        if(!create_notification((int)$adminUserId,'New Dispute Submitted',"Dispute #{$complaintId} opened for Order #{$reservationId}. Reason: {$reason}.",'complaintSubmitted',json_encode($adminData))) {
            throw new RuntimeException('Unable to notify administrators.');
        }
    }
$failureStage='transaction commit';
    $pdo->commit();
    echo json_encode(['success'=>true,'message'=>"Complaint submitted successfully. Dispute #{$complaintId} opened.",'complaint_id'=>$complaintId]);
} catch(DomainException $error) {
    if($pdo->inTransaction())$pdo->rollBack();
    if($createdEvidence&&is_file($createdEvidence))unlink($createdEvidence);
    complaint_fail(409,$error->getMessage());
} catch(Throwable $error) {
    if($pdo->inTransaction())$pdo->rollBack();
    if($createdEvidence&&is_file($createdEvidence))unlink($createdEvidence);
    error_log("Complaint submission failed during {$failureStage} for reservation {$reservationId}: ".$error->getMessage());
    complaint_fail(500,'Unable to submit complaint.');
}
