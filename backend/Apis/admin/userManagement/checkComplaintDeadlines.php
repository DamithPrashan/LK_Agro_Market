<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(403);echo json_encode(['success'=>false,'message'=>'This scheduled checker may only run from the command line.']);exit;}
require_once __DIR__.'/../../../connection/db.php';require_once __DIR__.'/../../../create_notification.php';require_once __DIR__.'/../../../services/order_resolver.php';require_once __DIR__.'/../calendar/logAdminActivity.php';
function processComplaintReminders(PDO $pdo,string $kind):int{
 $overdue=$kind==='overdue';$column=$overdue?'farmer_overdue_reminder_sent_at':'farmer_24h_reminder_sent_at';
 $condition=$overdue?'farmer_response_deadline<=NOW()':'farmer_response_deadline>NOW() AND farmer_response_deadline<=DATE_ADD(NOW(),INTERVAL 24 HOUR)';
 $rows=$pdo->query("SELECT id FROM complaints WHERE status='awaiting_farmer_response' AND farmer_response_deadline IS NOT NULL AND {$condition} AND {$column} IS NULL ORDER BY farmer_response_deadline")->fetchAll(PDO::FETCH_COLUMN);$count=0;
 foreach($rows as$id){$pdo->beginTransaction();try{$claim=$pdo->prepare("UPDATE complaints SET {$column}=NOW() WHERE id=? AND {$column} IS NULL AND status='awaiting_farmer_response'");$claim->execute([$id]);if($claim->rowCount()!==1){$pdo->rollBack();continue;}
  $resolved=resolve_complaint_snapshot($pdo,(int)$id,true);if(!$resolved)throw new RuntimeException('Complaint order cannot be resolved.');$c=$resolved['complaint'];$o=$resolved['order'];
  $type=$overdue?'farmer_response_overdue':'farmer_response_reminder';$title=$overdue?'Complaint Response Overdue':'Complaint Response Reminder';
  $message=$overdue?'The response deadline for a complaint requiring your action has passed. Please respond as soon as possible.':'You have less than 24 hours remaining to respond to a complaint requiring your action.';
  $data=['complaintId'=>(int)$id,'orderId'=>$o['reservation_id'],'reservation_source'=>$o['reservation_source'],'cropName'=>$o['crop_name'],'deadline'=>$c['farmer_response_deadline'],'link'=>'/farmer/complaints'];
  $description=$overdue?"{$o['farmer_name']} has not responded within 48 hours for {$o['reservation_source']} order #{$o['reservation_id']}.":"{$o['farmer_name']} has less than 24 hours to respond for {$o['reservation_source']} order #{$o['reservation_id']}.";
  if(!create_notification($o['farmer_user_id'],$title,$message,$type,json_encode($data))||!logAdminActivity($pdo,$type,$overdue?'Farmer Response Overdue':'Farmer Response Reminder',$description,(int)$id))throw new RuntimeException('Notification or calendar logging failed.');
  $pdo->commit();$count++;}catch(Throwable $error){if($pdo->inTransaction())$pdo->rollBack();error_log("Complaint reminder failed for {$id}: ".$error->getMessage());}}
 return$count;
}
$overdue=processComplaintReminders($pdo,'overdue');$urgent=processComplaintReminders($pdo,'urgent');echo json_encode(['success'=>true,'urgent_reminders_sent'=>$urgent,'overdue_reminders_sent'=>$overdue]).PHP_EOL;
