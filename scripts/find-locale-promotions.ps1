[CmdletBinding()]
param(
  [string]$LocaleDirectory = (Join-Path $PSScriptRoot '../src/i18n/locales')
)

$ErrorActionPreference = 'Stop'
$rules = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'locale-promotion-rules.json') -Raw |
  ConvertFrom-Json

foreach ($localeFile in Get-ChildItem -LiteralPath $LocaleDirectory -File -Filter '*.json') {
  try {
    $locale = Get-Content -LiteralPath $localeFile.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
  } catch {
    Write-Output "Invalid locale JSON: $($localeFile.Name)"
    continue
  }
  foreach ($path in $rules.forbiddenPaths) {
    $node = $locale
    $found = $true
    foreach ($part in $path.Split('.')) {
      $property = if ($null -ne $node) { $node.PSObject.Properties[$part] } else { $null }
      if ($null -eq $property) {
        $found = $false
        break
      }
      $node = $property.Value
    }
    if ($found) {
      # Report only the key path, never the locale's value.
      Write-Output "Promotion locale key: $($localeFile.Name):$path"
    }
  }
}
