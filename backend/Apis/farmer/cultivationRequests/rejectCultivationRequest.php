<?php
header('Content-Type: application/json'); require_once __DIR__.'/_common.php';
if($_SERVER['REQUEST_METHOD']!=='POST')cultivation_json(405,['success'=>false,'message'=>'Method not allowed.']);
$farmer=cultivation_require_farmer();$input=json_decode(file_get_contents('php://input'),true)?:[];$id=(int)($input['cultivation_request_id']??0);$note=trim((string)($input['farmer_note']??''));
if(mb_strlen($note)>2000)cultivation_json(422,['success'=>false,'message'=>'Farmer note must not exceed 2000 characters.']);
try{$pdo->beginTransaction();$request=cultivation_farmer_request($id,(int)$farmer['farmer_id']);
 if(!$request){$pdo->rollBack();cultivation_json(404,['success'=>false,'message'=>'Cultivation request not found.']);}
 if($request['request_status']!=='pending'){$pdo->rollBack();cultivation_json(409,['success'=>false,'message'=>'Only a pending request can be rejected.']);}
 $pdo->prepare("UPDATE cultivation_request SET request_status='rejected',farmer_note=?,responded_at=NOW() WHERE cultivation_request_id=?")->execute([$note?:null,$id]);
 $data=json_encode(['requestId'=>$id,'cropName'=>$request['crop_name'],'link'=>'/buyer/cultivation-requests']);
 if(!create_notification($request['buyer_user_id'],'Cultivation Request Rejected','Your cultivation request was rejected.','cultivationRequestRejected',$data))throw new RuntimeException('Notification failed.');
 $pdo->commit();cultivation_json(200,['success'=>true,'message'=>'Cultivation request rejected.','data'=>['cultivation_request_id'=>$id,'request_status'=>'rejected']]);
}catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();cultivation_json(500,['success'=>false,'message'=>'Unable to reject cultivation request.']);}
