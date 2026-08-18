<?php
declare(strict_types=1);
header('Content-Type: application/json');require_once __DIR__.'/../../../connection/db.php';require_once __DIR__.'/../../auth_check.php';require_role('admin');
try{$sql="SELECT u.user_id,u.name,u.email,u.role,u.location,u.created_at,u.profile_image,
 COUNT(DISTINCT CASE WHEN co.status='awaiting_farmer_response' THEN co.id END) active_complaint_count,
 MIN(CASE WHEN co.status='awaiting_farmer_response' THEN co.farmer_response_deadline END) nearest_response_deadline,
 COUNT(DISTINCT CASE WHEN co.status='awaiting_farmer_response' AND co.farmer_response_deadline<=NOW() THEN co.id END) overdue_complaint_count
 FROM user u LEFT JOIN farmer f ON u.role='farmer' AND f.user_id=u.user_id
 LEFT JOIN(
  SELECT c.id,c.status,c.farmer_response_deadline,cr.farmer_id FROM complaints c JOIN reservation r ON c.reservation_id=r.reservation_id JOIN reserve_crop rc ON r.reservation_source='crop' AND r.reserve_crop_id=rc.reserve_crop_id JOIN crop cr ON rc.crop_id=cr.crop_id
  UNION ALL
  SELECT c.id,c.status,c.farmer_response_deadline,ca.farmer_id FROM complaints c JOIN reservation r ON c.reservation_id=r.reservation_id JOIN cultivation_request rq ON r.reservation_source='cultivation' AND r.cultivation_request_id=rq.cultivation_request_id JOIN cultivation_ad ca ON rq.cultivation_ad_id=ca.cultivation_ad_id
 )co ON co.farmer_id=f.farmer_id GROUP BY u.user_id,u.name,u.email,u.role,u.location,u.created_at,u.profile_image";
 $rows=$pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);$rank=['overdue'=>0,'urgent'=>1,'attention'=>2,'normal'=>3];
 $users=array_map(function($row){$active=(int)$row['active_complaint_count'];$overdue=(int)$row['overdue_complaint_count'];$deadline=$row['nearest_response_deadline'];$priority=$overdue>0?'overdue':($active>0&&$deadline&&strtotime($deadline)<=time()+86400?'urgent':($active>0?'attention':'normal'));
 return['user_id'=>(int)$row['user_id'],'name'=>$row['name'],'email'=>$row['email'],'role'=>$row['role'],'district'=>$row['location'],'created_at'=>$row['created_at'],'profile_image'=>$row['profile_image'],'status'=>'active','priority'=>$priority,'active_complaint_count'=>$active,'nearest_response_deadline'=>$deadline,'overdue_complaint_count'=>$overdue];},$rows);
 usort($users,function($a,$b)use($rank){$r=$rank[$a['priority']]<=>$rank[$b['priority']];if($r)return$r;$ad=$a['nearest_response_deadline']?strtotime($a['nearest_response_deadline']):PHP_INT_MAX;$bd=$b['nearest_response_deadline']?strtotime($b['nearest_response_deadline']):PHP_INT_MAX;return$ad!==$bd?$ad<=>$bd:$b['user_id']<=>$a['user_id'];});
 echo json_encode(['success'=>true,'users'=>$users,'count'=>count($users)]);
}catch(Throwable $error){http_response_code(500);echo json_encode(['success'=>false,'message'=>'Unable to load users.']);}
