# Script PowerShell pour générer le package ZIP propre de l'application prêt à la vente
$sourceDir = $PSScriptRoot
$parentDir = Split-Path -Parent $sourceDir
$destination = Join-Path $parentDir "Church_Connect_Pro_WhiteLabel_Package.zip"

if (Test-Path $destination) {
    Remove-Item $destination -Force
}

$tempFolder = Join-Path $parentDir "church_connect_package_temp"
if (Test-Path $tempFolder) {
    Remove-Item $tempFolder -Recurse -Force
}

New-Item -ItemType Directory -Path $tempFolder | Out-Null

# Copier tous les fichiers sources pertinents
$excludeList = @("node_modules", ".git", "dist", ".system_generated", ".env.local")

Get-ChildItem -Path $sourceDir | Where-Object {
    $name = $_.Name
    $excludeList -notcontains $name
} | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $tempFolder -Recurse -Force
}

# Création de l'archive ZIP
Compress-Archive -Path "$tempFolder\*" -DestinationPath $destination -CompressionLevel Optimal

# Nettoyage du dossier temporaire
Remove-Item $tempFolder -Recurse -Force

Write-Output "SUCCESS: Package ZIP généré dans $destination"
