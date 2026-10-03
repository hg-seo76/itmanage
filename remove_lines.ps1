$filePath = 'C:\Users\User\Downloads\itmanage\school-itam\src\components\views\BuildingMapView.tsx'
$lines = [System.IO.File]::ReadAllLines($filePath, [System.Text.Encoding]::UTF8)
Write-Host "Total lines: $($lines.Count)"

# Lines to remove (0-indexed): 513 to 534 (the unassigned block from lines 514-535 in 1-indexed)
$startRemove = 513  # 0-indexed = line 514 in 1-indexed
$endRemove = 534    # 0-indexed = line 535 in 1-indexed

$newLines = [System.Collections.Generic.List[string]]::new()
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($i -lt $startRemove -or $i -gt $endRemove) {
        $newLines.Add($lines[$i])
    }
}

[System.IO.File]::WriteAllLines($filePath, $newLines.ToArray(), [System.Text.Encoding]::UTF8)
Write-Host "Done. New line count: $($newLines.Count)"
