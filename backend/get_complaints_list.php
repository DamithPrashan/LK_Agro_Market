<?php
declare(strict_types=1);
header('Content-Type: application/json');
require_once __DIR__.'/connection/db.php';require_once __DIR__.'/Apis/auth_check.php';require_once __DIR__.'/services/order_resolver.php';require_role('admin');
try{$rows=$pdo->query('SELECT id FROM complaints ORDER BY created_at DESC')->fetchAll(PDO::FETCH_COLUMN);$complaints=[];
foreach($rows as$id){$resolved=resolve_complaint_snapshot($pdo,(int)$id);if(!$resolved)continue;$c=$resolved['complaint'];$o=$resolved['order'];$complaints[]=['complaint_id'=>(int)$c['id'],'reservation_id'=>$o['reservation_id'],'reservation_source'=>$o['reservation_source'],'reason'=>$c['reason'],'status'=>$c['status'],'created_at'=>$c['created_at'],'buyer_name'=>$o['buyer_name'],'farmer_name'=>$o['farmer_name'],'crop_name'=>$o['crop_name'],'quantity'=>$o['quantity'],'unit'=>$o['unit'],'unit_price'=>$o['unit_price'],'total_amount'=>$o['total_amount']];}
echo json_encode(['success'=>true,'complaints'=>$complaints]);}catch(Throwable $error){http_response_code(500);echo json_encode(['success'=>false,'message'=>'Unable to load complaints.']);}
