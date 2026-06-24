param(
  [switch]$Reinstall
)

<#
.SYNOPSIS
  Genera un certificado SSL de desarrollo para la IP LAN actual.
  Usa mkcert si está instalado (recomendado — certificados confiables).
  Si no, genera uno autofirmado con New-SelfSignedCertificate.

  npm run ssl-cert   → genera el certificado
  npm run dev-ssl    → genera (si falta) + inicia el servidor
#>

$ErrorActionPreference = "Stop"
$root = $PWD

Write-Host "═" * 60 -ForegroundColor Cyan
Write-Host "  Generando certificado SSL de desarrollo" -ForegroundColor Cyan
Write-Host "═" * 60 -ForegroundColor Cyan

# ── 1. Detectar IP LAN ──────────────────────────────────────────
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
  $_.InterfaceAlias -notmatch "Loopback|Bluetooth|VMware|Virtual|Hyper-V|Docker" -and
  $_.PrefixOrigin -ne "WellKnown" -and
  $_.IPAddress -notmatch "^169\.|^127\."
} | Select-Object -First 1 -ExpandProperty IPAddress)

if (-not $ip) {
  $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notmatch "^127\." } | Select-Object -First 1).IPAddress
}
if (-not $ip) { $ip = "127.0.0.1"; Write-Host "  Usando 127.0.0.1" -ForegroundColor Yellow }

Write-Host "  IP detectada: $ip" -ForegroundColor Green

# ── 2. Buscar mkcert ────────────────────────────────────────────
$mkcert = Get-Command "mkcert" -ErrorAction SilentlyContinue
if (-not $mkcert) {
  $wingetPath = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\FiloSottile.mkcert_Microsoft.Winget.Source_8wekyb3d8bbwe\mkcert.exe"
  if (Test-Path $wingetPath) { $mkcert = $wingetPath }
}

# ── 3. Generar ──────────────────────────────────────────────────
if ($mkcert) {
  Write-Host "  Usando mkcert..." -ForegroundColor Yellow
  $mkcertPath = if ($mkcert -is [string]) { $mkcert } else { $mkcert.Source }
  $null = & $mkcertPath -key-file "$root\ssl-dev.key" -cert-file "$root\ssl-dev.crt" $ip localhost 127.0.0.1
} else {
  Write-Host "  mkcert no encontrado, usando New-SelfSignedCertificate..." -ForegroundColor Yellow
  Write-Host "  Instalalo con: winget install mkcert" -ForegroundColor White

  $cert = New-SelfSignedCertificate `
    -Subject "CN=$ip" `
    -TextExtension @("2.5.29.17={text}IPAddress=$ip&DNS=localhost&DNS=127.0.0.1") `
    -KeyUsage DigitalSignature, KeyEncipherment `
    -KeyAlgorithm RSA -KeyLength 2048 `
    -NotAfter (Get-Date).AddYears(5) `
    -CertStoreLocation "Cert:\CurrentUser\My"

  $pfxPath = Join-Path $root "ssl-dev.pfx"
  Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password (ConvertTo-SecureString "dev" -Force -AsPlainText) | Out-Null

  $pfxBytes = [System.IO.File]::ReadAllBytes($pfxPath)
  $x509 = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2
  $x509.Import($pfxBytes, "dev", [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::Exportable)

  $certB64 = [Convert]::ToBase64String($x509.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert), [System.Base64FormattingOptions]::InsertLineBreaks)
  [System.IO.File]::WriteAllText("$root\ssl-dev.crt", "-----BEGIN CERTIFICATE-----`r`n$certB64`r`n-----END CERTIFICATE-----")

  $rsa = [System.Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPrivateKey($x509)
  $keyB64 = [Convert]::ToBase64String($rsa.ExportRSAPrivateKey(), [System.Base64FormattingOptions]::InsertLineBreaks)
  [System.IO.File]::WriteAllText("$root\ssl-dev.key", "-----BEGIN RSA PRIVATE KEY-----`r`n$keyB64`r`n-----END RSA PRIVATE KEY-----")

  Remove-Item $pfxPath -Force -ErrorAction SilentlyContinue
  Get-ChildItem "Cert:\CurrentUser\My\$($cert.Thumbprint)" | Remove-Item -Force -ErrorAction SilentlyContinue
}

# ── 4. Resultado ────────────────────────────────────────────────
Write-Host "═" * 60 -ForegroundColor Cyan
Write-Host "  ✅ Certificado generado para IP: $ip" -ForegroundColor Green
Write-Host ""
Write-Host "  Servidor:" -ForegroundColor White
Write-Host "    ng serve --ssl --ssl-cert ssl-dev.crt --ssl-key ssl-dev.key --host 0.0.0.0" -ForegroundColor Yellow
Write-Host "  O simplemente:" -ForegroundColor White
Write-Host "    npm run dev-ssl" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Desde el celular:" -ForegroundColor White
Write-Host "    https://${ip}:4200" -ForegroundColor Yellow
Write-Host ""

if ($mkcert) {
  Write-Host "  ✅ mkcert — certificado confiable (sin advertencia en el navegador)" -ForegroundColor Green
  Write-Host "  ⚠ En el celular todavía necesitás instalar el CA de mkcert:" -ForegroundColor Yellow
  $caRoot = & $mkcert -CAROOT 2>&1 | Out-String
  Write-Host "     $caRoot" -ForegroundColor White
  Write-Host "     Copiá rootCA.pem al celular e instalalo como CA confiable" -ForegroundColor White
  Write-Host "     (Ajustes → Seguridad → Instalar certificado)" -ForegroundColor White
} else {
  Write-Host "  ⚠ Certificado autofirmado — el navegador mostrará advertencia:" -ForegroundColor Yellow
  Write-Host "    - Firefox mobile: Avanzado → Aceptar riesgo" -ForegroundColor White
  Write-Host "    - Chrome mobile: Tecleá 'thisisunsafe'" -ForegroundColor White
  Write-Host "  💡 Instalá mkcert para evitar esto: winget install mkcert" -ForegroundColor Cyan
}
Write-Host "═" * 60 -ForegroundColor Cyan
