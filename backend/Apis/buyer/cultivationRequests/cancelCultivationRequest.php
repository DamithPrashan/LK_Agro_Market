<?php
header('Content-Type: application/json'); require_once __DIR__ . '/_common.php';
if($_SERVER['REQUEST_METHOD']!=='POST') cultivation_request_json(405,['success'=>false,'message'=>'Method not allowed.']);
$buyer=cultivation_require_buyer(); $input=json_decode(file_get_contents('php://input'),true)?:[]; $id=(int)($input['cultivation_request_id']??0);
try { $pdo->beginTransaction();
 $stmt=$pdo->prepare("SELECT cr.request_status,ca.crop_name,f.user_id farmer_user_id FROM cultivation_request cr JOIN cultivation_ad ca ON ca.cultivation_ad_id=cr.cultivation_ad_id JOIN farmer f ON f.farmer_id=ca.farmer_id WHERE cr.cultivation_request_id=? AND cr.buyer_id=? FOR UPDATE");
 $stmt->execute([$id,$buyer['buyer_id']]); $request=$stmt->fetch(PDO::FETCH_ASSOC);
 if(!$request) { $pdo->rollBack(); cultivation_request_json(404,['success'=>false,'message'=>'Cultivation request not found.']); }
 if($request['request_status']!=='pending') { $pdo->rollBack(); cultivation_request_json(409,['success'=>false,'message'=>'Only a pending cultivation request can be cancelled.']); }
 $pdo->prepare("UPDATE cultivation_request SET request_status='cancelled',responded_at=NOW() WHERE cultivation_request_id=?")->execute([$id]);
 require_once __DIR__.'/../../../create_notification.php';
 if(!create_notification($request['farmer_user_id'],'Cultivation Request Cancelled','A buyer cancelled a pending cultivation request.','cultivationRequestCancelled',json_encode(['requestId'=>$id,'cropName'=>$request['crop_name'],'link'=>'/farmer/cultivation-opportunities?tab=requests']))) throw new RuntimeException('Notification failed.');
 $pdo->commit(); cultivation_request_json(200,['success'=>true,'message'=>'Cultivation request cancelled.','data'=>['cultivation_request_id'=>$id,'request_status'=>'cancelled']]);
} catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack(); cultivation_request_json(500,['success'=>false,'message'=>'Unable to cancel cultivation request.']);}
