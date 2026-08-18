<?php
header('Content-Type: application/json');
require_once __DIR__ . '/_common.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') cultivation_request_json(405,['success'=>false,'message'=>'Method not allowed.']);
$buyer=cultivation_require_buyer(); $input=json_decode(file_get_contents('php://input'),true) ?: [];
$adId=(int)($input['cultivation_ad_id']??0); $quantity=(float)($input['requested_quantity']??0);
$collection=trim((string)($input['requested_collection_date']??''));
if ($adId<=0 || $quantity<=0) cultivation_request_json(422,['success'=>false,'message'=>'Requested quantity must be greater than zero.']);
if (!cultivation_valid_date($collection)) cultivation_request_json(422,['success'=>false,'message'=>'Select a valid preferred collection date.']);
try {
 $pdo->beginTransaction();
 $stmt=$pdo->prepare("SELECT ca.*, f.user_id farmer_user_id FROM cultivation_ad ca JOIN farmer f ON f.farmer_id=ca.farmer_id WHERE ca.cultivation_ad_id=? FOR UPDATE");
 $stmt->execute([$adId]); $ad=$stmt->fetch(PDO::FETCH_ASSOC);
 if (!$ad || $ad['status']!=='open') { $pdo->rollBack(); cultivation_request_json(409,['success'=>false,'message'=>'This cultivation opportunity is no longer open.']); }
 $remaining=max(0,(float)$ad['capacity_quantity']-(float)$ad['committed_quantity']);
 if ($quantity>$remaining) { $pdo->rollBack(); cultivation_request_json(409,['success'=>false,'message'=>'Requested quantity exceeds the remaining capacity.']); }
 if ($collection<$ad['expected_harvest_date']) { $pdo->rollBack(); cultivation_request_json(422,['success'=>false,'message'=>'Preferred collection date cannot be before the expected harvest date.']); }
 $pending=$pdo->prepare("SELECT cultivation_request_id FROM cultivation_request WHERE cultivation_ad_id=? AND buyer_id=? AND request_status='pending' LIMIT 1 FOR UPDATE");
 $pending->execute([$adId,$buyer['buyer_id']]);
 if($pending->fetchColumn()){ $pdo->rollBack(); cultivation_request_json(409,['success'=>false,'message'=>'You already have a pending request for this cultivation opportunity.']); }
 $insert=$pdo->prepare('INSERT INTO cultivation_request (cultivation_ad_id,buyer_id,requested_quantity,requested_collection_date) VALUES (?,?,?,?)');
 $insert->execute([$adId,$buyer['buyer_id'],$quantity,$collection]); $requestId=(int)$pdo->lastInsertId();
 require_once __DIR__ . '/../../../create_notification.php';
 $data=json_encode(['requestId'=>$requestId,'cropName'=>$ad['crop_name'],'quantity'=>$quantity,'unit'=>$ad['unit'],'link'=>'/farmer/cultivation-opportunities?tab=requests']);
 if (!create_notification($ad['farmer_user_id'],'New Cultivation Request','A buyer submitted a cultivation request.','cultivationRequestSubmitted',$data)) throw new RuntimeException('Notification failed.');
 $pdo->commit(); cultivation_request_json(201,['success'=>true,'message'=>'Cultivation request submitted for farmer review.','data'=>['request'=>['cultivation_request_id'=>$requestId,'request_status'=>'pending']]]);
} catch (Throwable $e) { if($pdo->inTransaction())$pdo->rollBack(); if($e instanceof PDOException && $e->getCode()==='23000') cultivation_request_json(409,['success'=>false,'message'=>'You already have a pending request for this cultivation opportunity.']); cultivation_request_json(500,['success'=>false,'message'=>'Unable to submit cultivation request.']); }
