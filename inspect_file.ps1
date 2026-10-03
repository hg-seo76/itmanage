$filePath = 'C:\Users\User\Downloads\itmanage\school-itam\src\components\views\BuildingMapView.tsx'
$lines = [System.IO.File]::ReadAllLines($filePath, [System.Text.Encoding]::UTF8)
Write-Host "Line 84 (1-indexed):"
Write-Host $lines[83]
Write-Host "Hex bytes at start of file:"
$bytes = [System.IO.File]::ReadAllBytes($filePath)
$hexStr = ($bytes[0..4] | ForEach-Object { $_.ToString('X2') }) -join ' '
Write-Host $hexStr
