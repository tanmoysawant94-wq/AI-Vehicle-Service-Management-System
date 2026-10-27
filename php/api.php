<?php

require_once __DIR__ . "/db.php";
header("Content-Type: application/json; charset=utf-8");

function respond($status, $body) {
    http_response_code($status);
    echo json_encode($body);
    exit;
}

function require_user() {
    if (empty($_SESSION["user_id"])) {
        respond(401, ["error" => "Please log in to continue."]);
    }
    global $conn;
    $user_id = (int)$_SESSION["user_id"];
    $stmt = $conn->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$user) {
        session_unset();
        session_destroy();
        respond(401, ["error" => "Your session has expired. Please log in again."]);
    }
    $_SESSION["role"] = $user["role"];
}

function require_staff() {
    require_user();
    if (!in_array($_SESSION["role"], ["employee", "admin"], true)) {
        respond(403, ["error" => "Staff access is required for service updates."]);
    }
}

function require_admin() {
    require_user();
    if ($_SESSION["role"] !== "admin") {
        respond(403, ["error" => "Administrator access is required for this action."]);
    }
}

function input_text($input, $key) {
    $value = $input[$key] ?? "";
    return is_string($value) ? trim($value) : "";
}

function read_request_payload() {
    $raw = file_get_contents("php://input");
    if (is_string($raw) && trim($raw) !== "") {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            return $decoded;
        }
    }
    return is_array($_POST) ? $_POST : [];
}

function booking_json($conn, $booking_id) {
    $stmt = $conn->prepare(
        "SELECT b.*, u.name AS customer_name, u.email AS customer_email,
                g.name AS garage_name, m.name AS mechanic_name
         FROM service_bookings b JOIN users u ON u.id = b.customer_id
         LEFT JOIN garages g ON g.id = b.assigned_garage_id
         LEFT JOIN mechanics m ON m.id = b.assigned_mechanic_id
         WHERE b.id = ?"
    );
    $stmt->bind_param("i", $booking_id);
    $stmt->execute();
    $booking = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$booking) {
        return null;
    }

    $stmt = $conn->prepare(
        "SELECT part_name, action, warranty_info, inventory_item_id, quantity
         FROM service_parts WHERE booking_id = ? ORDER BY id"
    );
    $stmt->bind_param("i", $booking_id);
    $stmt->execute();
    $booking["parts"] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    $stmt = $conn->prepare(
        "SELECT event_text, created_at FROM service_events WHERE booking_id = ? ORDER BY id"
    );
    $stmt->bind_param("i", $booking_id);
    $stmt->execute();
    $booking["events"] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    return $booking;
}

$action = $_GET["action"] ?? "";
$method = $_SERVER["REQUEST_METHOD"];

if ($action === "management-data" && $method === "GET") {
    require_admin();
    $garages = $conn->query(
        "SELECT g.id, g.name, g.address, g.phone, g.active,
                GROUP_CONCAT(gs.service_name ORDER BY gs.service_name SEPARATOR ',') AS services
         FROM garages g LEFT JOIN garage_services gs ON gs.garage_id = g.id
         GROUP BY g.id ORDER BY g.name"
    )->fetch_all(MYSQLI_ASSOC);
    $mechanics = $conn->query(
        "SELECT m.id, m.garage_id, m.name, m.email, m.phone, m.active, g.name AS garage_name,
                GROUP_CONCAT(ms.service_name ORDER BY ms.service_name SEPARATOR ',') AS services
         FROM mechanics m JOIN garages g ON g.id = m.garage_id
         LEFT JOIN mechanic_services ms ON ms.mechanic_id = m.id
         GROUP BY m.id ORDER BY g.name, m.name"
    )->fetch_all(MYSQLI_ASSOC);
    $inventory = $conn->query(
        "SELECT id, sku, part_name, stock_quantity, unit_cost
         FROM parts_inventory ORDER BY part_name"
    )->fetch_all(MYSQLI_ASSOC);
    respond(200, ["garages" => $garages, "mechanics" => $mechanics, "inventory" => $inventory]);
}

if ($action === "garage-save" && $method === "POST") {
    require_admin();
    $input = read_request_payload();
    $id = filter_var($input["id"] ?? null, FILTER_VALIDATE_INT);
    $name = input_text($input, "name");
    $address = input_text($input, "address");
    $phone = input_text($input, "phone");
    $services = $input["services"] ?? [];
    $active = filter_var($input["active"] ?? true, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    $allowed_services = ["General Service", "Oil Change", "Brake Service", "Battery Replacement", "Engine Repair", "AC Service", "Wheel Alignment", "Tyre Replacement"];
    if ($name === "" || strlen($name) > 120 || $address === "" || strlen($address) > 255 ||
        strlen($phone) > 30 || !is_array($services) || $active === null) {
        respond(400, ["error" => "Provide a garage name, address, valid phone, and supported services."]);
    }
    foreach ($services as $service) {
        if (!is_string($service) || !in_array($service, $allowed_services, true)) {
            respond(400, ["error" => "Garage services must use supported service names."]);
        }
    }
    $services = array_values(array_unique($services));
    $conn->begin_transaction();
    if ($id) {
        $stmt = $conn->prepare("SELECT id FROM garages WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $existing_garage = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        if (!$existing_garage) {
            $conn->rollback();
            respond(404, ["error" => "Garage not found."]);
        }
        $stmt = $conn->prepare("UPDATE garages SET name = ?, address = ?, phone = ?, active = ? WHERE id = ?");
        $stmt->bind_param("sssii", $name, $address, $phone, $active, $id);
        if (!$stmt->execute()) {
            $stmt->close();
            $conn->rollback();
            respond(500, ["error" => "Unable to update the garage."]);
        }
        $stmt->close();
        $garage_id = $id;
        $stmt = $conn->prepare("DELETE FROM garage_services WHERE garage_id = ?");
        $stmt->bind_param("i", $garage_id);
        if (!$stmt->execute()) {
            $stmt->close();
            $conn->rollback();
            respond(500, ["error" => "Unable to update garage services."]);
        }
        $stmt->close();
    } else {
        $stmt = $conn->prepare("INSERT INTO garages (name, address, phone, active) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("sssi", $name, $address, $phone, $active);
        if (!$stmt->execute()) {
            $stmt->close();
            $conn->rollback();
            respond(500, ["error" => "Unable to create the garage. Check if the garage already exists."]);
        }
        $garage_id = $stmt->insert_id;
        $stmt->close();
    }
    $stmt = $conn->prepare("INSERT INTO garage_services (garage_id, service_name) VALUES (?, ?)");
    foreach ($services as $service) {
        $stmt->bind_param("is", $garage_id, $service);
        if (!$stmt->execute()) {
            $stmt->close();
            $conn->rollback();
            respond(500, ["error" => "Unable to save garage services."]);
        }
    }
    $stmt->close();
    $conn->commit();
    respond(200, ["message" => "Garage saved.", "id" => $garage_id]);
}

if ($action === "mechanic-save" && $method === "POST") {
    require_admin();
    $input = read_request_payload();
    $id = filter_var($input["id"] ?? null, FILTER_VALIDATE_INT);
    $garage_id = filter_var($input["garage_id"] ?? null, FILTER_VALIDATE_INT);
    $name = input_text($input, "name");
    $email = input_text($input, "email");
    $phone = input_text($input, "phone");
    $services = $input["services"] ?? [];
    $active = filter_var($input["active"] ?? true, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    $allowed_services = ["General Service", "Oil Change", "Brake Service", "Battery Replacement", "Engine Repair", "AC Service", "Wheel Alignment", "Tyre Replacement"];
    if (!$garage_id || $name === "" || strlen($name) > 120 ||
        ($email !== "" && !filter_var($email, FILTER_VALIDATE_EMAIL)) || strlen($email) > 150 ||
        strlen($phone) > 30 || !is_array($services) || $active === null) {
        respond(400, ["error" => "Provide a garage, mechanic name, valid contact details, and supported services."]);
    }
    foreach ($services as $service) {
        if (!is_string($service) || !in_array($service, $allowed_services, true)) {
            respond(400, ["error" => "Mechanic services must use supported service names."]);
        }
    }
    $services = array_values(array_unique($services));
    $stmt = $conn->prepare("SELECT id FROM garages WHERE id = ? AND active = 1");
    $stmt->bind_param("i", $garage_id);
    $stmt->execute();
    $garage = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$garage) {
        respond(400, ["error" => "Choose an active garage."]);
    }
    if ($services) {
        $stmt = $conn->prepare("SELECT service_name FROM garage_services WHERE garage_id = ?");
        $stmt->bind_param("i", $garage_id);
        $stmt->execute();
        $garage_services = array_column($stmt->get_result()->fetch_all(MYSQLI_ASSOC), "service_name");
        $stmt->close();
        if (array_diff($services, $garage_services)) {
            respond(400, ["error" => "A mechanic can only offer services available at their garage."]);
        }
    }

    $conn->begin_transaction();
    if ($id) {
        $stmt = $conn->prepare("SELECT id FROM mechanics WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $existing_mechanic = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        if (!$existing_mechanic) {
            $conn->rollback();
            respond(404, ["error" => "Mechanic not found."]);
        }
        $stmt = $conn->prepare(
            "UPDATE mechanics SET garage_id = ?, name = ?, email = ?, phone = ?, active = ? WHERE id = ?"
        );
        $stmt->bind_param("isssii", $garage_id, $name, $email, $phone, $active, $id);
        if (!$stmt->execute()) {
            $stmt->close();
            $conn->rollback();
            respond(500, ["error" => "Unable to update the mechanic."]);
        }
        $stmt->close();
        $mechanic_id = $id;
        $stmt = $conn->prepare("DELETE FROM mechanic_services WHERE mechanic_id = ?");
        $stmt->bind_param("i", $mechanic_id);
        if (!$stmt->execute()) {
            $stmt->close();
            $conn->rollback();
            respond(500, ["error" => "Unable to update mechanic services."]);
        }
        $stmt->close();
    } else {
        $stmt = $conn->prepare(
            "INSERT INTO mechanics (garage_id, name, email, phone, active) VALUES (?, ?, ?, ?, ?)"
        );
        $stmt->bind_param("isssi", $garage_id, $name, $email, $phone, $active);
        if (!$stmt->execute()) {
            $stmt->close();
            $conn->rollback();
            respond(500, ["error" => "Unable to create the mechanic."]);
        }
        $mechanic_id = $stmt->insert_id;
        $stmt->close();
    }
    $stmt = $conn->prepare("INSERT INTO mechanic_services (mechanic_id, service_name) VALUES (?, ?)");
    foreach ($services as $service) {
        $stmt->bind_param("is", $mechanic_id, $service);
        if (!$stmt->execute()) {
            $stmt->close();
            $conn->rollback();
            respond(500, ["error" => "Unable to save mechanic services."]);
        }
    }
    $stmt->close();
    $conn->commit();
    respond(200, ["message" => "Mechanic saved.", "id" => $mechanic_id]);
}

if ($action === "inventory-save" && $method === "POST") {
    require_admin();
    $input = read_request_payload();
    $id = filter_var($input["id"] ?? null, FILTER_VALIDATE_INT);
    $sku = strtoupper(input_text($input, "sku"));
    $part_name = input_text($input, "part_name");
    $quantity = filter_var($input["stock_quantity"] ?? null, FILTER_VALIDATE_INT);
    $unit_cost = filter_var($input["unit_cost"] ?? null, FILTER_VALIDATE_FLOAT);
    if ($sku === "" || strlen($sku) > 40 || $part_name === "" || strlen($part_name) > 120 ||
        $quantity === false || $quantity < 0 || $unit_cost === false || $unit_cost < 0) {
        respond(400, ["error" => "Provide a part SKU, name, non-negative stock quantity, and valid unit cost."]);
    }
    if ($id) {
        $stmt = $conn->prepare("SELECT id FROM parts_inventory WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $existing_item = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        if (!$existing_item) {
            respond(404, ["error" => "Inventory item not found."]);
        }
        $stmt = $conn->prepare(
            "UPDATE parts_inventory SET sku = ?, part_name = ?, stock_quantity = ?, unit_cost = ? WHERE id = ?"
        );
        $stmt->bind_param("ssidi", $sku, $part_name, $quantity, $unit_cost, $id);
        if (!$stmt->execute()) {
            $stmt->close();
            respond(500, ["error" => "Unable to update the inventory item."]);
        }
    } else {
        $stmt = $conn->prepare(
            "INSERT INTO parts_inventory (sku, part_name, stock_quantity, unit_cost) VALUES (?, ?, ?, ?)"
        );
        $stmt->bind_param("ssid", $sku, $part_name, $quantity, $unit_cost);
        if (!$stmt->execute()) {
            $stmt->close();
            respond(500, ["error" => "Unable to add the part. Check if the SKU already exists."]);
        }
    }
    $stmt->close();
    respond(200, ["message" => "Inventory item saved."]);
}

if ($action === "inventory-use" && $method === "POST") {
    require_staff();
    $input = read_request_payload();
    $booking_id = filter_var($input["booking_id"] ?? null, FILTER_VALIDATE_INT);
    $inventory_id = filter_var($input["inventory_id"] ?? null, FILTER_VALIDATE_INT);
    $quantity = filter_var($input["quantity"] ?? null, FILTER_VALIDATE_INT);
    if (!$booking_id || !$inventory_id || $quantity === false || $quantity < 1) {
        respond(400, ["error" => "Choose a booking, inventory part, and quantity greater than zero."]);
    }
    $conn->begin_transaction();
    $stmt = $conn->prepare("SELECT id FROM service_bookings WHERE id = ? FOR UPDATE");
    $stmt->bind_param("i", $booking_id);
    $stmt->execute();
    $booking = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$booking) {
        $conn->rollback();
        respond(404, ["error" => "Booking not found."]);
    }
    $stmt = $conn->prepare(
        "SELECT id, part_name, stock_quantity FROM parts_inventory WHERE id = ? FOR UPDATE"
    );
    $stmt->bind_param("i", $inventory_id);
    $stmt->execute();
    $item = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$item || (int)$item["stock_quantity"] < $quantity) {
        $conn->rollback();
        respond(400, ["error" => "The selected part is missing or there is not enough stock."]);
    }
    $stmt = $conn->prepare("UPDATE parts_inventory SET stock_quantity = stock_quantity - ? WHERE id = ?");
    $stmt->bind_param("ii", $quantity, $inventory_id);
    if (!$stmt->execute()) {
        $stmt->close();
        $conn->rollback();
        respond(500, ["error" => "Unable to reduce parts stock."]);
    }
    $stmt->close();
    $action_name = "Installed";
    $warranty = "Recorded from inventory";
    $stmt = $conn->prepare(
        "INSERT INTO service_parts (booking_id, part_name, action, warranty_info, inventory_item_id, quantity)
         VALUES (?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param("isssii", $booking_id, $item["part_name"], $action_name, $warranty, $inventory_id, $quantity);
    if (!$stmt->execute()) {
        $stmt->close();
        $conn->rollback();
        respond(500, ["error" => "Unable to record the part against this booking."]);
    }
    $stmt->close();
    $conn->commit();
    respond(200, ["message" => "Part recorded and stock reduced.", "stock_quantity" => (int)$item["stock_quantity"] - $quantity]);
}

if ($action === "forgot-password" && $method === "POST") {
    $input = read_request_payload();
    $email = input_text($input, "email");
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        respond(400, ["error" => "Enter a valid email address."]);
    }

    $config_path = __DIR__ . "/password-reset-config.php";
    if (!is_file($config_path)) {
        error_log("Password reset configuration is missing.");
        respond(500, ["error" => "Password reset is not configured. Contact the site administrator."]);
    }
    $config = require $config_path;
    $base_url = rtrim($config["base_url"] ?? "", "/");
    $from_email = $config["from_email"] ?? "";
    $smtp_host = $config["smtp_host"] ?? "";
    $smtp_port = filter_var($config["smtp_port"] ?? null, FILTER_VALIDATE_INT);
    $smtp_username = $config["smtp_username"] ?? "";
    $smtp_password = $config["smtp_password"] ?? "";
    if (!filter_var($base_url, FILTER_VALIDATE_URL) ||
        !filter_var($from_email, FILTER_VALIDATE_EMAIL) ||
        !is_string($smtp_host) || $smtp_host === "" ||
        $smtp_port === false || $smtp_port < 1 || $smtp_port > 65535 ||
        !is_string($smtp_username) || !filter_var($smtp_username, FILTER_VALIDATE_EMAIL) ||
        !is_string($smtp_password) || $smtp_password === "") {
        respond(503, ["error" => "Add a Gmail App Password to php/password-reset-config.php before requesting a reset email."]);
    }
    $autoload_path = dirname(__DIR__) . "/vendor/autoload.php";
    if (!is_file($autoload_path)) {
        error_log("Password reset email dependency is missing. Run Composer install.");
        respond(500, ["error" => "Password reset email support is not installed. Contact the site administrator."]);
    }
    require_once $autoload_path;

    $generic_message = "If an account exists for that email, a reset link will be sent. If it doesn't arrive, contact the service center administrator to check outgoing email settings.";
    $stmt = $conn->prepare("SELECT id, name, email FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$user) {
        respond(200, ["message" => $generic_message]);
    }

    $token = bin2hex(random_bytes(32));
    $token_hash = hash("sha256", $token);
    $user_id = (int)$user["id"];
    $stmt = $conn->prepare(
        "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
         VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 HOUR))"
    );
    $stmt->bind_param("is", $user_id, $token_hash);
    if (!$stmt->execute()) {
        $stmt->close();
        respond(500, ["error" => "Unable to create a password reset link. Please try again."]);
    }
    $reset_id = $stmt->insert_id;
    $stmt->close();

    $reset_url = $base_url . "/reset-password.html?token=" . rawurlencode($token);
    $message = "Hello " . $user["name"] . ",\n\n"
        . "Use this link within one hour to choose a new password:\r\n"
        . $reset_url . "\n\n"
        . "If you did not request a password reset, you can ignore this email.\n";
    $mailer = new PHPMailer\PHPMailer\PHPMailer(true);
    try {
        $mailer->isSMTP();
        $mailer->Host = $smtp_host;
        $mailer->SMTPAuth = true;
        $mailer->Username = $smtp_username;
        $mailer->Password = $smtp_password;
        $mailer->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mailer->Port = $smtp_port;
        $mailer->CharSet = "UTF-8";
        $mailer->setFrom($from_email, $config["from_name"] ?? "Vehicle Service Management");
        $mailer->addAddress($user["email"], $user["name"]);
        $mailer->Subject = "Reset your Vehicle Service account password";
        $mailer->Body = $message;
        $mailer->send();
    } catch (PHPMailer\PHPMailer\Exception $error) {
        error_log("Unable to send password reset email for user ID " . $user_id . ": " . $mailer->ErrorInfo);
        $stmt = $conn->prepare("DELETE FROM password_reset_tokens WHERE id = ?");
        $stmt->bind_param("i", $reset_id);
        if (!$stmt->execute()) {
            $stmt->close();
            respond(500, ["error" => "Email could not be sent and the temporary reset link could not be removed. Contact the site administrator."]);
        }
        $stmt->close();
    }
    respond(200, ["message" => $generic_message]);
}

if ($action === "reset-password" && $method === "POST") {
    $input = read_request_payload();
    $token = $input["token"] ?? "";
    $password = $input["password"] ?? "";
    if (!is_string($token) || !preg_match("/\\A[a-f0-9]{64}\\z/", $token) ||
        !is_string($password) || strlen($password) < 8) {
        respond(400, ["error" => "Use a valid reset link and a password with at least 8 characters."]);
    }

    $token_hash = hash("sha256", $token);
    $conn->begin_transaction();
    $stmt = $conn->prepare(
        "SELECT id, user_id FROM password_reset_tokens
         WHERE token_hash = ? AND used_at IS NULL AND expires_at > UTC_TIMESTAMP()
         FOR UPDATE"
    );
    $stmt->bind_param("s", $token_hash);
    if (!$stmt->execute()) {
        $stmt->close();
        $conn->rollback();
        respond(500, ["error" => "Unable to validate the reset link. Please try again."]);
    }
    $reset = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$reset) {
        $conn->rollback();
        respond(400, ["error" => "This reset link is invalid, expired, or already used. Request a new one."]);
    }

    $new_hash = password_hash($password, PASSWORD_DEFAULT);
    $user_id = (int)$reset["user_id"];
    $stmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
    $stmt->bind_param("si", $new_hash, $user_id);
    if (!$stmt->execute() || $stmt->affected_rows !== 1) {
        $stmt->close();
        $conn->rollback();
        respond(500, ["error" => "Unable to update the password. Please try again."]);
    }
    $stmt->close();

    $stmt = $conn->prepare(
        "UPDATE password_reset_tokens SET used_at = UTC_TIMESTAMP()
         WHERE user_id = ? AND used_at IS NULL"
    );
    $stmt->bind_param("i", $user_id);
    if (!$stmt->execute()) {
        $stmt->close();
        $conn->rollback();
        respond(500, ["error" => "Unable to finish the password reset. Please try again."]);
    }
    $stmt->close();
    $conn->commit();
    respond(200, ["message" => "Your password has been updated. You can now sign in."]);
}

if ($action === "login" && $method === "POST") {
    $input = read_request_payload();
    if (!is_array($input)) {
        respond(400, ["error" => "Invalid login request."]);
    }
    $email = input_text($input, "email");
    $password = is_string($input["password"] ?? null) ? $input["password"] : "";
    if ($email === "" || $password === "") {
        respond(400, ["error" => "Email and password are required."]);
    }

    $stmt = $conn->prepare("SELECT id, name, email, password, role FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$user || !password_verify($password, $user["password"])) {
        respond(401, ["error" => "Email or password is incorrect."]);
    }

    session_regenerate_id(true);
    $_SESSION["user_id"] = (int)$user["id"];
    $_SESSION["name"] = $user["name"];
    $_SESSION["email"] = $user["email"];
    $_SESSION["role"] = $user["role"];
    respond(200, ["name" => $user["name"], "role" => $user["role"]]);
}

if ($action === "logout" && $method === "POST") {
    $_SESSION = [];
    session_destroy();
    respond(200, ["message" => "Logged out."]);
}

if ($action === "session" && $method === "GET") {
    if (empty($_SESSION["user_id"])) {
        respond(200, ["authenticated" => false]);
    }
    respond(200, [
        "authenticated" => true,
        "name" => $_SESSION["name"],
        "email" => $_SESSION["email"],
        "role" => $_SESSION["role"]
    ]);
}

require_user();

if ($action === "staff-options" && $method === "GET") {
    require_staff();
    $garages = $conn->query(
        "SELECT g.id, g.name,
                GROUP_CONCAT(gs.service_name ORDER BY gs.service_name SEPARATOR ',') AS services
         FROM garages g LEFT JOIN garage_services gs ON gs.garage_id = g.id
         WHERE g.active = 1 GROUP BY g.id ORDER BY g.name"
    )->fetch_all(MYSQLI_ASSOC);
    $mechanics = $conn->query(
        "SELECT m.id, m.garage_id, m.name, GROUP_CONCAT(ms.service_name ORDER BY ms.service_name SEPARATOR ',') AS services
         FROM mechanics m LEFT JOIN mechanic_services ms ON ms.mechanic_id = m.id
         WHERE m.active = 1 GROUP BY m.id ORDER BY m.name"
    )->fetch_all(MYSQLI_ASSOC);
    $inventory = $conn->query(
        "SELECT id, sku, part_name, stock_quantity
         FROM parts_inventory WHERE stock_quantity > 0 ORDER BY part_name"
    )->fetch_all(MYSQLI_ASSOC);
    respond(200, ["garages" => $garages, "mechanics" => $mechanics, "inventory" => $inventory]);
}

if ($action === "assign" && $method === "POST") {
    require_admin();
    $input = read_request_payload();
    $booking_id = filter_var($input["booking_id"] ?? null, FILTER_VALIDATE_INT);
    $garage_id = ($input["garage_id"] ?? "") === "" ? null : filter_var($input["garage_id"], FILTER_VALIDATE_INT);
    $mechanic_id = ($input["mechanic_id"] ?? "") === "" ? null : filter_var($input["mechanic_id"], FILTER_VALIDATE_INT);
    if (!$booking_id || $garage_id === false || $mechanic_id === false ||
        (($garage_id === null) !== ($mechanic_id === null))) {
        respond(400, ["error" => "Select a booking and assign both a garage and mechanic, or clear both assignments."]);
    }
    $stmt = $conn->prepare("SELECT id, service_type FROM service_bookings WHERE id = ?");
    $stmt->bind_param("i", $booking_id);
    $stmt->execute();
    $booking = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$booking) {
        respond(404, ["error" => "Booking not found."]);
    }
    if ($garage_id !== null) {
        $stmt = $conn->prepare(
            "SELECT m.id
             FROM mechanics m
             JOIN garage_services gs ON gs.garage_id = m.garage_id
             JOIN mechanic_services ms ON ms.mechanic_id = m.id AND ms.service_name = gs.service_name
             WHERE m.id = ? AND m.garage_id = ? AND m.active = 1
               AND gs.service_name = ? AND ms.service_name = ?"
        );
        $stmt->bind_param("iiss", $mechanic_id, $garage_id, $booking["service_type"], $booking["service_type"]);
        $stmt->execute();
        $available = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        if (!$available) {
            respond(400, ["error" => "That mechanic is not active at this garage for the booked service."]);
        }
    }
    $conn->begin_transaction();
    $stmt = $conn->prepare(
        "UPDATE service_bookings SET assigned_garage_id = ?, assigned_mechanic_id = ? WHERE id = ?"
    );
    $stmt->bind_param("iii", $garage_id, $mechanic_id, $booking_id);
    if (!$stmt->execute()) {
        $stmt->close();
        $conn->rollback();
        respond(500, ["error" => "Unable to assign the booking."]);
    }
    $stmt->close();
    $event_text = $garage_id === null ? "Garage and mechanic assignment cleared" : "Service assigned to garage and mechanic";
    $stmt = $conn->prepare("INSERT INTO service_events (booking_id, event_text) VALUES (?, ?)");
    $stmt->bind_param("is", $booking_id, $event_text);
    if (!$stmt->execute()) {
        $stmt->close();
        $conn->rollback();
        respond(500, ["error" => "Assignment saved but service history could not be recorded."]);
    }
    $stmt->close();
    $conn->commit();
    respond(200, ["booking" => booking_json($conn, $booking_id)]);
}

if ($action === "inventory" && $method === "GET") {
    require_staff();
    $inventory = $conn->query(
        "SELECT id, sku, part_name, stock_quantity, unit_cost
         FROM parts_inventory ORDER BY part_name"
    )->fetch_all(MYSQLI_ASSOC);
    respond(200, ["inventory" => $inventory]);
}

if ($action === "booking-garages" && $method === "GET") {
    require_user();
    $rows = $conn->query(
        "SELECT g.id, g.name, g.address,
                GROUP_CONCAT(gs.service_name ORDER BY gs.service_name SEPARATOR ',') AS services
         FROM garages g
         LEFT JOIN garage_services gs ON gs.garage_id = g.id
         WHERE g.active = 1
         GROUP BY g.id
         ORDER BY g.name"
    )->fetch_all(MYSQLI_ASSOC);
    foreach ($rows as &$garage) {
        $garage["id"] = (int)$garage["id"];
        $garage["services"] = $garage["services"] === null || $garage["services"] === ""
            ? []
            : explode(",", $garage["services"]);
    }
    unset($garage);
    respond(200, ["garages" => $rows]);
}

if ($action === "book" && $method === "POST") {
    require_user();
    if ($_SESSION["role"] !== "customer") {
        respond(403, ["error" => "Only customer accounts can book a service."]);
    }
    $input = read_request_payload();
    if (!is_array($input)) {
        respond(400, ["error" => "Invalid booking request."]);
    }
    $vehicle = input_text($input, "vehicle");
    $vehicle_number = strtoupper(input_text($input, "vehicle_number"));
    $garage_id = filter_var($input["garage_id"] ?? null, FILTER_VALIDATE_INT);
    $service = input_text($input, "service");
    $date = input_text($input, "date");
    $time = input_text($input, "time");
    $problem = input_text($input, "problem");
    $parsed_date = DateTime::createFromFormat("!Y-m-d", $date);
    $parsed_time = DateTime::createFromFormat("!H:i", $time);
    $estimates = [
        "General Service" => [3500, 120],
        "Oil Change" => [1800, 45],
        "Brake Service" => [4000, 60],
        "Battery Replacement" => [6500, 30],
        "Engine Repair" => [8000, 240],
        "AC Service" => [1800, 90],
        "Wheel Alignment" => [1200, 45],
        "Tyre Replacement" => [6000, 60]
    ];
    if ($vehicle === "" || $vehicle_number === "" || !$garage_id || $problem === "" ||
        !isset($estimates[$service]) || !$parsed_date || $parsed_date->format("Y-m-d") !== $date ||
        !$parsed_time || $parsed_time->format("H:i") !== $time || $date < date("Y-m-d")) {
        respond(400, ["error" => "Complete all booking fields with a valid future date and supported service."]);
    }
    $stmt = $conn->prepare(
        "SELECT g.name FROM garages g
         JOIN garage_services gs ON gs.garage_id = g.id
         WHERE g.id = ? AND g.active = 1 AND gs.service_name = ?"
    );
    $stmt->bind_param("is", $garage_id, $service);
    $stmt->execute();
    $garage = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$garage) {
        respond(400, ["error" => "Choose an active garage that offers the selected service."]);
    }
    [$cost, $minutes] = $estimates[$service];
    $code = "VS" . strtoupper(bin2hex(random_bytes(4)));
    $conn->begin_transaction();
    $stmt = $conn->prepare(
        "INSERT INTO service_bookings
         (booking_code, customer_id, vehicle_model, vehicle_number, service_type, preferred_date, preferred_time, problem_description, current_work, initial_estimated_cost, updated_estimated_cost, initial_estimated_minutes, updated_estimated_minutes, assigned_garage_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Service scheduled', ?, ?, ?, ?, ?)"
    );
    $customer_id = (int)$_SESSION["user_id"];
    $stmt->bind_param("sissssssddiii", $code, $customer_id, $vehicle, $vehicle_number, $service, $date, $time, $problem, $cost, $cost, $minutes, $minutes, $garage_id);
    if (!$stmt->execute()) {
        $stmt->close();
        $conn->rollback();
        respond(500, ["error" => "Unable to save the booking. Please try again."]);
    }
    $booking_id = $stmt->insert_id;
    $stmt->close();
    $event_text = "Service scheduled at " . $garage["name"];
    $stmt = $conn->prepare("INSERT INTO service_events (booking_id, event_text) VALUES (?, ?)");
    $stmt->bind_param("is", $booking_id, $event_text);
    if (!$stmt->execute()) {
        $stmt->close();
        $conn->rollback();
        respond(500, ["error" => "Unable to record the booking history."]);
    }
    $stmt->close();
    $conn->commit();
    respond(201, ["booking" => booking_json($conn, $booking_id)]);
}

if ($action === "list" && $method === "GET") {
    $is_staff = in_array($_SESSION["role"], ["employee", "admin"], true);
    $customer_id = (int)$_SESSION["user_id"];
    $sql = "SELECT id FROM service_bookings";
    if (!$is_staff) {
        $sql .= " WHERE customer_id = ?";
    }
    $sql .= " ORDER BY created_at DESC";
    $stmt = $conn->prepare($sql);
    if (!$is_staff) {
        $stmt->bind_param("i", $customer_id);
    }
    $stmt->execute();
    $ids = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    $bookings = [];
    foreach ($ids as $row) {
        $bookings[] = booking_json($conn, (int)$row["id"]);
    }
    respond(200, ["bookings" => $bookings]);
}

if ($action === "get" && $method === "GET") {
    $id = filter_input(INPUT_GET, "id", FILTER_VALIDATE_INT);
    $code = trim($_GET["code"] ?? "");
    $is_staff = in_array($_SESSION["role"], ["employee", "admin"], true);
    if (!$id && $code === "") {
        respond(400, ["error" => "A booking ID or booking code is required."]);
    }
    if ($id) {
        $stmt = $conn->prepare("SELECT id, customer_id FROM service_bookings WHERE id = ?");
        $stmt->bind_param("i", $id);
    } else {
        $stmt = $conn->prepare("SELECT id, customer_id FROM service_bookings WHERE booking_code = ?");
        $stmt->bind_param("s", $code);
    }
    $stmt->execute();
    $owner = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$owner || (!$is_staff && (int)$owner["customer_id"] !== (int)$_SESSION["user_id"])) {
        respond(404, ["error" => "Booking not found."]);
    }
    respond(200, ["booking" => booking_json($conn, (int)$owner["id"])]);
}

if ($action === "update" && $method === "POST") {
    require_staff();
    $input = read_request_payload();
    if (!is_array($input)) {
        respond(400, ["error" => "Invalid service update request."]);
    }
    $id = filter_var($input["id"] ?? null, FILTER_VALIDATE_INT);
    $status_values = ["Booked", "Inspection", "Awaiting Approval", "In Progress", "Quality Check", "Ready for Pickup", "Completed", "Cancelled"];
    $decision_values = ["Pending", "Repair", "Replace", "No repair needed"];
    $status = $input["status"] ?? "";
    $decision = $input["repair_decision"] ?? "";
    $work = input_text($input, "current_work");
    $notes = input_text($input, "mechanic_notes");
    $warranty = input_text($input, "warranty_info");
    $cost = filter_var($input["updated_estimated_cost"] ?? null, FILTER_VALIDATE_FLOAT);
    $minutes = filter_var($input["updated_estimated_minutes"] ?? null, FILTER_VALIDATE_INT);
    $progress = filter_var($input["progress"] ?? null, FILTER_VALIDATE_INT);
    $parts = $input["parts"] ?? [];
    if (!$id || !in_array($status, $status_values, true) || !in_array($decision, $decision_values, true) ||
        $work === "" || $cost === false || $cost < 0 || $minutes === false || $minutes < 0 ||
        $progress === false || $progress < 0 || $progress > 100 || !is_array($parts)) {
        respond(400, ["error" => "Service update contains invalid or missing fields."]);
    }
    $part_actions = ["Inspected", "Repaired", "Replaced", "Installed"];
    foreach ($parts as $part) {
        if (!is_array($part) || input_text($part, "part_name") === "" ||
            !in_array($part["action"] ?? "", $part_actions, true)) {
            respond(400, ["error" => "Each part needs a name and a valid service action."]);
        }
    }

    $stmt = $conn->prepare("SELECT id FROM service_bookings WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $exists = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$exists) {
        respond(404, ["error" => "Booking not found."]);
    }

    $conn->begin_transaction();
    $stmt = $conn->prepare(
        "UPDATE service_bookings SET status = ?, current_work = ?, progress = ?, repair_decision = ?,
         updated_estimated_cost = ?, updated_estimated_minutes = ?, warranty_info = ?, mechanic_notes = ?
         WHERE id = ?"
    );
    $stmt->bind_param("ssisdissi", $status, $work, $progress, $decision, $cost, $minutes, $warranty, $notes, $id);
    if (!$stmt->execute()) {
        $stmt->close();
        $conn->rollback();
        respond(500, ["error" => "Unable to update service details."]);
    }
    $stmt->close();

    $stmt = $conn->prepare(
        "DELETE FROM service_parts WHERE booking_id = ? AND inventory_item_id IS NULL"
    );
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $stmt->close();

    $stmt = $conn->prepare(
        "INSERT INTO service_parts (booking_id, part_name, action, warranty_info) VALUES (?, ?, ?, ?)"
    );
    foreach ($parts as $part) {
        $part_name = input_text($part, "part_name");
        $part_action = $part["action"];
        $part_warranty = input_text($part, "warranty_info");
        if ($part_warranty === "") {
            $part_warranty = "Not specified";
        }
        $stmt->bind_param("isss", $id, $part_name, $part_action, $part_warranty);
        if (!$stmt->execute()) {
            $stmt->close();
            $conn->rollback();
            respond(500, ["error" => "Unable to save installed-part details."]);
        }
    }
    $stmt->close();

    $event_text = $status . ": " . $work;
    $stmt = $conn->prepare("INSERT INTO service_events (booking_id, event_text) VALUES (?, ?)");
    $stmt->bind_param("is", $id, $event_text);
    if (!$stmt->execute()) {
        $stmt->close();
        $conn->rollback();
        respond(500, ["error" => "Unable to record the service history update."]);
    }
    $stmt->close();
    $conn->commit();
    respond(200, ["booking" => booking_json($conn, $id)]);
}

respond(404, ["error" => "Unknown service API action."]);
