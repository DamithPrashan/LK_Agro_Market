<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once __DIR__ . '/../../../connection/db.php';
require_once __DIR__ . '/../../auth_check.php';

require_login();

$user_id = $_SESSION['user']['id'];

try {

    // Get logged in farmer
    $farmer = $pdo->prepare("
        SELECT farmer_id
        FROM farmer
        WHERE user_id = ?
    ");

    $farmer->execute([$user_id]);

    $farmer = $farmer->fetch(PDO::FETCH_ASSOC);

    if(!$farmer){
        echo json_encode([
            "success"=>false,
            "message"=>"Farmer not found."
        ]);
        exit;
    }

    $farmer_id = $farmer["farmer_id"];

    $data = json_decode(file_get_contents("php://input"), true);

    $crop_id = $data["crop_id"] ?? 0;

    if($crop_id == 0){
        echo json_encode([
            "success"=>false,
            "message"=>"Invalid Crop."
        ]);
        exit;
    }

    // Soft-remove only the farmer's own crop so order/payment history remains.
    $stmt = $pdo->prepare("
        UPDATE crop SET crop_status='removed'
        WHERE crop_id=?
        AND farmer_id=?
        AND crop_status <> 'removed'
    ");

    $stmt->execute([
        $crop_id,
        $farmer_id
    ]);

    if($stmt->rowCount()>0){

        echo json_encode([
            "success"=>true,
            "message"=>"Crop listing removed successfully."
        ]);

    }else{

        echo json_encode([
            "success"=>false,
            "message"=>"Crop not found."
        ]);

    }

}catch(PDOException $e){

    echo json_encode([
        "success"=>false,
        "message"=>$e->getMessage()
    ]);

}
