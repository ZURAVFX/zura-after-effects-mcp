$ErrorActionPreference = "Stop"
$nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
$compatible = $false
if ($nodeCommand) { $compatible = [version](& $nodeCommand.Source -p "process.versions.node") -ge [version]"20.19.0" }
if (!$compatible) {
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  $runtime = Join-Path $env:LOCALAPPDATA "Adobe\ZuraAfterEffectsMCP\node"
  New-Item -ItemType Directory -Force -Path $runtime | Out-Null
  $architecture = if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") { "arm64" } else { "x64" }
  $client = New-Object Net.WebClient
  $releases = $client.DownloadString("https://nodejs.org/dist/index.json") | ConvertFrom-Json
  $release = $releases | Where-Object { $_.version -like "v24.*" } | Select-Object -First 1
  $name = "node-$($release.version)-win-$architecture"
  $zip = Join-Path $runtime "$name.zip"
  $client.DownloadFile("https://nodejs.org/dist/$($release.version)/$name.zip", $zip)
  $sums = $client.DownloadString("https://nodejs.org/dist/$($release.version)/SHASUMS256.txt")
  $expected = (($sums -split "`n" | Where-Object { $_ -match ("  " + [regex]::Escape("$name.zip") + "$") }) -split "\s+")[0]
  if (!$expected) { throw "Node checksum was not found." }
  $hash = [Security.Cryptography.SHA256]::Create(); $stream = [IO.File]::OpenRead($zip)
  try { $actual = ([BitConverter]::ToString($hash.ComputeHash($stream))).Replace("-","").ToLowerInvariant() } finally { $stream.Dispose(); $hash.Dispose() }
  if ($actual -ne $expected) { throw "Node download checksum mismatch." }
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $extract = Join-Path $runtime $name
  if (!(Test-Path -LiteralPath $extract)) { [IO.Compression.ZipFile]::ExtractToDirectory($zip,$runtime) }
  $nodePath = Join-Path $extract "node.exe"
} else { $nodePath = $nodeCommand.Source }
& $nodePath (Join-Path $PSScriptRoot "scripts/install.mjs")
if ($LASTEXITCODE -ne 0) { throw "Installer failed with exit $LASTEXITCODE" }
