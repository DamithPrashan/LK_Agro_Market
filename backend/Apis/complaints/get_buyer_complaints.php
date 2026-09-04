<?php
declare(strict_types=1);
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET');
require_once __DIR__.'/../../connection/db.php';
require_once __DIR__.'/../auth_check.php';
require_once __DIR__.'/../../services/order_resolver.php';
require_once __DIR__.'/../../services/complaint_evidence.php';
require_login();

$role=(string)($_SESSION['user']['role']??'');
if(!in_array($role,['buyer','admin'],true)){http_response_code(403);echo json_encode(['success'=>false,'message'=>'Buyer role required.']);exit;}
try{
    $where=[];$params=[];
    if($role==='buyer'){
        $buyerStmt=$pdo->prepare('SELECT buyer_id FROM buyer WHERE user_id=?');$buyerStmt->execute([(int)$_SESSION['user']['id']]);
        $buyerId=(int)$buyerStmt->fetchColumn();if($buyerId<=0)throw new RuntimeException('Buyer profile not found.');
        $where[]='c.buyer_id=?';$params[]=$buyerId;
    }elseif(isset($_GET['buyer_id'])&&(int)$_GET['buyer_id']>0){$where[]='c.buyer_id=?';$params[]=(int)$_GET['buyer_id'];}
    $complaintId=(int)($_GET['complaint_id']??$_GET['id']??0);
    if($complaintId>0){$where[]='c.id=?';$params[]=$complaintId;}
    $sql='SELECT c.* FROM complaints c'.($where?' WHERE '.implode(' AND ',$where):'').' ORDER BY c.created_at DESC';
    $stmt=$pdo->prepare($sql);$stmt->execute($params);$complaints=[];
    foreach($stmt->fetchAll(PDO::FETCH_ASSOC)as$row){
        $order=resolve_order_snapshot($pdo,(int)$row['reservation_id']);
        if(!$order||(int)$row['buyer_id']!==$order['buyer_id'])continue;
        if($role==='buyer'&&$order['buyer_user_id']!==(int)$_SESSION['user']['id'])continue;
        $url=static fn($value)=>!$value?null:(str_starts_with($value,'/')||str_starts_with($value,'http')?$value:'/'.$value);
        $complaints[]=[
            'id'=>(int)$row['id'],'complaint_id'=>(int)$row['id'],'reservation_id'=>$order['reservation_id'],'order_number'=>'ORD'.$order['reservation_id'],
            'reservation_source'=>$order['reservation_source'],'crop_name'=>$order['crop_name'],'crop_id'=>$order['crop_id'],'buyer_name'=>$order['buyer_name'],
            'farmer_name'=>$order['farmer_name'],'quantity'=>$order['quantity'],'unit'=>$order['unit'],'unit_price'=>$order['unit_price'],'total_amount'=>$order['total_amount'],
            'reservation_status'=>$order['reservation_status'],'transaction_status'=>$order['transaction_status'],'collection_date'=>$order['collection_date'],
            'reason'=>$row['reason'],'description'=>$row['description'],'evidence_file'=>$url($row['evidence_file']),'farmer_evidence_file'=>$url($row['farmer_evidence_file']),
            'status'=>$row['status'],'farmer_response'=>$row['farmer_response'],'farmer_responded_at'=>$row['farmer_responded_at'],'admin_notes'=>$row['admin_notes'],
            'resolution_action'=>$row['resolution_action'],'farmer_response_requested_at'=>$row['farmer_response_requested_at'],
            'farmer_response_deadline'=>$row['farmer_response_deadline'],'is_overdue'=>$row['status']==='awaiting_farmer_response'&&$row['farmer_response_deadline']&&strtotime($row['farmer_response_deadline'])<time(),
            'resolved_at'=>$row['resolved_at'],'created_at'=>$row['created_at'],'structured_evidence'=>get_complaint_evidence($pdo,(int)$row['id']),
        ];
    }
    echo json_encode(['success'=>true,'complaints'=>$complaints,'count'=>count($complaints)]);
}catch(Throwable $error){http_response_code(500);echo json_encode(['success'=>false,'message'=>'Unable to load complaints.']);}
