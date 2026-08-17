<?php

function logAdminActivity(
    $pdo,
    $activityType,
    $title,
    $description = null,
    $referenceId = null,
    $adminId = null
) {

    try {

        $stmt = $pdo->prepare("
            INSERT INTO admin_activity
            (
                admin_id,
                activity_type,
                title,
                description,
                reference_id
            )
            VALUES
            (?, ?, ?, ?, ?)
        ");


        $stmt->execute([
            $adminId,
            $activityType,
            $title,
            $description,
            $referenceId
        ]);


        return true;


    } catch (PDOException $e) {

        error_log(
            "Admin activity log error: " .
            $e->getMessage()
        );

        return false;
    }
}

?>