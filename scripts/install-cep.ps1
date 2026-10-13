param([switch]$Diagnose)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$source = Join-Path $root "cep-plugin"
function File-Sha256([string]$path) {
  $algorithm = [Security.Cryptography.SHA256]::Create()
  $stream = [IO.File]::OpenRead($path)
  try { return [BitConverter]::ToString($algorithm.ComputeHash($stream)) } finally { $stream.Dispose(); $algorithm.Dispose() }
}
$cepRoot = [IO.Path]::GetFullPath((Join-Path $env:APPDATA "Adobe\CEP\extensions"))
$destination = [IO.Path]::GetFullPath((Join-Path $cepRoot "ZuraAfterEffectsMCP"))
if (!$destination.StartsWith($cepRoot + [IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw "Invalid CEP destination" }
if ((Test-Path $destination) -and ((Get-Item -LiteralPath $destination).Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw "CEP destination is a link; choose a normal local directory." }
if (!$Diagnose) {
  New-Item -ItemType Directory -Force -Path $destination | Out-Null
  foreach ($file in Get-ChildItem -LiteralPath $source -File -Recurse) {
    $relative = $file.FullName.Substring($source.Length + 1)
    $target = Join-Path $destination $relative
    New-Item -ItemType Directory -Force -Path (Split-Path $target -Parent) | Out-Null
    Copy-Item -LiteralPath $file.FullName -Destination $target -Force
  }
  foreach ($version in 9..14) {
    $key = "HKCU:\SOFTWARE\Adobe\CSXS.$version"
    New-Item -Path $key -Force | Out-Null
    New-ItemProperty -Path $key -Name PlayerDebugMode -PropertyType String -Value "1" -Force | Out-Null
  }
}
foreach ($file in Get-ChildItem -LiteralPath $source -File -Recurse) {
  $target = Join-Path $destination $file.FullName.Substring($source.Length + 1)
  if (!(Test-Path -LiteralPath $target) -or (File-Sha256 $target) -ne (File-Sha256 $file.FullName)) { throw "Installed connector differs: $target" }
}
foreach ($version in 9..14) {
  $value = Get-ItemPropertyValue -Path "HKCU:\SOFTWARE\Adobe\CSXS.$version" -Name PlayerDebugMode
  if ([string]$value -ne "1") { throw "CEP activation readback failed for CSXS.$version." }
}
Write-Host "Zura After Effects MCP panel verified at $destination. Fully restart After Effects if it was already open, then choose Window > Extensions > Zura After Effects MCP."
