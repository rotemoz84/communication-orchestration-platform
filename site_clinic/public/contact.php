<?php
/**
 * Contact Form Backend for Dr. Yuval Oz Clinic
 * Handles Lead Generation: CSV logging and Email notification.
 */

// --- Configuration ---
$RECIPIENT_EMAIL = 'shachar.oz@gmail.com';
$CSV_FILENAME = 'leads.csv';
$SITE_NAME = 'Dr. Yuval Oz Clinic';

// --- Header Setup ---
header('Content-Type: application/json; charset=utf-8');

// --- Input Parsing ---
$inputJSON = file_get_contents('php://input');
$data = json_decode($inputJSON, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request data']);
    exit;
}

// --- Data Extraction ---
$name    = isset($data['name']) ? htmlspecialchars($data['name'], ENT_QUOTES, 'UTF-8') : 'לא צויין';
$phone   = isset($data['phone']) ? htmlspecialchars($data['phone'], ENT_QUOTES, 'UTF-8') : 'לא צויין';
$email   = isset($data['email']) ? filter_var($data['email'], FILTER_SANITIZE_EMAIL) : 'לא צויין';
$service = isset($data['service']) ? htmlspecialchars($data['service'], ENT_QUOTES, 'UTF-8') : 'לא צויין';
$week    = isset($data['week']) ? htmlspecialchars($data['week'], ENT_QUOTES, 'UTF-8') : 'לא צויין';
$message = isset($data['message']) ? htmlspecialchars($data['message'], ENT_QUOTES, 'UTF-8') : 'ללא הודעה';
$timestamp = date('Y-m-d H:i:s');

// --- 1. Log to CSV (Database) ---
$isNewFile = !file_exists($CSV_FILENAME);
$fileHandle = fopen($CSV_FILENAME, 'a');

// Add BOM for Hebrew support in Excel
if ($isNewFile) {
    fprintf($fileHandle, chr(0xEF).chr(0xBB).chr(0xBF));
    fputcsv($fileHandle, ['Timestamp', 'Name', 'Phone', 'Email', 'Service', 'Week', 'Message']);
}

fputcsv($fileHandle, [$timestamp, $name, $phone, $email, $service, $week, $message]);
fclose($fileHandle);

// --- 2. Send Email Notification ---
$subject = "פנייה חדשה מאתר: $name";
$emailContent = "
<html>
<head>
    <title>פנייה חדשה מהאתר</title>
</head>
<body dir='rtl' style='font-family: Arial, sans-serif;'>
    <h2>התקבלה פנייה חדשה באתר ד\"ר יובל עוז</h2>
    <table border='1' cellpadding='10' style='border-collapse: collapse;'>
        <tr><td><strong>זמן:</strong></td><td>$timestamp</td></tr>
        <tr><td><strong>שם מלא:</strong></td><td>$name</td></tr>
        <tr><td><strong>טלפון:</strong></td><td>$phone</td></tr>
        <tr><td><strong>אימייל:</strong></td><td>$email</td></tr>
        <tr><td><strong>שירות מבוקש:</strong></td><td>$service</td></tr>
        <tr><td><strong>שבוע הריון:</strong></td><td>$week</td></tr>
        <tr><td><strong>הודעה:</strong></td><td>$message</td></tr>
    </table>
</body>
</html>
";

$headers = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
$headers .= "From: website@example.com" . "\r\n"; // Update with a domain-based email

$mailSent = mail($RECIPIENT_EMAIL, $subject, $emailContent, $headers);

// --- 3. Response ---
echo json_encode(['success' => true, 'mailSent' => $mailSent]);
