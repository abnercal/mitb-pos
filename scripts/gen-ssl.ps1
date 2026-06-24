param(
  [switch]$Reinstall
)

<#
.SYNOPSIS
  Genera un certificado SSL autofirmado para desarrollo con la IP LAN actual.
  Angular lo necesita para servir HTTPS y probar desde el celular.

  Uso directo:
    powershell -File scripts/gen-ssl.ps1
    ng serve --ssl --ssl-cert ssl-dev.crt --ssl-key ssl-dev.key --host 0.0.0.0

  O a través de npm (definido en package.json):
    npm run ssl-cert
#>

$ErrorActionPreference = "Stop"

Write-Host "═" * 60 -ForegroundColor Cyan
Write-Host "  Generando certificado SSL de desarrollo" -ForegroundColor Cyan
Write-Host "═" * 60 -ForegroundColor Cyan

# ── 1. Detectar IP LAN ──────────────────────────────────────────
$ip = $null
$interfaces = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
  $_.InterfaceAlias -notmatch "Loopback|Bluetooth|VMware|Virtual|Hyper-V|Docker" -and
  $_.PrefixOrigin -ne "WellKnown" -and
  $_.IPAddress -notmatch "^169\.|^127\."
}
$ip = $interfaces | Select-Object -First 1 -ExpandProperty IPAddress

if (-not $ip) {
  # Fallback: agarrar la primera IPv4 que no sea loopback
  $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notmatch "^127\." } | Select-Object -First 1).IPAddress
}

if (-not $ip) {
  Write-Host "✖ No se pudo detectar la IP LAN. Usando 127.0.0.1" -ForegroundColor Yellow
  $ip = "127.0.0.1"
}

Write-Host "  IP detectada: $ip" -ForegroundColor Green

# ── 2. Generar certificado ──────────────────────────────────────
Write-Host "  Creando certificado autofirmado..." -ForegroundColor Yellow

# Eliminar cert anterior del store si existe
$thumbprint = (Get-ChildItem "Cert:\CurrentUser\My" | Where-Object { $_.Subject -eq "CN=$ip" } | Select-Object -First 1).Thumbprint
if ($thumbprint) {
  Get-ChildItem "Cert:\CurrentUser\My\$thumbprint" | Remove-Item -Force
}

$cert = New-SelfSignedCertificate `
  -Subject "CN=$ip" `
  -TextExtension @("2.5.29.17={text}IPAddress=$ip&DNS=localhost&DNS=127.0.0.1") `
  -KeyUsage DigitalSignature, KeyEncipherment `
  -KeyAlgorithm RSA `
  -KeyLength 2048 `
  -NotAfter (Get-Date).AddYears(5) `
  -CertStoreLocation "Cert:\CurrentUser\My"

# ── 3. Exportar PFX (intermedio) ─────────────────────────────────
$pfxPath = Join-Path $PWD "ssl-dev.pfx"
$pwdSecure = ConvertTo-SecureString -String "dev" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $pwdSecure | Out-Null

# ── 4. Extraer .crt y .key en PEM usando .NET ───────────────────
Write-Host "  Exportando certificado y clave..." -ForegroundColor Yellow

$pfxBytes = [System.IO.File]::ReadAllBytes($pfxPath)
$x509 = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2
$x509.Import($pfxBytes, "dev", [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::Exportable)

# ── Certificado (PEM) ──
$certB64 = [Convert]::ToBase64String($x509.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert), [System.Base64FormattingOptions]::InsertLineBreaks)
$certPem = "-----BEGIN CERTIFICATE-----`r`n$certB64`r`n-----END CERTIFICATE-----"
[System.IO.File]::WriteAllText((Join-Path $PWD "ssl-dev.crt"), $certPem)

# ── Clave privada (PEM PKCS#1) ──
try {
  $rsa = [System.Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPrivateKey($x509)
  $keyB64 = [Convert]::ToBase64String($rsa.ExportRSAPrivateKey(), [System.Base64FormattingOptions]::InsertLineBreaks)
  $keyPem = "-----BEGIN RSA PRIVATE KEY-----`r`n$keyB64`r`n-----END RSA PRIVATE KEY-----"
  [System.IO.File]::WriteAllText((Join-Path $PWD "ssl-dev.key"), $keyPem)
} catch {
  Write-Host "  Falló exportación directa, probando con ExportPfxToArray..." -ForegroundColor Yellow
  # Fallback: extraer usando BouncyCastle vía PFX intermedio
  $keyBytes = $x509.PrivateKey.KeyExchangeAlgorithm
  if ($keyBytes) {
    $rsa2 = [System.Security.Cryptography.RSACryptoServiceProvider]$x509.PrivateKey
    $keyB64 = [Convert]::ToBase64String($rsa2.ExportCspBlob($true), [System.Base64FormattingOptions]::InsertLineBreaks)
    $keyPem = "-----BEGIN RSA PRIVATE KEY-----`r`n$keyB64`r`n-----END RSA PRIVATE KEY-----"
    [System.IO.File]::WriteAllText((Join-Path $PWD "ssl-dev.key"), $keyPem)
  } else {
    Write-Host "✖ No se pudo exportar la clave privada. Probá con mkcert (recomendado)." -ForegroundColor Red
    Write-Host "  Los archivos .pfx se generaron pero .crt/.key pueden no funcionar." -ForegroundColor Yellow
  }
}

# ── 5. Limpiar ──────────────────────────────────────────────────
Remove-Item $pfxPath -Force -ErrorAction SilentlyContinue
Get-ChildItem "Cert:\CurrentUser\My\$($cert.Thumbprint)" | Remove-Item -Force -ErrorAction SilentlyContinue

# ── 6. Resultado ────────────────────────────────────────────────
if ((Test-Path "ssl-dev.crt") -and (Test-Path "ssl-dev.key")) {
  Write-Host "═" * 60 -ForegroundColor Cyan
  Write-Host "  ✅ Certificado generado para IP: $ip" -ForegroundColor Green
  Write-Host "" -ForegroundColor Cyan
  Write-Host "  Para iniciar el servidor:" -ForegroundColor White
  Write-Host "    ng serve --ssl --ssl-cert ssl-dev.crt --ssl-key ssl-dev.key --host 0.0.0.0" -ForegroundColor Yellow
  Write-Host "" -ForegroundColor Cyan
  Write-Host "  O desde el celular:" -ForegroundColor White
  Write-Host "    https://${ip}:4200" -ForegroundColor Yellow
  Write-Host "" -ForegroundColor Cyan
  Write-Host "  ⚠ Si el navegador muestra advertencia de certificado:" -ForegroundColor Yellow
  Write-Host "    - Firefox mobile: Avanzado → Aceptar riesgo" -ForegroundColor White
  Write-Host "    - Chrome mobile: Tecleá 'thisisunsafe' (no se ve el foco)" -ForegroundColor White
  Write-Host "═" * 60 -ForegroundColor Cyan
} else {
  Write-Host "✖ Error generando certificados" -ForegroundColor Red
}
