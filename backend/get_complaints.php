<?php
declare(strict_types=1);
header('Content-Type: application/json');
require_once __DIR__.'/connection/db.php';
require_once __DIR__.'/Apis/auth_check.php';
require_once __DIR__.'/services/order_resolver.php';
require_role('admin');

function complaint_priority(array $complaint): array
{
    $text=strtolower($complaint['reason'].' '.$complaint['description']);
    if(preg_match('/payment|refund|money|charge|paid/',$text)){[$category,$score]=['payment_issue',6];}
    elseif(preg_match('/harvest delay|short|weight|quantity|incomplete|missing|not.*deliver/',$text)){[$category,$score]=['incomplete_order',6];}
    elseif(preg_match('/fake|fraud|scam|false listing/',$text)){[$category,$score]=['fake_listing',5];}
    elseif(preg_match('/quality|damaged|spoiled|rotten/',$text)){[$category,$score]=['quality_issue',4];}
    elseif(preg_match('/delivery|collection|pickup|late arrival/',$text)){[$category,$score]=['delivery_issue',3];}
    elseif(preg_match('/system|website|app|technical|error/',$text)){[$category,$score]=['system_issue',2];}
    else{[$category,$score]=['other',1];}
    $age=max(0,(time()-strtotime($complaint['created_at']))/3600);$score+=min(5,(int)floor($age/24));
    $remaining=null;$overdue=false;
    if($complaint['status']==='awaiting_farmer_response'&&!empty($complaint['farmer_response_deadline'])){
        $remaining=(strtotime($complaint['farmer_response_deadline'])-time())/3600;$overdue=$remaining<0;
        if($overdue)$score+=5;elseif($remaining<6)$score+=3;elseif($remaining<12)$score+=2;elseif($remaining<=24)$score+=1;
    }
    return[$category,$score,$age,$remaining,$overdue,$score>=11?'critical':($score>=8?'high':($score>=5?'medium':'normal'))];
}

try{
    $rows=$pdo->query('SELECT * FROM complaints ORDER BY created_at DESC')->fetchAll(PDO::FETCH_ASSOC);$data=[];
    foreach($rows as$row){
        $resolved=resolve_complaint_snapshot($pdo,(int)$row['id']);if(!$resolved)continue;$order=$resolved['order'];
        if(!empty($_GET['status'])&&$row['status']!==$_GET['status'])continue;
        if((int)($_GET['farmer_id']??0)>0&&$order['farmer_id']!==(int)$_GET['farmer_id'])continue;
        if((int)($_GET['buyer_id']??0)>0&&$order['buyer_id']!==(int)$_GET['buyer_id'])continue;
        [$category,$score,$age,$remaining,$overdue,$priority]=complaint_priority($row);
        $data[]=[
            'complaint_id'=>(int)$row['id'],'reservation_id'=>$order['reservation_id'],'order_number'=>'ORD'.$order['reservation_id'],
            'reservation_source'=>$order['reservation_source'],'buyer_id'=>$order['buyer_id'],'buyer_name'=>$order['buyer_name'],
            'farmer_id'=>$order['farmer_id'],'farmer_name'=>$order['farmer_name'],'crop_id'=>$order['crop_id'],'crop_name'=>$order['crop_name'],
            'quantity'=>$order['quantity'],'unit'=>$order['unit'],'unit_price'=>$order['unit_price'],'total_amount'=>$order['total_amount'],
            'reason'=>$row['reason'],'description'=>$row['description'],'evidence_file'=>$row['evidence_file'],'farmer_evidence_file'=>$row['farmer_evidence_file'],
            'status'=>in_array($row['status'],['submitted','awaiting_farmer_response','under_review'],true)?'open':$row['status'],'workflow_status'=>$row['status'],
            'category'=>$category,'priority'=>$priority,'priority_score'=>$score,'age_hours'=>round($age,1),
            'farmer_response_requested_at'=>$row['farmer_response_requested_at'],'farmer_response_deadline'=>$row['farmer_response_deadline'],
            'deadline_remaining_hours'=>$remaining===null?null:round($remaining,1),'is_overdue'=>$overdue,'farmer_response'=>$row['farmer_response'],
            'admin_notes'=>$row['admin_notes'],'resolution_action'=>$row['resolution_action'],'farmer_responded_at'=>$row['farmer_responded_at'],
            'resolved_at'=>$row['resolved_at'],'created_at'=>$row['created_at'],
        ];
    }
    usort($data,fn($a,$b)=>(($a['status']==='open')!==($b['status']==='open'))?($a['status']==='open'?-1:1):(($b['priority_score']<=>$a['priority_score'])?:strtotime($a['created_at'])<=>strtotime($b['created_at'])));
    $total=count($data);$page=max(1,(int)($_GET['page']??1));$limit=max(1,min(100,(int)($_GET['limit']??20)));$data=array_slice($data,($page-1)*$limit,$limit);
    $week=date('Y-m-d 00:00:00',strtotime('monday this week'));$stats=$pdo->prepare("SELECT SUM(created_at>=? AND created_at<=NOW()) opened,SUM(resolved_at>=? AND status='resolved') resolved,SUM(resolved_at>=? AND status='dismissed') dismissed FROM complaints");$stats->execute([$week,$week,$week]);$weekly=$stats->fetch();
    echo json_encode(['success'=>true,'data'=>$data,'total'=>$total,'page'=>$page,'limit'=>$limit,'weekly_stats'=>['open'=>(int)($weekly['opened']??0),'resolved'=>(int)($weekly['resolved']??0),'dismissed'=>(int)($weekly['dismissed']??0)]]);
}catch(Throwable $error){http_response_code(500);echo json_encode(['success'=>false,'error'=>'Unable to load complaints.']);}
