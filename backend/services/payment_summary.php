<?php
declare(strict_types=1);

function resolve_payment_summary(PDO $pdo,array $order):array
{
    $stmt=$pdo->prepare("SELECT payment_id,payment_type,amount,method,payment_status,payment_date FROM payment WHERE reservation_id=? ORDER BY payment_date,payment_id");
    $stmt->execute([$order['reservation_id']]);$payments=$stmt->fetchAll(PDO::FETCH_ASSOC);$advance=0.0;$final=0.0;$completed=[];
    foreach($payments as &$p){$p['payment_id']=(int)$p['payment_id'];$p['amount']=(float)$p['amount'];if($p['payment_status']==='completed'&&in_array($p['payment_type'],['advance','final'],true)){$completed[]=$p;if($p['payment_type']==='advance')$advance+=$p['amount'];else$final+=$p['amount'];}}unset($p);
    $total=$advance+$final;$expected=(float)$order['total_amount'];$hasAdvance=false;$hasFinal=false;foreach($completed as$p){$hasAdvance=$hasAdvance||$p['payment_type']==='advance';$hasFinal=$hasFinal||$p['payment_type']==='final';}
    $eligible=$order['transaction_status']==='paid'&&$hasAdvance&&$hasFinal&&abs($total-$expected)<=0.01;
    return ['payments'=>$payments,'advance_amount'=>$advance,'final_amount'=>$final,'total_paid'=>$total,'expected_total'=>$expected,'payment_complete'=>$eligible,'receipt_url'=>$eligible?'/backend/download_payment_receipt.php?reservation_id='.$order['reservation_id']:null];
}
