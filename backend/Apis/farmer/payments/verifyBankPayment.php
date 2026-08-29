<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../../connection/db.php';
require_once __DIR__ . '/../../auth_check.php';
require_login(); require_role('farmer');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['success'=>false,'message'=>'Method not allowed.']); exit; }
$input=json_decode(file_get_contents('php://input'),true); $paymentId=(int)($input['payment_id']??0); $action=trim((string)($input['action']??''));
if($paymentId<=0||!in_array($action,['confirm','reject'],true)){http_response_code(422);echo json_encode(['success'=>false,'message'=>'Invalid payment verification request.']);exit;}
try{
 $farmerStmt=$pdo->prepare('SELECT farmer_id FROM farmer WHERE user_id=?');$farmerStmt->execute([$_SESSION['user']['id']]);$farmerId=(int)$farmerStmt->fetchColumn();if($farmerId<=0)throw new RuntimeException('Farmer profile not found.');
 $pdo->beginTransaction();
 $stmt=$pdo->prepare("SELECT p.payment_id,p.reservation_id,p.payment_type,p.amount,p.method,p.payment_status,r.reservation_source,r.reservation_status,r.transaction_status,
 CASE WHEN r.reservation_source='cultivation' THEN cr.agreed_total_amount ELSE rc.total_amount END total_amount,
 CASE WHEN r.reservation_source='cultivation' THEN cb.user_id ELSE b.user_id END buyer_user_id,
 CASE WHEN r.reservation_source='cultivation' THEN ca.crop_name ELSE c.crop_name END crop_name,
 (SELECT COUNT(*) FROM payment ap WHERE ap.reservation_id=r.reservation_id AND ap.payment_type='advance' AND ap.payment_status='completed') completed_advance_count,
 (SELECT COALESCE(SUM(ap.amount),0) FROM payment ap WHERE ap.reservation_id=r.reservation_id AND ap.payment_type='advance' AND ap.payment_status='completed') completed_advance_amount
 FROM payment p JOIN reservation r ON r.reservation_id=p.reservation_id
 LEFT JOIN reserve_crop rc ON r.reservation_source='crop' AND r.reserve_crop_id=rc.reserve_crop_id LEFT JOIN crop c ON rc.crop_id=c.crop_id LEFT JOIN buyer b ON rc.buyer_id=b.buyer_id
 LEFT JOIN cultivation_request cr ON r.reservation_source='cultivation' AND r.cultivation_request_id=cr.cultivation_request_id LEFT JOIN cultivation_ad ca ON cr.cultivation_ad_id=ca.cultivation_ad_id LEFT JOIN buyer cb ON cr.buyer_id=cb.buyer_id
 WHERE p.payment_id=? AND ((r.reservation_source='crop' AND c.farmer_id=?) OR (r.reservation_source='cultivation' AND ca.farmer_id=?)) FOR UPDATE");
 $stmt->execute([$paymentId,$farmerId,$farmerId]);$payment=$stmt->fetch(PDO::FETCH_ASSOC);
 if(!$payment)throw new DomainException('Bank payment not found or access denied.');if($payment['method']!=='bank'||$payment['payment_status']!=='pending')throw new DomainException('Only a pending Bank payment can be verified.');
 $total=(float)$payment['total_amount'];$advance=round($total/3);$expected=$payment['payment_type']==='advance'?$advance:$total-$advance;
 if(!in_array($payment['payment_type'],['advance','final'],true)||abs((float)$payment['amount']-$expected)>0.01)throw new DomainException('The Bank payment amount does not match the frozen order total.');
 if($action==='reject'){$pdo->prepare("UPDATE payment SET payment_status='failed' WHERE payment_id=? AND payment_status='pending'")->execute([$paymentId]);}
 elseif($payment['payment_type']==='advance'){
  if($payment['reservation_status']!=='confirmed'||$payment['transaction_status']!=='unpaid')throw new DomainException('This reservation is no longer awaiting its advance payment.');
  $pdo->prepare("UPDATE payment SET payment_status='completed' WHERE payment_id=? AND payment_status='pending'")->execute([$paymentId]);$pdo->prepare("UPDATE reservation SET transaction_status='partially_paid' WHERE reservation_id=? AND transaction_status='unpaid'")->execute([$payment['reservation_id']]);
 }else{
  if($payment['reservation_status']!=='ready'||$payment['transaction_status']!=='partially_paid'||(int)$payment['completed_advance_count']!==1||abs((float)$payment['completed_advance_amount']-$advance)>0.01)throw new DomainException('This reservation is not eligible for final-payment confirmation.');
  $pdo->prepare("UPDATE payment SET payment_status='completed' WHERE payment_id=? AND payment_status='pending'")->execute([$paymentId]);$ledger=$pdo->prepare("SELECT COUNT(*) payment_count,COALESCE(SUM(amount),0) paid_total FROM payment WHERE reservation_id=? AND payment_type IN ('advance','final') AND payment_status='completed'");$ledger->execute([$payment['reservation_id']]);$totals=$ledger->fetch(PDO::FETCH_ASSOC);
  if((int)$totals['payment_count']!==2||abs((float)$totals['paid_total']-$total)>0.01)throw new DomainException('The completed payment ledger does not match the frozen order total.');$pdo->prepare("UPDATE reservation SET transaction_status='paid' WHERE reservation_id=? AND transaction_status='partially_paid'")->execute([$payment['reservation_id']]);
 }
 $pdo->commit();require_once __DIR__.'/../../../create_notification.php';$stage=$payment['payment_type']==='advance'?'Advance':'Final';$data=json_encode(['paymentId'=>$paymentId,'orderId'=>(int)$payment['reservation_id'],'source'=>$payment['reservation_source'],'link'=>'/buyer/BuyerOrderHistory']);
 if($action==='confirm')create_notification((int)$payment['buyer_user_id'],'Bank Payment Confirmed',"Your Bank {$stage} payment for order ORD{$payment['reservation_id']} ({$payment['crop_name']}) was confirmed.",'bankPaymentConfirmed',$data);else create_notification((int)$payment['buyer_user_id'],'Bank Payment Rejected',"Your Bank {$stage} payment for order ORD{$payment['reservation_id']} was rejected. You may submit another receipt.",'bankPaymentRejected',$data);
 echo json_encode(['success'=>true,'message'=>$action==='confirm'?'Bank payment confirmed.':'Bank payment rejected.']);
}catch(DomainException $e){if($pdo->inTransaction())$pdo->rollBack();http_response_code(409);echo json_encode(['success'=>false,'message'=>$e->getMessage()]);}catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();error_log('Bank payment verification failed: '.$e->getMessage());http_response_code(500);echo json_encode(['success'=>false,'message'=>'Unable to verify the Bank payment.']);}

