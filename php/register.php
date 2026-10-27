<?php

include "db.php";

if ($_SERVER["REQUEST_METHOD"] == "POST") {

    $name = $_POST["name"];
    $email = $_POST["email"];
    $password = $_POST["password"];

    if (empty($name) || empty($email) || empty($password)) {
        die("Please fill all fields.");
    }

    $password = password_hash($password, PASSWORD_DEFAULT);

    $sql = "INSERT INTO users (name, email, password, role)
            VALUES (?, ?, ?, 'customer')";

    $stmt = $conn->prepare($sql);

    $stmt->bind_param("sss", $name, $email, $password);

    if ($stmt->execute()) {

        echo "Registration Successful!";

        header("refresh:2;url=../login.html");

    } else {

        echo "Registration Failed: " . $conn->error;

    }

    $stmt->close();
    $conn->close();
}

?>