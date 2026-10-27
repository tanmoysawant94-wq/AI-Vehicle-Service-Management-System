<?php

require_once __DIR__ . "/db.php";

function oauth_fail($message) {
    header("Location: ../login.html?oauth_error=" . rawurlencode($message));
    exit;
}

function oauth_http_request($url, $method = "GET", $headers = [], $fields = null) {
    $curl = curl_init($url);
    $options = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_HTTPHEADER => $headers
    ];
    if ($method === "POST") {
        $options[CURLOPT_POST] = true;
        $options[CURLOPT_POSTFIELDS] = http_build_query($fields);
    }
    curl_setopt_array($curl, $options);
    $body = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $error = curl_error($curl);
    curl_close($curl);
    if ($body === false || $status < 200 || $status >= 300) {
        error_log("OAuth HTTP request failed (" . $status . "): " . $error);
        throw new RuntimeException("The identity provider could not complete sign-in. Please try again.");
    }
    $decoded = json_decode($body, true);
    if (!is_array($decoded)) {
        throw new RuntimeException("The identity provider returned an invalid response.");
    }
    return $decoded;
}

function provider_identity($provider, $code, $config, $redirect_uri) {
    if ($provider === "google") {
        $token = oauth_http_request(
            "https://oauth2.googleapis.com/token",
            "POST",
            ["Accept: application/json"],
            [
                "code" => $code,
                "client_id" => $config["google_client_id"],
                "client_secret" => $config["google_client_secret"],
                "redirect_uri" => $redirect_uri,
                "grant_type" => "authorization_code"
            ]
        );
        if (empty($token["access_token"])) {
            throw new RuntimeException("Google did not return an access token.");
        }
        $profile = oauth_http_request(
            "https://openidconnect.googleapis.com/v1/userinfo",
            "GET",
            ["Authorization: Bearer " . $token["access_token"], "Accept: application/json"]
        );
        if (empty($profile["sub"]) || empty($profile["email"]) ||
            !filter_var($profile["email"], FILTER_VALIDATE_EMAIL) ||
            !in_array($profile["email_verified"] ?? false, [true, "true", 1, "1"], true)) {
            throw new RuntimeException("Google must provide a verified email address.");
        }
        return [
            "email" => strtolower($profile["email"]),
            "name" => trim($profile["name"] ?? "") ?: $profile["email"]
        ];
    }

    $token = oauth_http_request(
        "https://github.com/login/oauth/access_token",
        "POST",
        ["Accept: application/json"],
        [
            "client_id" => $config["github_client_id"],
            "client_secret" => $config["github_client_secret"],
            "code" => $code,
            "redirect_uri" => $redirect_uri
        ]
    );
    if (empty($token["access_token"])) {
        throw new RuntimeException("GitHub did not return an access token.");
    }
    $headers = [
        "Authorization: Bearer " . $token["access_token"],
        "Accept: application/vnd.github+json",
        "X-GitHub-Api-Version: 2022-11-28",
        "User-Agent: Vehicle-Service-Management-System"
    ];
    $profile = oauth_http_request("https://api.github.com/user", "GET", $headers);
    $emails = oauth_http_request("https://api.github.com/user/emails", "GET", $headers);
    if (!is_array($emails)) {
        throw new RuntimeException("GitHub did not return email details.");
    }
    $verified_email = null;
    foreach ($emails as $entry) {
        if (!empty($entry["verified"]) && !empty($entry["email"]) &&
            filter_var($entry["email"], FILTER_VALIDATE_EMAIL)) {
            if (!empty($entry["primary"])) {
                $verified_email = $entry["email"];
                break;
            }
            $verified_email = $verified_email ?: $entry["email"];
        }
    }
    if (!$verified_email) {
        throw new RuntimeException("Add and verify an email address in GitHub before signing in.");
    }
    return [
        "email" => strtolower($verified_email),
        "name" => trim($profile["name"] ?? "") ?: trim($profile["login"] ?? "") ?: $verified_email
    ];
}

function establish_oauth_session($conn, $identity) {
    $email = $identity["email"];
    $stmt = $conn->prepare("SELECT id, name, email, role FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$user) {
        $name = mb_substr($identity["name"], 0, 100, "UTF-8");
        $random_password = password_hash(bin2hex(random_bytes(32)), PASSWORD_DEFAULT);
        $stmt = $conn->prepare(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'customer')"
        );
        $stmt->bind_param("sss", $name, $email, $random_password);
        if (!$stmt->execute()) {
            $stmt->close();
            throw new RuntimeException("Unable to create your account. Please try again.");
        }
        $user_id = $stmt->insert_id;
        $stmt->close();
        $user = [
            "id" => $user_id,
            "name" => $name,
            "email" => $email,
            "role" => "customer"
        ];
    }

    session_regenerate_id(true);
    $_SESSION["user_id"] = (int)$user["id"];
    $_SESSION["name"] = $user["name"];
    $_SESSION["email"] = $user["email"];
    $_SESSION["role"] = $user["role"] ?: "customer";
    header("Location: " . (
        in_array($_SESSION["role"], ["employee", "admin"], true)
            ? "../service-desk.html"
            : "../customer/dashboard.html"
    ));
    exit;
}

$config_path = __DIR__ . "/oauth-config.php";
if (!is_file($config_path)) {
    oauth_fail("Social sign-in is not configured. Contact the site administrator.");
}
$config = require $config_path;
$provider = $_GET["provider"] ?? ($_SESSION["oauth_provider"] ?? "");
$allowed_providers = ["google", "github"];
if (!in_array($provider, $allowed_providers, true)) {
    oauth_fail("Choose Google or GitHub to sign in.");
}

$base_url = rtrim($config["base_url"] ?? "", "/");
if (!filter_var($base_url, FILTER_VALIDATE_URL) ||
    !in_array(parse_url($base_url, PHP_URL_SCHEME), ["http", "https"], true)) {
    oauth_fail("Social sign-in has an invalid callback URL configuration.");
}
$redirect_uri = $base_url . "/php/oauth.php";
$client_id_key = $provider . "_client_id";
$client_secret_key = $provider . "_client_secret";
if (empty($config[$client_id_key]) || empty($config[$client_secret_key])) {
    oauth_fail(ucfirst($provider) . " sign-in needs OAuth app credentials in php/oauth-config.php.");
}

if ($_SERVER["REQUEST_METHOD"] === "GET" && isset($_GET["code"])) {
    if (empty($_SESSION["oauth_state"]) || empty($_SESSION["oauth_provider"]) ||
        !is_string($_GET["state"] ?? null) ||
        !hash_equals($_SESSION["oauth_state"], $_GET["state"]) ||
        $_SESSION["oauth_provider"] !== $provider ||
        empty($_SESSION["oauth_started_at"]) ||
        time() - $_SESSION["oauth_started_at"] > 600) {
        unset($_SESSION["oauth_state"], $_SESSION["oauth_provider"], $_SESSION["oauth_started_at"]);
        oauth_fail("Sign-in expired or could not be verified. Please try again.");
    }
    unset($_SESSION["oauth_state"], $_SESSION["oauth_provider"], $_SESSION["oauth_started_at"]);
    try {
        if (!is_string($_GET["code"])) {
            throw new RuntimeException("The identity provider returned an invalid authorization code.");
        }
        $identity = provider_identity($provider, $_GET["code"], $config, $redirect_uri);
        establish_oauth_session($conn, $identity);
    } catch (Throwable $error) {
        error_log("OAuth callback failed: " . $error->getMessage());
        oauth_fail($error->getMessage());
    }
}

if (isset($_GET["error"])) {
    unset($_SESSION["oauth_state"], $_SESSION["oauth_provider"], $_SESSION["oauth_started_at"]);
    oauth_fail("Sign-in was cancelled or denied by " . ucfirst($provider) . ".");
}

$state = bin2hex(random_bytes(32));
$_SESSION["oauth_state"] = $state;
$_SESSION["oauth_provider"] = $provider;
$_SESSION["oauth_started_at"] = time();

if ($provider === "google") {
    $authorize_url = "https://accounts.google.com/o/oauth2/v2/auth?" . http_build_query([
        "client_id" => $config[$client_id_key],
        "redirect_uri" => $redirect_uri,
        "response_type" => "code",
        "scope" => "openid email profile",
        "state" => $state,
        "prompt" => "select_account"
    ]);
} else {
    $authorize_url = "https://github.com/login/oauth/authorize?" . http_build_query([
        "client_id" => $config[$client_id_key],
        "redirect_uri" => $redirect_uri,
        "scope" => "read:user user:email",
        "state" => $state
    ]);
}
header("Location: " . $authorize_url);
exit;
