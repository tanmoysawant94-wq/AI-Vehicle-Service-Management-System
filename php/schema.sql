-- Safe to re-run after creating the vehicle_service database and users table.
USE vehicle_service;

-- Run this schema once. To grant staff access after creating an account:
-- UPDATE users SET role = 'employee' WHERE email = 'staff@example.com';
ALTER TABLE users
    MODIFY COLUMN role ENUM('customer', 'employee', 'admin') NOT NULL DEFAULT 'customer';

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

CREATE TABLE IF NOT EXISTS service_bookings (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    booking_code VARCHAR(20) NOT NULL UNIQUE,
    customer_id INT NOT NULL,
    vehicle_model VARCHAR(120) NOT NULL,
    vehicle_number VARCHAR(30) NOT NULL,
    service_type VARCHAR(80) NOT NULL,
    preferred_date DATE NOT NULL,
    preferred_time TIME NOT NULL,
    problem_description TEXT NOT NULL,
    status ENUM('Booked', 'Inspection', 'Awaiting Approval', 'In Progress', 'Quality Check', 'Ready for Pickup', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Booked',
    current_work VARCHAR(255) NOT NULL DEFAULT 'Booking received',
    progress TINYINT UNSIGNED NOT NULL DEFAULT 0,
    repair_decision ENUM('Pending', 'Repair', 'Replace', 'No repair needed') NOT NULL DEFAULT 'Pending',
    initial_estimated_cost DECIMAL(10,2) NOT NULL,
    updated_estimated_cost DECIMAL(10,2) NOT NULL,
    initial_estimated_minutes SMALLINT UNSIGNED NOT NULL,
    updated_estimated_minutes SMALLINT UNSIGNED NOT NULL,
    warranty_info VARCHAR(255) NOT NULL DEFAULT 'To be confirmed after inspection',
    mechanic_notes TEXT NOT NULL,
    assigned_garage_id BIGINT UNSIGNED NULL,
    assigned_mechanic_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_service_bookings_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_service_bookings_customer (customer_id),
    INDEX idx_service_bookings_status (status)
);

CREATE TABLE IF NOT EXISTS service_parts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT UNSIGNED NOT NULL,
    part_name VARCHAR(120) NOT NULL,
    action ENUM('Inspected', 'Repaired', 'Replaced', 'Installed') NOT NULL,
    warranty_info VARCHAR(255) NOT NULL DEFAULT 'Not specified',
    inventory_item_id BIGINT UNSIGNED NULL,
    quantity INT UNSIGNED NOT NULL DEFAULT 1,
    CONSTRAINT fk_service_parts_booking FOREIGN KEY (booking_id) REFERENCES service_bookings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS service_events (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT UNSIGNED NOT NULL,
    event_text VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_service_events_booking FOREIGN KEY (booking_id) REFERENCES service_bookings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_password_reset_tokens_user (user_id),
    INDEX idx_password_reset_tokens_expiry (expires_at)
);
