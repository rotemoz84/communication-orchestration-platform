<?php
/**
 * Contact Form Backend for Dr. Yuval Oz Clinic
 * Unified version with CSV logging, HTML email notification, and proper CORS support
 * 
 * This file serves as a backup workaround when API services are not working correctly.
 * Validation is enforced here as well as in the frontend because this endpoint is public.
 */

// --- Configuration ---
$RECIPIENT_EMAIL = '6801552@gmail.com';
$CSV_FILENAME = 'leads.csv';
$SITE_NAME = 'Dr. Yuval Oz Clinic';
$PRIVACY_POLICY_VERSION = '2026-02';
$CSV_HEADERS = [
    'Timestamp', 'Name', 'Phone', 'Email', 'Service', 'Week', 'Message',
    'Privacy Consent', 'Sensitive Data Consent', 'Consent Policy Version',
    'Consent Recorded At'
];
$FIELD_LIMITS = [
    'name' => 100,
    'phone' => 20,
    'email' => 100,
    'service' => 100,
    'message' => 1000
];

function respondWithError($statusCode, $message) {
    http_response_code($statusCode);
    echo json_encode(['success' => false, 'message' => $message]);
    exit();
}

function normalizedText($data, $key) {
    return isset($data[$key]) && is_string($data[$key])
        ? trim($data[$key])
        : '';
}

function normalizedPregnancyWeek($data) {
    if (!isset($data['week']) || (!is_string($data['week']) && !is_int($data['week']) && !is_float($data['week']))) {
        return '';
    }

    return trim((string) $data['week']);
}

function textLength($value) {
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}

function appendCsvRow($filename, $headers, $row) {
    $fileHandle = fopen($filename, 'c+');
    if ($fileHandle === false) {
        throw new Exception('Unable to open CSV file for writing');
    }

    if (!flock($fileHandle, LOCK_EX)) {
        fclose($fileHandle);
        throw new Exception('Unable to lock CSV file for writing');
    }

    rewind($fileHandle);
    $existingRows = [];
    while (($existingRow = fgetcsv($fileHandle)) !== false) {
        $existingRows[] = $existingRow;
    }

    $hasCurrentHeader = count($existingRows) > 0
        && in_array('Privacy Consent', $existingRows[0], true);

    if (count($existingRows) === 0 || !$hasCurrentHeader) {
        $historicalRows = count($existingRows) > 0 ? array_slice($existingRows, 1) : [];
        ftruncate($fileHandle, 0);
        rewind($fileHandle);
        fprintf($fileHandle, chr(0xEF).chr(0xBB).chr(0xBF));
        fputcsv($fileHandle, $headers);

        foreach ($historicalRows as $historicalRow) {
            fputcsv($fileHandle, array_pad($historicalRow, count($headers), ''));
        }
    }

    fseek($fileHandle, 0, SEEK_END);
    fputcsv($fileHandle, $row);
    fflush($fileHandle);
    flock($fileHandle, LOCK_UN);
    fclose($fileHandle);
}

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
    respondWithError(400, 'Invalid JSON data');
}

// --- Server-side Intake Validation ---
$rawFields = [
    'name' => normalizedText($data, 'name'),
    'phone' => normalizedText($data, 'phone'),
    'email' => normalizedText($data, 'email'),
    'service' => normalizedText($data, 'service'),
    'week' => normalizedPregnancyWeek($data),
    'message' => normalizedText($data, 'message')
];
$rawName = $rawFields['name'];
$rawPhone = $rawFields['phone'];
$rawEmail = $rawFields['email'];
$rawService = $rawFields['service'];
$rawWeek = $rawFields['week'];
$rawMessage = $rawFields['message'];
$hasPhone = $rawPhone !== '';
$hasEmail = $rawEmail !== '';
$hasPregnancyWeek = $rawWeek !== '';
$privacyConsent = isset($data['privacyConsent']) && $data['privacyConsent'] === true;
$sensitiveDataConsent = isset($data['sensitiveDataConsent']) && $data['sensitiveDataConsent'] === true;

if (!$hasPhone && !$hasEmail) {
    respondWithError(400, 'Phone or email is required');
}
if (!$privacyConsent) {
    respondWithError(400, 'Privacy consent is required');
}
foreach ($FIELD_LIMITS as $field => $maxLength) {
    $rawValue = $rawFields[$field];
    if ($rawValue !== '' && textLength($rawValue) > $maxLength) {
        respondWithError(400, "$field exceeds the $maxLength character limit");
    }
}
if ($hasEmail && !filter_var($rawEmail, FILTER_VALIDATE_EMAIL)) {
    respondWithError(400, 'Email format is invalid');
}
if ($hasPregnancyWeek && (!preg_match('/^\d+$/', $rawWeek) || (int) $rawWeek < 1 || (int) $rawWeek > 42)) {
    respondWithError(400, 'Pregnancy week must be a whole number between 1 and 42');
}
if ($hasPregnancyWeek && !$sensitiveDataConsent) {
    respondWithError(400, 'Sensitive data consent is required when pregnancy week is provided');
}

// --- Data Extraction and Sanitization ---
$name    = $rawName !== '' ? htmlspecialchars($rawName, ENT_QUOTES, 'UTF-8') : 'לא צויין';
$phone   = $rawPhone !== '' ? htmlspecialchars($rawPhone, ENT_QUOTES, 'UTF-8') : 'לא צויין';
$email   = $rawEmail !== '' ? filter_var($rawEmail, FILTER_SANITIZE_EMAIL) : 'לא צויין';
$service = $rawService !== '' ? htmlspecialchars($rawService, ENT_QUOTES, 'UTF-8') : 'לא צויין';
$week    = $rawWeek !== '' ? htmlspecialchars($rawWeek, ENT_QUOTES, 'UTF-8') : 'לא צויין';
$message = $rawMessage !== '' ? htmlspecialchars($rawMessage, ENT_QUOTES, 'UTF-8') : 'ללא הודעה';
$timestamp = date('Y-m-d H:i:s');
$consentRecordedAt = date('c');

try {
    // --- 1. Log to CSV (Database) ---
    appendCsvRow($CSV_FILENAME, $CSV_HEADERS, [
        $timestamp, $name, $phone, $email, $service, $week, $message,
        $privacyConsent ? 'true' : 'false',
        $sensitiveDataConsent ? 'true' : 'false',
        $PRIVACY_POLICY_VERSION,
        $consentRecordedAt
    ]);

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
