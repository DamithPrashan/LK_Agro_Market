<?php
declare(strict_types=1);
header('Content-Type: application/json');
require_once __DIR__.'/connection/db.php';require_once __DIR__.'/Apis/auth_check.php';require_once __DIR__.'/services/order_resolver.php';require_once __DIR__.'/create_notification.php';require_role('farmer');
$userId=(int)$_SESSION['user']['id'];
function farmer_evidence_mime(string $path):?string{
 if(class_exists('finfo')){$detector=new finfo(FILEINFO_MIME_TYPE);$mime=$detector->file($path);return is_string($mime)?$mime:null;}
 $image=@getimagesize($path);if(is_array($image)&&isset($image['mime']))return(string)$image['mime'];
 $handle=@fopen($path,'rb');if($handle!==false){$signature=fread($handle,5);fclose($handle);if($signature==='%PDF-')return'application/pdf';}
 return null;
}
if($_SERVER['REQUEST_METHOD']==='GET'){
 try{$ids=$pdo->query("SELECT id FROM complaints WHERE status='awaiting_farmer_response' ORDER BY created_at DESC")->fetchAll(PDO::FETCH_COLUMN);$data=[];
 foreach($ids as$id){$resolved=resolve_complaint_snapshot($pdo,(int)$id);if(!$resolved||$resolved['order']['farmer_user_id']!==$userId)continue;$c=$resolved['complaint'];$o=$resolved['order'];
 $data[]=['complaint_id'=>(int)$c['id'],'reservation_id'=>$o['reservation_id'],'order_number'=>'ORD'.$o['reservation_id'],'reservation_source'=>$o['reservation_source'],'crop_name'=>$o['crop_name'],
 'quantity'=>$o['quantity'],'unit'=>$o['unit'],'unit_price'=>$o['unit_price'],'total_amount'=>$o['total_amount'],'reason'=>$c['reason'],'description'=>$c['description'],
 'evidence_file'=>$c['evidence_file'],'admin_notes'=>$c['admin_notes'],'status'=>$c['status'],'farmer_response_requested_at'=>$c['farmer_response_requested_at'],
 'farmer_response_deadline'=>$c['farmer_response_deadline'],'is_overdue'=>$c['farmer_response_deadline']&&strtotime($c['farmer_response_deadline'])<time(),'buyer_name'=>$o['buyer_name'],'created_at'=>$c['created_at']];}
 echo json_encode(['success'=>true,'data'=>$data]);}catch(Throwable $error){http_response_code(500);echo json_encode(['success'=>false,'error'=>'Unable to load complaints.']);}exit;
}
$json=json_decode(file_get_contents('php://input'),true)?:[];$id=(int)($_POST['complaint_id']??$json['complaint_id']??0);$response=trim((string)($_POST['response_text']??$_POST['response']??$json['response_text']??$json['response']??''));
if($id<=0||strlen($response)<10){http_response_code(400);echo json_encode(['success'=>false,'error'=>'A valid complaint and response of at least 10 characters are required.']);exit;}
$created=null;
$failureStage='complaint resolution';
try{$pdo->beginTransaction();$resolved=resolve_complaint_snapshot($pdo,$id,true);if(!$resolved||$resolved['order']['farmer_user_id']!==$userId)throw new DomainException('You do not have permission to respond to this complaint.');$c=$resolved['complaint'];$o=$resolved['order'];
if($c['status']!=='awaiting_farmer_response')throw new DomainException('This complaint is not awaiting your response or was already handled.');
$failureStage='evidence validation';$evidence=null;if(isset($_FILES['evidence'])&&$_FILES['evidence']['error']!==UPLOAD_ERR_NO_FILE){$file=$_FILES['evidence'];if($file['error']!==UPLOAD_ERR_OK)throw new DomainException('Evidence upload failed.');if((int)$file['size']<=0||(int)$file['size']>5242880)throw new DomainException('Evidence file must be 5 MB or smaller.');
$ext=strtolower(pathinfo($file['name'],PATHINFO_EXTENSION));$allowed=['jpg'=>'image/jpeg','jpeg'=>'image/jpeg','png'=>'image/png','pdf'=>'application/pdf'];$mime=farmer_evidence_mime($file['tmp_name']);if(!isset($allowed[$ext])||$mime!==$allowed[$ext])throw new DomainException('Evidence must be JPG, PNG, or PDF.');
$dir=__DIR__.'/uploads';if(!is_dir($dir)&&!mkdir($dir,0755,true)&&!is_dir($dir))throw new RuntimeException('Unable to prepare evidence storage.');$name='farmer_ev_'.bin2hex(random_bytes(16)).'.'.$ext;$created=$dir.DIRECTORY_SEPARATOR.$name;if(!move_uploaded_file($file['tmp_name'],$created))throw new RuntimeException('Evidence storage failed.');$evidence='backend/uploads/'.$name;}
$failureStage='complaint update';
$update=$pdo->prepare("UPDATE complaints SET farmer_response=?,farmer_evidence_file=?,farmer_responded_at=NOW(),status='resolved',resolution_action='farmer_response_received',resolved_at=NOW() WHERE id=? AND status='awaiting_farmer_response'");$update->execute([$response,$evidence,$id]);if($update->rowCount()!==1)throw new DomainException('This complaint was already handled.');
$data=['complaint_id'=>$id,'complaintId'=>$id,'reservation_id'=>$o['reservation_id'],'orderId'=>$o['reservation_id'],'reservation_source'=>$o['reservation_source'],'cropName'=>$o['crop_name'],'link'=>'/buyer/complaints?tab=farmer_response&id='.$id];
$failureStage='buyer notification';
if(!create_notification($o['buyer_user_id'],'Farmer Responded to Dispute',"The farmer submitted a response for Order #{$o['reservation_id']} ({$o['crop_name']}).",'farmerResponded',json_encode($data)))throw new RuntimeException('Notification failed.');
$failureStage='transaction commit';
$pdo->commit();echo json_encode(['success'=>true,'complaint_id'=>$id,'status'=>'resolved','message'=>'Your response was submitted and the complaint is now resolved.']);
}catch(DomainException $error){if($pdo->inTransaction())$pdo->rollBack();if($created&&is_file($created))unlink($created);http_response_code(403);echo json_encode(['success'=>false,'error'=>$error->getMessage()]);}
catch(Throwable $error){if($pdo->inTransaction())$pdo->rollBack();if($created&&is_file($created))unlink($created);error_log("Farmer complaint response failed during {$failureStage} for complaint {$id}: ".$error->getMessage());http_response_code(500);echo json_encode(['success'=>false,'error'=>'Unable to submit response.']);}
