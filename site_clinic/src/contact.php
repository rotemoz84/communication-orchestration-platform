<?php
/**
 * Contact Form Backend for Dr. Yuval Oz Clinic
 * Unified version with CSV logging, HTML email notification, and proper CORS support
 * 
 * This file serves as a backup workaround when API services are not working correctly.
 * The frontend (ContactForm.tsx) already performs validation, so minimal validation is needed here.
 */

// --- Configuration ---
$RECIPIENT_EMAIL = '6801552@gmail.com';
$CSV_FILENAME = 'leads.csv';
$SITE_NAME = 'Dr. Yuval Oz Clinic';

// --- CORS and Headers ---
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- Request Method Validation ---
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// --- Input Parsing ---
$inputJSON = file_get_contents('php://input');
$data = json_decode($inputJSON, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
    exit();
}

// --- Data Extraction and Sanitization ---
$name    = isset($data['name']) ? htmlspecialchars(trim($data['name']), ENT_QUOTES, 'UTF-8') : 'לא צויין';
$phone   = isset($data['phone']) ? htmlspecialchars(trim($data['phone']), ENT_QUOTES, 'UTF-8') : 'לא צויין';
$email   = isset($data['email']) ? filter_var(trim($data['email']), FILTER_SANITIZE_EMAIL) : 'לא צויין';
$service = isset($data['service']) ? htmlspecialchars(trim($data['service']), ENT_QUOTES, 'UTF-8') : 'לא צויין';
$week    = isset($data['week']) ? htmlspecialchars(trim($data['week']), ENT_QUOTES, 'UTF-8') : 'לא צויין';
$message = isset($data['message']) ? htmlspecialchars(trim($data['message']), ENT_QUOTES, 'UTF-8') : 'ללא הודעה';
$timestamp = date('Y-m-d H:i:s');

try {
    // --- 1. Log to CSV (Database) ---
    $isNewFile = !file_exists($CSV_FILENAME);
    $fileHandle = fopen($CSV_FILENAME, 'a');

    if ($fileHandle === false) {
        throw new Exception('Unable to open CSV file for writing');
    }

    // Add BOM for Hebrew support in Excel
    if ($isNewFile) {
        fprintf($fileHandle, chr(0xEF).chr(0xBB).chr(0xBF));
        fputcsv($fileHandle, ['Timestamp', 'Name', 'Phone', 'Email', 'Service', 'Week', 'Message']);
    }

    fputcsv($fileHandle, [$timestamp, $name, $phone, $email, $service, $week, $message]);
    fclose($fileHandle);

    // --- 2. Send HTML Email Notification ---
    $subject = "פנייה חדשה מאתר ד\"ר יובל עוז: $name";
    
    $emailContent = "
<html>
<head>
    <title>פנייה חדשה מהאתר</title>
    <meta charset='UTF-8'>
</head>
<body dir='rtl' style='font-family: Arial, sans-serif; margin: 20px; background-color: #f9f9f9;'>
    <div style='max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);'>
        <h2 style='color: #1A2B3C; text-align: center; margin-bottom: 30px;'>התקבלה פנייה חדשה באתר ד\"ר יובל עוז</h2>
        
        <table style='width: 100%; border-collapse: collapse; margin-bottom: 20px;'>
            <tr style='background-color: #f8f9fa;'>
                <td style='padding: 12px; border: 1px solid #dee2e6; font-weight: bold; width: 30%;'>זמן:</td>
                <td style='padding: 12px; border: 1px solid #dee2e6;'>$timestamp</td>
            </tr>
            <tr>
                <td style='padding: 12px; border: 1px solid #dee2e6; font-weight: bold;'>שם מלא:</td>
                <td style='padding: 12px; border: 1px solid #dee2e6;'>$name</td>
            </tr>
            <tr style='background-color: #f8f9fa;'>
                <td style='padding: 12px; border: 1px solid #dee2e6; font-weight: bold;'>טלפון:</td>
                <td style='padding: 12px; border: 1px solid #dee2e6;'><a href='https://wa.me/+972" . preg_replace('/[^0-9]/', '', $phone) . "'>" . $phone . "</a></td>
            </tr>
            <tr>
                <td style='padding: 12px; border: 1px solid #dee2e6; font-weight: bold;'>אימייל:</td>
                <td style='padding: 12px; border: 1px solid #dee2e6;'>$email</td>
            </tr>
            <tr style='background-color: #f8f9fa;'>
                <td style='padding: 12px; border: 1px solid #dee2e6; font-weight: bold;'>שירות מבוקש:</td>
                <td style='padding: 12px; border: 1px solid #dee2e6;'>$service</td>
            </tr>
            <tr>
                <td style='padding: 12px; border: 1px solid #dee2e6; font-weight: bold;'>שבוע הריון:</td>
                <td style='padding: 12px; border: 1px solid #dee2e6;'>$week</td>
            </tr>
            <tr style='background-color: #f8f9fa;'>
                <td style='padding: 12px; border: 1px solid #dee2e6; font-weight: bold; vertical-align: top;'>הודעה:</td>
                <td style='padding: 12px; border: 1px solid #dee2e6;'>$message</td>
            </tr>
        </table>
        
        <div style='text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;'>
            <p style='color: #6c757d; font-size: 14px;'>
                פנייה זו נשלחה דרך טופס צור קשר באתר ד\"ר יובל עוז<br>
                אנא צור קשר עם הפונה בהקדם האפשרי
            </p>
        </div>
    </div>
</body>
</html>
";

    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: secretary@drozyuval.com" . "\r\n";
    $headers .= "Reply-To: " . ($email !== 'לא צויין' && filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : 'secretary@drozyuval.com') . "\r\n";

    $mailSent = mail($RECIPIENT_EMAIL, $subject, $emailContent, $headers);

    // --- 3. Response ---
    if ($mailSent) {
        echo json_encode([
            'success' => true, 
            'message' => 'Contact form submission processed successfully',
            'data' => [
                'logged' => true,
                'email_sent' => true,
                'timestamp' => $timestamp
            ]
        ]);
    } else {
        // CSV was logged but email failed
        echo json_encode([
            'success' => true, 
            'message' => 'Contact form logged but email sending failed',
            'data' => [
                'logged' => true,
                'email_sent' => false,
                'timestamp' => $timestamp
            ]
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
