<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Get JSON data from request body
$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
    exit();
}

// Extract form data
$name = isset($data['name']) ? trim($data['name']) : '';
$phone = isset($data['phone']) ? trim($data['phone']) : '';
$email = isset($data['email']) ? trim($data['email']) : '';
$service = isset($data['service']) ? trim($data['service']) : '';
$week = isset($data['week']) ? trim($data['week']) : '';
$message = isset($data['message']) ? trim($data['message']) : '';

// Validate required fields
if (empty($phone) && empty($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Phone or email is required']);
    exit();
}

// Email configuration
$to = 'shachar.oz@gmail.com'; 
$subject = 'New contact form submission from Dr. Yuval Oz website';

// Email body
$email_body = "New contact form submission:\n\n";
$email_body .= "Name: " . htmlspecialchars($name) . "\n";
$email_body .= "Phone: " . htmlspecialchars($phone) . "\n";
$email_body .= "Email: " . htmlspecialchars($email) . "\n";
$email_body .= "Service: " . htmlspecialchars($service) . "\n";
$email_body .= "Pregnancy week: " . htmlspecialchars($week) . "\n";
$email_body .= "Message: " . htmlspecialchars($message) . "\n";

// Email headers
$headers = "From: noreply@drozyuval.com\r\n";
$headers .= "Reply-To: " . (!empty($email) ? $email : 'noreply@drozyuval.com') . "\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// Send email
try {
    $success = mail($to, $subject, $email_body, $headers);
    
    if ($success) {
        echo json_encode(['success' => true, 'message' => 'Email sent successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to send email']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Email sending error: ' . $e->getMessage()]);
}
?>
