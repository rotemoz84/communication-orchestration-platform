# PHP Contact Form Backup

This PHP contact form serves as a backup workaround when the main API services are not working correctly.

## Files Location

- **Main file**: `src/contact.php` - Development version
- **Production copy**: `dist/contact.php` - Copy for live deployment

## Features

- **CORS Support**: Handles cross-origin requests from the React frontend
- **Data Validation**: Basic validation (frontend already handles main validation)
- **CSV Logging**: Saves all submissions to `leads.csv` with Hebrew support
- **HTML Email**: Sends formatted HTML email notifications
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Security**: Input sanitization and XSS protection

## How It Works

1. **Frontend (ContactForm.tsx)**: 
   - First tries the main API endpoint: `https://api.drozyuval.com/api/inquiries`
   - If that fails, automatically falls back to the PHP endpoint: `https://drozyuval.com/contact.php`

2. **PHP Backend**:
   - Accepts POST requests with JSON data
   - Validates required fields (phone or email must exist)
   - Logs data to CSV file with Hebrew BOM for Excel compatibility
   - Sends HTML email notification to `shachar.oz@gmail.com`
   - Returns JSON response with success/error status

## Configuration

You can modify these variables in `contact.php`:

```php
$RECIPIENT_EMAIL = 'shachar.oz@gmail.com';  // Change recipient email
$CSV_FILENAME = 'leads.csv';                // Change CSV filename
```

## Data Fields

The form accepts the following fields:

- `name` (optional): Full name
- `phone` (required if no email): Phone number
- `email` (required if no phone): Email address
- `service` (optional): Selected service
- `week` (optional): Pregnancy week
- `message` (optional): Additional message

## Deployment

1. Upload `dist/contact.php` to your web server
2. Ensure the server has PHP mail() function configured
3. Set proper write permissions for the CSV file directory
4. The frontend will automatically use this as fallback when the main API fails

## CSV Output

The CSV file includes these columns:
- Timestamp
- Name
- Phone
- Email
- Service
- Week
- Message

## Email Format

Sends a professional HTML email with:
- RTL layout for Hebrew text
- Styled table with all form data
- Professional branding
- Reply-to functionality

## Error Handling

- **400**: Invalid JSON or missing required fields
- **405**: Wrong HTTP method
- **500**: Server errors (file permissions, mail function issues)

## Security Features

- Input sanitization with `htmlspecialchars()`
- Email validation with `filter_var()`
- CORS headers for cross-origin requests
- XSS protection
- SQL injection protection (not using database)

## Testing

You can test the PHP endpoint directly:

```bash
curl -X POST https://drozyuval.com/contact.php \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "0501234567",
    "email": "test@example.com",
    "service": "Test Service",
    "week": "12",
    "message": "Test message"
  }'
```
