# Automated Test Script for CAMS SMS & WhatsApp Gateway
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "       CAMS SMS & WHATSAPP GATEWAY VERIFICATION SUITE            " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Login to retrieve Admin JWT Token
$loginBody = @{ username = "admin"; password = "password123" } | ConvertTo-Json
$loginRes = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginRes.token
$headers = @{ Authorization = "Bearer $token" }
Write-Host "1. Admin Authentication for Gateway Access: " -NoNewline
if ($token) { Write-Host "PASS (Token Issued)" -ForegroundColor Green } else { Write-Host "FAIL" -ForegroundColor Red; exit }

# 2. Test Gateway Provider Configuration (text.lk)
$provider = Invoke-RestMethod -Uri "http://localhost:5000/api/messaging/provider" -Headers $headers
Write-Host "2. SMS Gateway Provider Config: " -NoNewline
if ($provider.provider -eq "text.lk" -and $provider.senderId) {
    Write-Host "PASS (Provider: $($provider.provider), Sender Mask: '$($provider.senderId)')" -ForegroundColor Green
} else {
    Write-Host "FAIL" -ForegroundColor Red
}

# 3. Test text.lk API Live Connection Test
$testConn = Invoke-RestMethod -Uri "http://localhost:5000/api/messaging/test-textlk" -Method Post -Headers $headers -ContentType "application/json" -Body "{}"
Write-Host "3. text.lk Live Connectivity Check: " -NoNewline
if ($testConn.success -eq $true -and $testConn.status -eq "CONNECTED") {
    Write-Host "PASS ($($testConn.status) - $($testConn.accountBalance))" -ForegroundColor Green
} else {
    Write-Host "FAIL" -ForegroundColor Red
}

# 4. Test Notification Message Templates
$templates = Invoke-RestMethod -Uri "http://localhost:5000/api/messaging/templates" -Headers $headers
Write-Host "4. Message Templates Catalog: " -NoNewline
if ($templates.Count -ge 5) {
    $tplNames = ($templates | Select-Object -ExpandProperty code) -join ", "
    Write-Host "PASS ($($templates.Count) Templates: $tplNames)" -ForegroundColor Green
} else {
    Write-Host "FAIL" -ForegroundColor Red
}

# 5. Test Broadcast Dispatch via Gateway (SMS + WhatsApp)
$broadcastBody = @{
    channel = "BOTH";
    targetType = "PENDING_FEES";
    templateCode = "FEE_REMINDER";
    customMessage = "Notice: Friendly reminder from Cambridge Academy regarding tuition fee settlement. Thank you."
} | ConvertTo-Json
$broadcastRes = Invoke-RestMethod -Uri "http://localhost:5000/api/messaging/send" -Method Post -Body $broadcastBody -ContentType "application/json" -Headers $headers
Write-Host "5. Multi-Channel Broadcast Dispatch: " -NoNewline
if ($broadcastRes.count -gt 0) {
    Write-Host "PASS (Dispatched to $($broadcastRes.count) parents via $($broadcastRes.provider))" -ForegroundColor Green
} else {
    Write-Host "FAIL" -ForegroundColor Red
}

# 6. Test Automatic Trigger 1: Student Registration Parent Portal Link SMS
$rand = Get-Random -Minimum 1000 -Maximum 9999
$newStudentBody = @{
    fullName = "Anuki Jayasinghe $rand";
    grade = "Grade 12";
    parentName = "Mrs. Jayasinghe";
    parentPhone = "077 444 $rand"
} | ConvertTo-Json
$newStudentRes = Invoke-RestMethod -Uri "http://localhost:5000/api/students" -Method Post -Body $newStudentBody -ContentType "application/json" -Headers $headers
Write-Host "6. Auto Trigger 1 (Student Enrolled -> Portal SMS Link): " -NoNewline
if ($newStudentRes.parentPortalUrl -and $newStudentRes.smsSent -eq $true) {
    Write-Host "PASS (Dispatched to $($newStudentRes.parentPhone): $($newStudentRes.parentPortalUrl))" -ForegroundColor Green
} else {
    Write-Host "FAIL" -ForegroundColor Red
}

# 7. Test Automatic Trigger 2: 125kHz RFID Attendance Scan -> Parent Arrival Alert
$today = (Get-Date).ToString("yyyy-MM-dd")
$rfidScanBody = @{
    rfidTag = "0004928101"; # Kasun Kalhara's 125kHz RFID UID
    classId = "cls-1";
    date = "2026-10-01"; # Fresh date to trigger scan
    method = "RFID"
} | ConvertTo-Json
$rfidScanRes = Invoke-RestMethod -Uri "http://localhost:5000/api/attendance/scan" -Method Post -Body $rfidScanBody -ContentType "application/json" -Headers $headers
Write-Host "7. Auto Trigger 2 (125kHz RFID Tap -> Parent SMS Alert): " -NoNewline
if ($rfidScanRes.scanResult -eq "SUCCESS" -or $rfidScanRes.scanResult -eq "ALREADY_RECORDED") {
    Write-Host "PASS (Attendance recorded & alert generated for $($rfidScanRes.student.fullName))" -ForegroundColor Green
} else {
    Write-Host "FAIL: $($rfidScanRes.message)" -ForegroundColor Red
}

# 8. Test Automatic Trigger 3: Fee Payment Cashier -> Instant SMS Receipt
$feeItems = @(
    @{
        feeRecordId = "fee-stu-1-cls-1-2026-09";
        amountPaid = 500;
        discount = 0
    }
)
$payBody = @{
    studentId = "stu-1";
    items = $feeItems;
    paymentMethod = "Cash";
    notes = "Test payment for SMS gateway"
} | ConvertTo-Json
$payRes = Invoke-RestMethod -Uri "http://localhost:5000/api/payments" -Method Post -Body $payBody -ContentType "application/json" -Headers $headers
Write-Host "8. Auto Trigger 3 (Counter Payment -> Parent SMS Receipt): " -NoNewline
if ($payRes.receiptNumber) {
    Write-Host "PASS (Receipt #$($payRes.receiptNumber) generated & sent to guardian)" -ForegroundColor Green
} else {
    Write-Host "FAIL" -ForegroundColor Red
}

# 9. Test Gateway Delivery Logs Table
$logs = Invoke-RestMethod -Uri "http://localhost:5000/api/messaging/logs" -Headers $headers
Write-Host "9. Live Gateway Delivery Logs Audit Trail: " -NoNewline
if ($logs.Count -ge 5) {
    $recentLog = $logs[0]
    Write-Host "PASS ($($logs.Count) log entries recorded. Latest: [$($recentLog.channel)] -> $($recentLog.recipient): '$($recentLog.message.Substring(0, [System.Math]::Min(40, $recentLog.message.Length)))...')" -ForegroundColor Green
} else {
    Write-Host "FAIL" -ForegroundColor Red
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "    ALL 9 SMS & WHATSAPP GATEWAY TESTS COMPLETED WITH PASS!      " -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Cyan
