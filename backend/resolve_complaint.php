<?php
declare(strict_types=1);
header('Content-Type: application/json');
require_once __DIR__.'/connection/db.php';require_once __DIR__.'/Apis/auth_check.php';require_once __DIR__.'/services/order_resolver.php';
require_once __DIR__.'/create_notification.php';require_once __DIR__.'/Apis/admin/calendar/logAdminActivity.php';require_role('admin');
$input=json_decode(file_get_contents('php://input'),true)?:[];$id=(int)($_POST['complaint_id']??$input['complaint_id']??0);
$action=trim((string)($_POST['action']??$input['action']??''));$resolutionAction=trim((string)($_POST['resolution_action']??$input['resolution_action']??$action));
$status=strtolower(trim((string)($_POST['resolution_status']??$input['resolution_status']??$input['status']??'')));$notes=trim((string)($_POST['admin_notes']??$input['admin_notes']??''));
if($status===''&&in_array(strtolower($resolutionAction),['dismiss','dismissed','reject','rejected'],true))$status='dismissed';
if($status===''&&in_array(strtolower($resolutionAction),['request_farmer_response','inform_farmer'],true))$status='awaiting_farmer_response';
if($id<=0||$notes===''||!in_array($status,['dismissed','awaiting_farmer_response'],true)){http_response_code(400);echo json_encode(['success'=>false,'message'=>'Valid complaint, notes, and action are required.']);exit;}
try{$pdo->beginTransaction();$resolved=resolve_complaint_snapshot($pdo,$id,true);if(!$resolved)throw new DomainException('Complaint not found.');$c=$resolved['complaint'];$o=$resolved['order'];
if(in_array($c['status'],['resolved','dismissed','rejected'],true))throw new DomainException('This complaint has already been handled.');
if($status==='awaiting_farmer_response'&&$c['status']!=='submitted')throw new DomainException('A farmer response has already been requested.');
$pdo->prepare("UPDATE complaints SET status=?,resolution_action=?,admin_notes=?,resolved_at=CASE WHEN ?='dismissed' THEN NOW() ELSE NULL END,farmer_response_requested_at=CASE WHEN ?='awaiting_farmer_response' THEN NOW() ELSE NULL END,farmer_response_deadline=CASE WHEN ?='awaiting_farmer_response' THEN DATE_ADD(NOW(),INTERVAL 48 HOUR) ELSE NULL END WHERE id=?")
 ->execute([$status,$resolutionAction,$notes,$status,$status,$status,$id]);
$deadline=null;if($status==='awaiting_farmer_response'){$s=$pdo->prepare('SELECT farmer_response_deadline FROM complaints WHERE id=?');$s->execute([$id]);$deadline=$s->fetchColumn();}
$base=['complaint_id'=>$id,'complaintId'=>$id,'reservation_id'=>$o['reservation_id'],'orderId'=>$o['reservation_id'],'reservation_source'=>$o['reservation_source'],'cropName'=>$o['crop_name'],'action'=>$resolutionAction,'notes'=>$notes];
if($status==='awaiting_farmer_response'){$data=$base+['deadline'=>$deadline,'link'=>'/farmer/complaints'];$message="You must respond to the complaint for Order #{$o['reservation_id']} ({$o['crop_name']}) within 48 hours. {$notes}";
 if(!create_notification($o['farmer_user_id'],'Action Required: Complaint for Order #'.$o['reservation_id'],$message,'farmerResponseRequested',json_encode($data)))throw new RuntimeException('Notification failed.');}
else{$data=$base+['link'=>'/buyer/complaints?tab=farmer_response&id='.$id];$message="Your complaint for Order #{$o['reservation_id']} ({$o['crop_name']}) was dismissed after review. Notes: {$notes}";
 if(!create_notification($o['buyer_user_id'],'Complaint Dismissed: Order #'.$o['reservation_id'],$message,'complaintDismissed',json_encode($data)))throw new RuntimeException('Notification failed.');}
$adminStmt=$pdo->prepare('SELECT admin_id FROM admin WHERE user_id=? LIMIT 1');$adminStmt->execute([$_SESSION['user']['id']]);$adminId=$adminStmt->fetchColumn()?:null;
$type=$status==='awaiting_farmer_response'?'farmer_response_requested':'complaint_dismissed';
if(!logAdminActivity($pdo,$type,$status==='awaiting_farmer_response'?'Farmer response requested':'Complaint dismissed',($status==='awaiting_farmer_response'?"A 48-hour farmer response deadline was set":"Complaint dismissed")." for {$o['reservation_source']} order #{$o['reservation_id']} ({$o['crop_name']}).",$id,$adminId))throw new RuntimeException('Calendar logging failed.');
$pdo->commit();echo json_encode(['success'=>true,'complaint_id'=>$id,'status'=>$status,'message'=>$status==='awaiting_farmer_response'?'The farmer was notified and asked to respond.':'Complaint dismissed successfully.']);
}catch(DomainException $error){if($pdo->inTransaction())$pdo->rollBack();http_response_code(409);echo json_encode(['success'=>false,'message'=>$error->getMessage()]);}
catch(Throwable $error){if($pdo->inTransaction())$pdo->rollBack();error_log('Resolve complaint failed: '.$error->getMessage());http_response_code(500);echo json_encode(['success'=>false,'message'=>'Unable to update complaint.']);}
