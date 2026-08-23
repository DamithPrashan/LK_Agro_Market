# Database migrations

The project already includes a migration runner at `backend/migrate.php`. Team
members should normally use this runner instead of executing individual `.sql`
files manually.

## Apply migrations

Open the VS Code terminal at the project root, for example:

```text
D:\university\2.2\Project_repo\LK_Agro_Market
```

Then run:

```cmd
php backend/migrate.php
```

If PHP is not available in `PATH` and you use XAMPP, run:

```cmd
D:\xampp\php\php.exe backend/migrate.php
```

The runner finds `.sql` and `.php` files in `backend/migrations/`, runs pending migrations
in filename order, skips migrations already applied, and records successful
migrations in the database. It stops if a migration fails, so fix the reported
problem before running the same command again. The runner is designed to be run
again: migrations already recorded as successful will be skipped.

When everything has already been applied, the final output is:

```text
No pending migrations.
```

## Normal team workflow

1. Pull or clone the latest project.
2. Make sure MySQL/XAMPP is running.
3. Make sure the project's database configuration is correct.
4. Open the VS Code terminal at the `LK_Agro_Market` project root.
5. Run `php backend/migrate.php`.
6. Confirm that the migrations complete successfully.
7. If desired, run the command once more and confirm `No pending migrations.`

## Adding future migrations

Add a new, uniquely named `.sql` file to `backend/migrations/` and follow the
existing date-based naming convention, for example:

```text
2026_08_20_add_example_feature.sql
```

Never modify an already-applied migration just to introduce a new database
change. Create a new migration instead, then run:

```cmd
php backend/migrate.php
```

For migrations that must validate existing application records or safely carry
generated IDs across several related inserts, a `.php` migration may return a
callable accepting the shared `PDO` connection:

```php
<?php
return static function (PDO $pdo): void {
    // Validate prerequisites and apply the migration atomically.
};
```
