<?php
declare(strict_types=1);

const COMPLAINT_EVIDENCE_MAX_BYTES = 5242880;
const COMPLAINT_CROP_EVIDENCE_TYPES = ['crop_full_view','crop_issue_closeup','crop_quantity_packaging'];

function complaint_reason_requires_crop_photos(string $reason): bool
{
    return in_array($reason, ['Crop quality does not match listing','Wrong Quantity','Damaged Product','Misleading Listing or Agreement Information'], true);
}

function store_complaint_upload(array $file, string $prefix): array
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) throw new DomainException('Evidence upload failed.');
    $size=(int)($file['size']??0);if($size<=0||$size>COMPLAINT_EVIDENCE_MAX_BYTES)throw new DomainException('Each evidence file must be 5 MB or smaller.');
    $ext=strtolower(pathinfo((string)($file['name']??''),PATHINFO_EXTENSION));
    $allowed=['jpg'=>'image/jpeg','jpeg'=>'image/jpeg','png'=>'image/png','pdf'=>'application/pdf'];
    if(!isset($allowed[$ext])||!class_exists('finfo'))throw new DomainException('Evidence must be a JPG, PNG, or PDF file.');
    $mime=(new finfo(FILEINFO_MIME_TYPE))->file((string)$file['tmp_name']);
    if(!is_string($mime)||$mime!==$allowed[$ext])throw new DomainException('The evidence file content does not match its extension.');
    $dir=dirname(__DIR__).'/uploads';if(!is_dir($dir)&&!mkdir($dir,0755,true)&&!is_dir($dir))throw new RuntimeException('Unable to prepare evidence storage.');
    $name=$prefix.'_'.bin2hex(random_bytes(16)).'.'.$ext;$absolute=$dir.DIRECTORY_SEPARATOR.$name;
    if(!move_uploaded_file((string)$file['tmp_name'],$absolute))throw new RuntimeException('Unable to store evidence.');
    $hash=hash_file('sha256',$absolute);if(!is_string($hash)){@unlink($absolute);throw new RuntimeException('Unable to hash evidence.');}
    return ['file_path'=>'backend/uploads/'.$name,'absolute_path'=>$absolute,'original_filename'=>basename((string)$file['name']),'mime_type'=>$mime,'file_size'=>$size,'file_hash'=>$hash];
}

function insert_complaint_evidence(PDO $pdo,int $complaintId,string $role,string $type,array $stored):void
{
    $stmt=$pdo->prepare('INSERT INTO complaint_evidence(complaint_id,uploader_role,evidence_type,file_path,original_filename,mime_type,file_size,file_hash) VALUES(?,?,?,?,?,?,?,?)');
    $stmt->execute([$complaintId,$role,$type,$stored['file_path'],$stored['original_filename'],$stored['mime_type'],$stored['file_size'],$stored['file_hash']]);
}

function get_complaint_evidence(PDO $pdo,int $complaintId):array
{
    $stmt=$pdo->prepare('SELECT uploader_role,evidence_type,file_path,original_filename,mime_type,file_size,file_hash,uploaded_at FROM complaint_evidence WHERE complaint_id=? ORDER BY evidence_id');
    $stmt->execute([$complaintId]);$out=['buyer'=>[],'farmer'=>[]];
    foreach($stmt->fetchAll(PDO::FETCH_ASSOC) as $row){$role=$row['uploader_role'];$type=$row['evidence_type'];$row['url']='/'.ltrim($row['file_path'],'/');$out[$role][$type]=$row;}
    return $out;
}
