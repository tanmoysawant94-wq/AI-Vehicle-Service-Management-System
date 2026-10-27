<?php

session_start();

$host = "localhost";
$username = "root";
$password = "";
$database = "vehicle_service";

$conn = new mysqli($host, $username, $password, $database);

if ($conn->connect_error) {
    die("Database Connection Failed: " . $conn->connect_error);
}

$conn->set_charset("utf8mb4");

?>