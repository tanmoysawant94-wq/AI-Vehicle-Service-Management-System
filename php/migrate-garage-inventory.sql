USE vehicle_service;

CREATE TABLE IF NOT EXISTS garages (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    address VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL DEFAULT '',
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_garages_name_address (name, address)
);

CREATE TABLE IF NOT EXISTS garage_services (
    garage_id BIGINT UNSIGNED NOT NULL,
    service_name VARCHAR(80) NOT NULL,
    PRIMARY KEY (garage_id, service_name),
    CONSTRAINT fk_garage_services_garage FOREIGN KEY (garage_id) REFERENCES garages(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mechanics (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    garage_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL DEFAULT '',
    phone VARCHAR(30) NOT NULL DEFAULT '',
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mechanics_garage FOREIGN KEY (garage_id) REFERENCES garages(id) ON DELETE RESTRICT,
    INDEX idx_mechanics_garage (garage_id)
);

CREATE TABLE IF NOT EXISTS mechanic_services (
    mechanic_id BIGINT UNSIGNED NOT NULL,
    service_name VARCHAR(80) NOT NULL,
    PRIMARY KEY (mechanic_id, service_name),
    CONSTRAINT fk_mechanic_services_mechanic FOREIGN KEY (mechanic_id) REFERENCES mechanics(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS parts_inventory (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(40) NOT NULL UNIQUE,
    part_name VARCHAR(120) NOT NULL,
    stock_quantity INT UNSIGNED NOT NULL DEFAULT 0,
    unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

SET @migration_sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'service_bookings' AND COLUMN_NAME = 'assigned_garage_id') = 0,
    'ALTER TABLE service_bookings ADD COLUMN assigned_garage_id BIGINT UNSIGNED NULL',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'service_bookings' AND COLUMN_NAME = 'assigned_mechanic_id') = 0,
    'ALTER TABLE service_bookings ADD COLUMN assigned_mechanic_id BIGINT UNSIGNED NULL',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'service_parts' AND COLUMN_NAME = 'inventory_item_id') = 0,
    'ALTER TABLE service_parts ADD COLUMN inventory_item_id BIGINT UNSIGNED NULL',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @migration_sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'service_parts' AND COLUMN_NAME = 'quantity') = 0,
    'ALTER TABLE service_parts ADD COLUMN quantity INT UNSIGNED NOT NULL DEFAULT 1',
    'SELECT 1'
);
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;
