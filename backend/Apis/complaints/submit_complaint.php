<?php
declare(strict_types=1);
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
require_once __DIR__ . '/../../connection/db.php';
require_once __DIR__ . '/../auth_check.php';
require_once __DIR__ . '/../../services/order_resolver.php';
require_once __DIR__ . '/../../services/complaint_evidence.php';
require_once __DIR__ . '/../../create_notification.php';
require_role('buyer');

function complaint_fail(int $status,string $message): never { http_response_code($status); echo json_encode(['success'=>false,'message'=>$message]); exit; }

$reservationId=(int)($_POST['order_id']??0);
$reason=trim((string)($_POST['reason']??''));
$description=trim((string)($_POST['description']??''));
if($reservationId<=0||$reason===''||$description==='') complaint_fail(422,'Please fill in all required fields.');
$allowedReasons=[
    'Crop quality does not match listing',
    'Wrong Quantity',
    'Damaged Product',
    'Misleading Listing or Agreement Information',
    'Payment or Order Status Issue',
    'Harvest Delay',
    'Cultivation Start Delay',
    'Other Platform Transaction Issue',
];
if(!in_array($reason,$allowedReasons,true)) complaint_fail(422,'Please select a supported platform complaint reason. Transportation disputes are outside LK Agro Market complaint-resolution scope.');

$createdEvidence=[];
$failureStage='reservation resolution';
try {
    $pdo->beginTransaction();
    $order=resolve_order_snapshot($pdo,$reservationId,true);
    if(!$order||$order['buyer_user_id']!==(int)$_SESSION['user']['id']) throw new DomainException('Order not found or permission denied.');
    if(!in_array($order['reservation_status'],['confirmed','ready','completed'],true)
        ||($order['reservation_source']==='cultivation'&&$order['source_status']!=='accepted')) {
        throw new DomainException('This reservation is not eligible for a complaint.');
    }
    $duplicate=$pdo->prepare("SELECT id FROM complaints WHERE reservation_id=? AND buyer_id=? AND status IN ('submitted','awaiting_farmer_response','under_review') LIMIT 1 FOR UPDATE");
    $duplicate->execute([$reservationId,$order['buyer_id']]);
    if($duplicate->fetchColumn()) throw new DomainException('An active complaint already exists for this order.');
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

    $evidencePath=null;$structured=[];$required=complaint_reason_requires_crop_photos($reason);
$failureStage='evidence validation';
    foreach(COMPLAINT_CROP_EVIDENCE_TYPES as $type){$file=$_FILES[$type]??null;if($required&&(!$file||($file['error']??UPLOAD_ERR_NO_FILE)===UPLOAD_ERR_NO_FILE))throw new DomainException('All three guided crop photos are required for this complaint reason.');if($file&&($file['error']??UPLOAD_ERR_NO_FILE)!==UPLOAD_ERR_NO_FILE){$structured[$type]=store_complaint_upload($file,'buyer_'.$type);$createdEvidence[]=$structured[$type]['absolute_path'];}}
    $doc=$_FILES['supporting_document']??null;if($doc&&($doc['error']??UPLOAD_ERR_NO_FILE)!==UPLOAD_ERR_NO_FILE){$structured['supporting_document']=store_complaint_upload($doc,'buyer_document');$createdEvidence[]=$structured['supporting_document']['absolute_path'];}

$failureStage='complaint insertion';
    $insert=$pdo->prepare("INSERT INTO complaints(reservation_id,buyer_id,reason,description,evidence_file,status) VALUES(?,?,?,?,?,'submitted')");
    $insert->execute([$reservationId,$order['buyer_id'],$reason,$description,$evidencePath]);
    $complaintId=(int)$pdo->lastInsertId();
    foreach($structured as$type=>$stored)insert_complaint_evidence($pdo,$complaintId,'buyer',$type,$stored);
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
    foreach($createdEvidence as$file)if(is_file($file))unlink($file);
    complaint_fail(409,$error->getMessage());
} catch(Throwable $error) {
    if($pdo->inTransaction())$pdo->rollBack();
    foreach($createdEvidence as$file)if(is_file($file))unlink($file);
    error_log("Complaint submission failed during {$failureStage} for reservation {$reservationId}: ".$error->getMessage());
    complaint_fail(500,'Unable to submit complaint.');
}
