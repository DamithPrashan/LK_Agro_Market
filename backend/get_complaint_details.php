<?php
declare(strict_types=1);
header('Content-Type: application/json');
require_once __DIR__.'/connection/db.php';require_once __DIR__.'/Apis/auth_check.php';require_once __DIR__.'/services/order_resolver.php';require_once __DIR__.'/services/complaint_evidence.php';require_once __DIR__.'/services/payment_summary.php';require_role('admin');
$id=(int)($_GET['complaint_id']??0);if($id<=0){http_response_code(400);echo json_encode(['success'=>false,'message'=>'Invalid complaint ID format.']);exit;}
try{$resolved=resolve_complaint_snapshot($pdo,$id);if(!$resolved){http_response_code(404);echo json_encode(['success'=>false,'message'=>'Complaint not found.']);exit;}$c=$resolved['complaint'];$o=$resolved['order'];$payment=resolve_payment_summary($pdo,$o);
$db=strtolower($c['status']);$flow=in_array($db,['resolved','dismissed','rejected'],true)?'resolved':(!empty($c['farmer_response'])?'farmer_responded':(in_array($db,['under_review','admin_notified'],true)?$db:'submitted'));
$file=static fn($value)=>$value?'/backend/uploads/'.basename($value):null;
echo json_encode(['success'=>true,'complaint'=>[
'id'=>(int)$c['id'],'orderId'=>'ORD'.$o['reservation_id'],'reservationId'=>$o['reservation_id'],'reservationSource'=>$o['reservation_source'],
'reason'=>$c['reason'],'description'=>$c['description'],'evidenceFile'=>$file($c['evidence_file']),'evidenceCount'=>$c['evidence_file']?1:0,
'farmerEvidenceFile'=>$file($c['farmer_evidence_file']),'status'=>$flow,'dbStatus'=>$c['status'],'farmerResponse'=>$c['farmer_response'],
'adminNotes'=>$c['admin_notes'],'resolutionAction'=>$c['resolution_action'],'farmerResponseRequestedAt'=>$c['farmer_response_requested_at'],
'farmerResponseDeadline'=>$c['farmer_response_deadline'],'isOverdue'=>$c['status']==='awaiting_farmer_response'&&$c['farmer_response_deadline']&&strtotime($c['farmer_response_deadline'])<time(),
'farmerRespondedAt'=>$c['farmer_responded_at'],'resolvedAt'=>$c['resolved_at'],'createdAt'=>$c['created_at'],'buyerName'=>$o['buyer_name'],'buyerEmail'=>$o['buyer_email'],
'farmerName'=>$o['farmer_name'],'farmerEmail'=>$o['farmer_email'],'cropName'=>$o['crop_name'],'cropCategory'=>$o['category'],'cropLocation'=>$o['location'],'quantityRequested'=>$o['quantity'],
'unit'=>$o['unit'],'unitPrice'=>$o['unit_price'],'totalAmount'=>$o['total_amount'],'collectionDate'=>$o['collection_date'],
'reservationStatus'=>$o['reservation_status'],'transactionStatus'=>$o['transaction_status'],'structuredEvidence'=>get_complaint_evidence($pdo,$id),'paymentInformation'=>$payment]]);
}catch(Throwable $error){http_response_code(500);echo json_encode(['success'=>false,'message'=>'Unable to load complaint details.']);}
