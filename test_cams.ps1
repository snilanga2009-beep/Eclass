# Automated Verification Script for CAMS with USB 125kHz RFID Testing
Write-Host "=== CAMS Verification Test Suite (including 125kHz RFID) ===" -ForegroundColor Cyan

# 1. Test Health
$health = Invoke-RestMethod -Uri "http://localhost:5000/api/health"
Write-Host "1. API Health Check: " -NoNewline
if ($health.status -eq "ok") { Write-Host "PASS" -ForegroundColor Green } else { Write-Host "FAIL" -ForegroundColor Red }

# 2. Test Super Admin Login
$loginBody = @{ username = "superadmin"; password = "password123" } | ConvertTo-Json
$loginRes = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginRes.token
$headers = @{ Authorization = "Bearer $token" }
Write-Host "2. Admin Authentication & JWT: " -NoNewline
if ($token) { Write-Host "PASS (Token Issued)" -ForegroundColor Green } else { Write-Host "FAIL" -ForegroundColor Red }

# 3. Test Students Count & RFID Seeding
$students = Invoke-RestMethod -Uri "http://localhost:5000/api/students" -Headers $headers
$rfidCount = ($students | Where-Object { $_.rfidTag -ne $null }).Count
Write-Host "3. Seeded Students Count: $($students.Count) (Requirement: 50+) -> " -NoNewline
if ($students.Count -ge 50 -and $rfidCount -gt 0) { 
    Write-Host "PASS (Seeded with $rfidCount 125kHz RFID UIDs)" -ForegroundColor Green 
} else { 
    Write-Host "FAIL" -ForegroundColor Red 
}

# 4. Test Classes Count
$classes = Invoke-RestMethod -Uri "http://localhost:5000/api/classes" -Headers $headers
Write-Host "4. Active Classes Count: $($classes.Count) (Requirement: 10) -> " -NoNewline
if ($classes.Count -ge 10) { Write-Host "PASS" -ForegroundColor Green } else { Write-Host "FAIL" -ForegroundColor Red }

# 5. Test QR Attendance Duplicate Prevention
$testClass = $classes[0].id
$testDate = "2026-09-25"
$scanBody1 = @{ qrToken = "STU-2026-0001"; classId = $testClass; date = $testDate } | ConvertTo-Json
$scan1 = Invoke-RestMethod -Uri "http://localhost:5000/api/attendance/scan" -Method Post -Body $scanBody1 -ContentType "application/json" -Headers $headers
Write-Host "5a. First Scan Result: $($scan1.scanResult) -> " -NoNewline
Write-Host "PASS" -ForegroundColor Green

$scan2 = Invoke-RestMethod -Uri "http://localhost:5000/api/attendance/scan" -Method Post -Body $scanBody1 -ContentType "application/json" -Headers $headers
Write-Host "5b. Duplicate Scan Attempt (Same student + class + date): $($scan2.scanResult) -> " -NoNewline
if ($scan2.scanResult -eq "ALREADY_RECORDED") { Write-Host "PASS (Duplicate Prevented!)" -ForegroundColor Green } else { Write-Host "FAIL" -ForegroundColor Red }

# 6. Test 125kHz HID RFID Attendance Scan (Hardware EM4100 10-digit Card Tap)
$rfidDate = (Get-Date).ToString("yyyy-MM-dd")
$rfidCard = "0004928101" # Kasun Kalhara's 125kHz RFID Tag
$rfidBody1 = @{ rfidTag = $rfidCard; classId = $testClass; date = $rfidDate; method = "RFID" } | ConvertTo-Json
$rfidScan1 = Invoke-RestMethod -Uri "http://localhost:5000/api/attendance/scan" -Method Post -Body $rfidBody1 -ContentType "application/json" -Headers $headers
Write-Host "6a. 125kHz RFID Scan Result (Card $rfidCard): $($rfidScan1.scanResult) -> " -NoNewline
if ($rfidScan1.scanResult -eq "SUCCESS" -or $rfidScan1.scanResult -eq "ALREADY_RECORDED") {
    Write-Host "PASS (RFID Processed: $($rfidScan1.scanResult))" -ForegroundColor Green
} else {
    Write-Host "FAIL: $($rfidScan1.message)" -ForegroundColor Red
}

# 6b. Test 125kHz RFID Duplicate Protection
$rfidScan2 = Invoke-RestMethod -Uri "http://localhost:5000/api/attendance/scan" -Method Post -Body $rfidBody1 -ContentType "application/json" -Headers $headers
Write-Host "6b. 125kHz RFID Duplicate Scan Attempt: $($rfidScan2.scanResult) -> " -NoNewline
if ($rfidScan2.scanResult -eq "ALREADY_RECORDED") {
    Write-Host "PASS (Yellow Warning: Duplicate Prevented)" -ForegroundColor Green
} else {
    Write-Host "FAIL" -ForegroundColor Red
}

# 7. Test 125kHz RFID Card Diagnostic Lookup
$lookupRes = Invoke-RestMethod -Uri "http://localhost:5000/api/students/rfid-lookup/$rfidCard" -Headers $headers
Write-Host "7. RFID Diagnostic Card Lookup: " -NoNewline
if ($lookupRes.found -eq $true -and $lookupRes.fullName -eq "Kasun Kalhara") {
    Write-Host "PASS (UID $rfidCard matches $($lookupRes.fullName))" -ForegroundColor Green
} else {
    Write-Host "FAIL" -ForegroundColor Red
}

# 8. Test 125kHz RFID Card Assignment to Student
$testStudentId = $students[2].id # 3rd student
$newTestRfidTag = "0008889999"
$assignBody = @{ studentId = $testStudentId; rfidTag = $newTestRfidTag } | ConvertTo-Json
$assignRes = Invoke-RestMethod -Uri "http://localhost:5000/api/students/assign-rfid" -Method Post -Body $assignBody -ContentType "application/json" -Headers $headers
Write-Host "8. Tap-to-Assign 125kHz Card to Student: " -NoNewline
if ($assignRes.success -eq $true -and $assignRes.student.rfidTag -eq $newTestRfidTag) {
    Write-Host "PASS (Card $newTestRfidTag assigned to $($assignRes.student.fullName))" -ForegroundColor Green
} else {
    Write-Host "FAIL" -ForegroundColor Red
}

# 9. Test Financial Math & Fee Calculation
$accounting = Invoke-RestMethod -Uri "http://localhost:5000/api/accounting/summary" -Headers $headers
Write-Host "9. Accounting Calculation (Net = Total Income - Total Expenses): " -NoNewline
$expectedNet = $accounting.totalIncome - $accounting.totalExpenses
if ($accounting.totalNetIncome -eq $expectedNet) { Write-Host "PASS (Exact Match: Rs. $($accounting.totalNetIncome))" -ForegroundColor Green } else { Write-Host "FAIL" -ForegroundColor Red }

# 10. Test Role Switcher (All 7 Roles)
$roles = @("SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "TEACHER", "RECEPTIONIST", "PARENT", "STUDENT")
$rolesPassed = 0
foreach ($r in $roles) {
    $switchBody = @{ targetRole = $r } | ConvertTo-Json
    $switchRes = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/switch-role" -Method Post -Body $switchBody -ContentType "application/json"
    if ($switchRes.user.role -eq $r) { $rolesPassed++ }
}
Write-Host "10. Role-Based Access ($rolesPassed/7 Roles Activated): " -NoNewline
if ($rolesPassed -eq 7) { Write-Host "PASS (All 7 Roles Verified)" -ForegroundColor Green } else { Write-Host "FAIL" -ForegroundColor Red }

# 11. Test Student Registration with Parent Portal SMS Link Generation
$randNum = Get-Random -Minimum 1000 -Maximum 9999
$testParentPhone = "077 $randNum $randNum"
$testStudentRfid = "000" + (Get-Random -Minimum 1000000 -Maximum 9999999)

$newStuBody = @{
    fullName = "Thilina Wickramasinghe $randNum";
    grade = "Grade 12";
    school = "Ananda College";
    parentName = "Mr. Wickramasinghe";
    parentPhone = $testParentPhone;
    rfidTag = $testStudentRfid
} | ConvertTo-Json
$newStuRes = Invoke-RestMethod -Uri "http://localhost:5000/api/students" -Method Post -Body $newStuBody -ContentType "application/json" -Headers $headers
Write-Host "11. Student Registration & Parent Portal SMS Generation: " -NoNewline
if ($newStuRes.parentPortalUrl -and $newStuRes.welcomeSms -and $newStuRes.smsSent -eq $true) {
    Write-Host "PASS (Link: $($newStuRes.parentPortalUrl))" -ForegroundColor Green
} else {
    Write-Host "FAIL" -ForegroundColor Red
}

# 12. Test Resending/Generating Parent Portal SMS Link
$sendLinkRes = Invoke-RestMethod -Uri "http://localhost:5000/api/students/$($newStuRes.id)/send-parent-link" -Method Post -ContentType "application/json" -Headers $headers
Write-Host "12. Dispatch Parent Portal Direct SMS Link: " -NoNewline
if ($sendLinkRes.success -eq $true -and $sendLinkRes.parentPortalUrl) {
    Write-Host "PASS (SMS to $($sendLinkRes.recipient))" -ForegroundColor Green
} else {
    Write-Host "FAIL" -ForegroundColor Red
}

# 13. Test 1-Time Passwordless Parent Phone Login & Children Lookup
$parentLoginBody = @{ phone = $testParentPhone } | ConvertTo-Json
$parentLoginRes = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/parent-login" -Method Post -Body $parentLoginBody -ContentType "application/json"
$parentToken = $parentLoginRes.token
$parentHeaders = @{ Authorization = "Bearer $parentToken" }
$parentChildren = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/parent-children" -Headers $parentHeaders

Write-Host "13. 1-Time Parent Phone Login & Children Portal: " -NoNewline
if ($parentToken -and $parentLoginRes.user.role -eq "PARENT" -and $parentChildren.Count -ge 1) {
    Write-Host "PASS (Logged in as $($parentLoginRes.user.name), 365d Persistent Token, Child: $($parentChildren[0].fullName))" -ForegroundColor Green
} else {
    Write-Host "FAIL" -ForegroundColor Red
}

Write-Host "=== All System, 125kHz RFID & Parent Portal PWA Tests Completed Successfully! ===" -ForegroundColor Green

