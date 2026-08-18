<?php
header('Content-Type: application/json'); require_once __DIR__.'/_common.php';
if($_SERVER['REQUEST_METHOD']!=='POST') cultivation_json(405,['success'=>false,'message'=>'Method not allowed.']);
$farmer=cultivation_require_farmer(true); $input=cultivation_json_input(); $id=(int)($input['cultivation_request_id']??0);
if($id<=0)cultivation_json(422,['success'=>false,'message'=>'Select a valid cultivation request.']);
try{$pdo->beginTransaction(); $request=cultivation_farmer_request($id,(int)$farmer['farmer_id']);
 if(!$request){$pdo->rollBack();cultivation_json(404,['success'=>false,'message'=>'Cultivation request not found.']);}
 if($request['request_status']!=='pending'){$pdo->rollBack();cultivation_json(409,['success'=>false,'message'=>'Only a pending request can be accepted.']);}
 if($request['ad_status']!=='open'){$pdo->rollBack();cultivation_json(409,['success'=>false,'message'=>'The cultivation opportunity is no longer open.']);}
 $remaining=max(0,(float)$request['capacity_quantity']-(float)$request['committed_quantity']); $quantity=(float)$request['requested_quantity'];
 if($quantity>$remaining){$pdo->rollBack();cultivation_json(409,['success'=>false,'message'=>'Remaining capacity is no longer sufficient for this request.']);}
 $price=(float)$request['estimated_unit_price']; $total=round($quantity*$price,2); $newCommitted=(float)$request['committed_quantity']+$quantity;
 $pdo->prepare("UPDATE cultivation_request SET agreed_quantity=?,agreed_unit_price=?,agreed_total_amount=?,request_status='accepted',responded_at=NOW() WHERE cultivation_request_id=?")->execute([$quantity,$price,$total,$id]);
 $status=$newCommitted>=(float)$request['capacity_quantity']?'capacity_reached':'open';
 $pdo->prepare('UPDATE cultivation_ad SET committed_quantity=?,status=? WHERE cultivation_ad_id=?')->execute([$newCommitted,$status,$request['cultivation_ad_id']]);
 $pdo->prepare("INSERT INTO reservation (reservation_source,reserve_crop_id,cultivation_request_id,collection_date,reservation_status,transaction_status) VALUES ('cultivation',NULL,?,?,'confirmed','unpaid')")->execute([$id,$request['requested_collection_date']]);
 $data=json_encode(['requestId'=>$id,'cropName'=>$request['crop_name'],'quantity'=>$quantity,'unit'=>$request['unit'],'link'=>'/buyer/cultivation-requests']);
 if(!create_notification($request['buyer_user_id'],'Cultivation Request Accepted','Your cultivation request was accepted.','cultivationRequestAccepted',$data))throw new RuntimeException('Notification failed.');
 $pdo->commit(); cultivation_json(200,['success'=>true,'message'=>'Cultivation request accepted.','data'=>['cultivation_request_id'=>$id,'request_status'=>'accepted','committed_quantity'=>$newCommitted,'ad_status'=>$status]]);
}catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();cultivation_json(500,['success'=>false,'message'=>'Unable to accept cultivation request.']);}
