<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/connection/db.php';

const MIGRATION_LOCK_NAME = 'lk_agro_market_migrations';

function table_exists(PDO $pdo, string $table): bool
{
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?');
    $stmt->execute([$table]);
    return (int)$stmt->fetchColumn() === 1;
}

function column_exists(PDO $pdo, string $table, string $column): bool
{
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?');
    $stmt->execute([$table, $column]);
    return (int)$stmt->fetchColumn() === 1;
}

function index_exists(PDO $pdo, string $table, string $index): bool
{
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?');
    $stmt->execute([$table, $index]);
    return (int)$stmt->fetchColumn() > 0;
}

function constraint_exists(PDO $pdo, string $table, string $constraint): bool
{
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?');
    $stmt->execute([$table, $constraint]);
    return (int)$stmt->fetchColumn() === 1;
}

function column_is_nullable(PDO $pdo, string $table, string $column): bool
{
    $stmt = $pdo->prepare('SELECT IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?');
    $stmt->execute([$table, $column]);
    return $stmt->fetchColumn() === 'YES';
}

function migration_is_reflected(PDO $pdo, string $name): bool
{
    return match ($name) {
        '2026_08_21_cultivation_growing_period_transition.sql' =>
            column_exists($pdo, 'cultivation_ad', 'timing_model') &&
            column_exists($pdo, 'cultivation_ad', 'growing_period_days') &&
            column_exists($pdo, 'cultivation_ad', 'cultivation_started_at') &&
            column_is_nullable($pdo, 'cultivation_ad', 'expected_harvest_date') &&
            constraint_exists($pdo, 'cultivation_ad', 'chk_cultivation_ad_growing_period_positive') &&
            constraint_exists($pdo, 'cultivation_ad', 'chk_cultivation_ad_timing_model') &&
            column_exists($pdo, 'cultivation_request', 'agreed_growing_period_days') &&
            column_is_nullable($pdo, 'cultivation_request', 'requested_collection_date') &&
            constraint_exists($pdo, 'cultivation_request', 'chk_cultivation_request_agreed_growing_period_positive') &&
            column_is_nullable($pdo, 'reservation', 'collection_date'),
        '2026_08_21_user_account_status.sql' => column_exists($pdo, 'user', 'account_status'),
        '2026_08_21_cultivation_planned_start_date.sql' => column_exists($pdo, 'cultivation_ad', 'planned_start_date'),
        '2026_08_17_complaint_workflow.sql' =>
            column_exists($pdo, 'complaints', 'farmer_evidence_file') &&
            column_exists($pdo, 'complaints', 'farmer_response_requested_at') &&
            column_exists($pdo, 'complaints', 'farmer_response_deadline'),
        '2026_08_18_complaint_reminders.sql' =>
            column_exists($pdo, 'complaints', 'farmer_24h_reminder_sent_at') &&
            column_exists($pdo, 'complaints', 'farmer_overdue_reminder_sent_at'),
        '2026_08_18_cultivation_ads.sql' =>
            table_exists($pdo, 'cultivation_ad') && table_exists($pdo, 'cultivation_ad_photos'),
        '2026_08_18_cultivation_requests.sql' =>
            table_exists($pdo, 'cultivation_request') &&
            column_exists($pdo, 'notifications', 'type') && column_exists($pdo, 'notifications', 'data'),
        '2026_08_18_reserve_crop_order_statuses.sql' => (function () use ($pdo): bool {
            $stmt = $pdo->prepare("SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='reserve_crop' AND COLUMN_NAME='status'");
            $stmt->execute();
            $type = (string)$stmt->fetchColumn();
            return str_contains($type, "'ready'") && str_contains($type, "'completed'");
        })(),
        '2026_08_18_unique_reservation_payment_type.sql' => index_exists($pdo, 'payment', 'uq_payment_reservation_type'),
        '2026_08_18_unique_pending_cultivation_request.sql' => index_exists($pdo, 'cultivation_request', 'uq_cultivation_request_pending'),
        '2026_08_18_cultivation_reservation_bridge.sql' =>
            column_exists($pdo, 'reservation', 'reservation_source') &&
            column_exists($pdo, 'reservation', 'cultivation_request_id') &&
            index_exists($pdo, 'reservation', 'uq_reservation_cultivation_request'),
        '2026_08_18_phase1_4_integrity_hardening.sql' =>
            constraint_exists($pdo, 'cultivation_ad', 'chk_cultivation_ad_unit') &&
            constraint_exists($pdo, 'cultivation_request', 'chk_cultivation_request_agreed_price') &&
            constraint_exists($pdo, 'cultivation_request', 'chk_cultivation_request_accepted_snapshot'),
        '2026_08_18_rating_source_hardening.sql' =>
            column_is_nullable($pdo, 'ratings_review', 'crop_id') &&
            index_exists($pdo, 'ratings_review', 'uq_ratings_reservation_reviewer') &&
            constraint_exists($pdo, 'ratings_review', 'chk_ratings_review_value'),
        default => false,
    };
}

$pdo->exec("CREATE TABLE IF NOT EXISTS migrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

$lock = $pdo->query("SELECT GET_LOCK('" . MIGRATION_LOCK_NAME . "', 10)")->fetchColumn();
if ((int)$lock !== 1) {
    fwrite(STDERR, "Unable to acquire the migration lock.\n");
    exit(1);
}

try {
    $sqlFiles = glob(__DIR__ . '/migrations/*.sql') ?: [];
    $phpFiles = glob(__DIR__ . '/migrations/*.php') ?: [];
    $files = array_merge($sqlFiles, $phpFiles);
    sort($files, SORT_STRING);
    $applied = $pdo->query('SELECT migration_name FROM migrations')->fetchAll(PDO::FETCH_COLUMN);
    $appliedMap = array_fill_keys($applied, true);
    $record = $pdo->prepare('INSERT INTO migrations (migration_name) VALUES (?)');
    $changed = 0;

    foreach ($files as $file) {
        $name = basename($file);
        if (isset($appliedMap[$name])) {
            echo "Skipped: $name\n";
            continue;
        }

        if (migration_is_reflected($pdo, $name)) {
            $record->execute([$name]);
            echo "Bootstrapped: $name\n";
            $changed++;
            continue;
        }

        try {
            if (str_ends_with($name, '.php')) {
                $migration = require $file;
                if (!is_callable($migration)) {
                    throw new RuntimeException("PHP migration must return a callable: $name");
                }
                $migration($pdo);
            } else {
                $sql = trim((string)file_get_contents($file));
                if ($sql === '') {
                    throw new RuntimeException("Migration is empty: $name");
                }
                $pdo->exec($sql);
            }
            $record->execute([$name]);
            echo "Applied: $name\n";
            $changed++;
        } catch (Throwable $error) {
            fwrite(STDERR, "Failed: $name\n{$error->getMessage()}\n");
            exit(1);
        }
    }

    echo $changed === 0 ? "No pending migrations.\n" : "Migration run complete.\n";
} finally {
    $pdo->query("SELECT RELEASE_LOCK('" . MIGRATION_LOCK_NAME . "')");
}
