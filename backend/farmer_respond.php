<?php
declare(strict_types=1);
header('Content-Type: application/json');
require_once __DIR__.'/connection/db.php';require_once __DIR__.'/Apis/auth_check.php';require_once __DIR__.'/services/order_resolver.php';require_once __DIR__.'/services/complaint_evidence.php';require_once __DIR__.'/create_notification.php';require_role('farmer');
$userId=(int)$_SESSION['user']['id'];
if($_SERVER['REQUEST_METHOD']==='GET'){
 try{$ids=$pdo->query("SELECT id FROM complaints WHERE status='awaiting_farmer_response' ORDER BY created_at DESC")->fetchAll(PDO::FETCH_COLUMN);$data=[];
 foreach($ids as$id){$resolved=resolve_complaint_snapshot($pdo,(int)$id);if(!$resolved||$resolved['order']['farmer_user_id']!==$userId)continue;$c=$resolved['complaint'];$o=$resolved['order'];
 $data[]=['complaint_id'=>(int)$c['id'],'reservation_id'=>$o['reservation_id'],'order_number'=>'ORD'.$o['reservation_id'],'reservation_source'=>$o['reservation_source'],'crop_name'=>$o['crop_name'],
 'quantity'=>$o['quantity'],'unit'=>$o['unit'],'unit_price'=>$o['unit_price'],'total_amount'=>$o['total_amount'],'reason'=>$c['reason'],'description'=>$c['description'],
 'evidence_file'=>$c['evidence_file'],'requires_crop_evidence'=>complaint_reason_requires_crop_photos($c['reason']),'structured_evidence'=>get_complaint_evidence($pdo,(int)$c['id']),'admin_notes'=>$c['admin_notes'],'status'=>$c['status'],'farmer_response_requested_at'=>$c['farmer_response_requested_at'],
 'farmer_response_deadline'=>$c['farmer_response_deadline'],'is_overdue'=>$c['farmer_response_deadline']&&strtotime($c['farmer_response_deadline'])<time(),'buyer_name'=>$o['buyer_name'],'created_at'=>$c['created_at']];}
 echo json_encode(['success'=>true,'data'=>$data]);}catch(Throwable $error){http_response_code(500);echo json_encode(['success'=>false,'error'=>'Unable to load complaints.']);}exit;
}
$json=json_decode(file_get_contents('php://input'),true)?:[];$id=(int)($_POST['complaint_id']??$json['complaint_id']??0);$response=trim((string)($_POST['response_text']??$_POST['response']??$json['response_text']??$json['response']??''));
if($id<=0||strlen($response)<10){http_response_code(400);echo json_encode(['success'=>false,'error'=>'A valid complaint and response of at least 10 characters are required.']);exit;}
$created=[];
$failureStage='complaint resolution';
try{$pdo->beginTransaction();$resolved=resolve_complaint_snapshot($pdo,$id,true);if(!$resolved||$resolved['order']['farmer_user_id']!==$userId)throw new DomainException('You do not have permission to respond to this complaint.');$c=$resolved['complaint'];$o=$resolved['order'];
if($c['status']!=='awaiting_farmer_response')throw new DomainException('This complaint is not awaiting your response or was already handled.');
$failureStage='evidence validation';$evidence=null;$structured=[];$required=complaint_reason_requires_crop_photos($c['reason']);foreach(COMPLAINT_CROP_EVIDENCE_TYPES as$type){$file=$_FILES[$type]??null;if($required&&(!$file||($file['error']??UPLOAD_ERR_NO_FILE)===UPLOAD_ERR_NO_FILE))throw new DomainException('All three guided crop photos are required for this response.');if($file&&($file['error']??UPLOAD_ERR_NO_FILE)!==UPLOAD_ERR_NO_FILE){$structured[$type]=store_complaint_upload($file,'farmer_'.$type);$created[]=$structured[$type]['absolute_path'];}}$doc=$_FILES['supporting_document']??null;if($doc&&($doc['error']??UPLOAD_ERR_NO_FILE)!==UPLOAD_ERR_NO_FILE){$structured['supporting_document']=store_complaint_upload($doc,'farmer_document');$created[]=$structured['supporting_document']['absolute_path'];}
$failureStage='complaint update';
$update=$pdo->prepare("UPDATE complaints SET farmer_response=?,farmer_evidence_file=?,farmer_responded_at=NOW(),status='under_review',resolution_action='farmer_response_received',resolved_at=NULL WHERE id=? AND status='awaiting_farmer_response'");$update->execute([$response,$evidence,$id]);if($update->rowCount()!==1)throw new DomainException('This complaint was already handled.');
foreach($structured as$type=>$stored)insert_complaint_evidence($pdo,$id,'farmer',$type,$stored);
$data=['complaint_id'=>$id,'complaintId'=>$id,'reservation_id'=>$o['reservation_id'],'orderId'=>$o['reservation_id'],'reservation_source'=>$o['reservation_source'],'cropName'=>$o['crop_name']];
$failureStage='response notifications';
if(!create_notification($o['buyer_user_id'],'Farmer Responded to Dispute',"The farmer submitted a response for Order #{$o['reservation_id']} ({$o['crop_name']}). The complaint is awaiting administrator review.",'farmerResponded',json_encode($data+['link'=>'/buyer/complaints?tab=farmer_response&id='.$id])))throw new RuntimeException('Notification failed.');
$admins=$pdo->query("SELECT user_id FROM user WHERE role='admin'")->fetchAll(PDO::FETCH_COLUMN);
foreach($admins as $adminUserId){if(!create_notification((int)$adminUserId,'Farmer Response Received',"A farmer response was submitted for Dispute #{$id}, Order #{$o['reservation_id']} ({$o['crop_name']}).",'farmerResponded',json_encode($data+['link'=>'/admin/complaint/'.$id])))throw new RuntimeException('Notification failed.');}
$failureStage='transaction commit';
$pdo->commit();echo json_encode(['success'=>true,'complaint_id'=>$id,'status'=>'under_review','message'=>'Your response was submitted for administrator review.']);
}catch(DomainException $error){if($pdo->inTransaction())$pdo->rollBack();foreach($created as$file)if(is_file($file))unlink($file);http_response_code(403);echo json_encode(['success'=>false,'error'=>$error->getMessage()]);}
catch(Throwable $error){if($pdo->inTransaction())$pdo->rollBack();foreach($created as$file)if(is_file($file))unlink($file);error_log("Farmer complaint response failed during {$failureStage} for complaint {$id}: ".$error->getMessage());http_response_code(500);echo json_encode(['success'=>false,'error'=>'Unable to submit response.']);}
