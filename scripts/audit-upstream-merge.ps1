[CmdletBinding()]
param(
  [string]$CompareRef = 'origin/main',
  [string]$UpstreamRef = 'upstream/main'
)

$ErrorActionPreference = 'Stop'
$issues = New-Object System.Collections.Generic.List[string]

if (-not (Get-Command 'git' -ErrorAction SilentlyContinue)) {
  throw 'git is not available in PATH.'
}

$repoRoot = git rev-parse --show-toplevel 2>$null
if (-not $repoRoot) {
  throw 'Run this script inside the repository.'
}

Push-Location $repoRoot
try {
  Write-Host 'Upstream merge audit' -ForegroundColor Cyan
  Write-Host "Repository: $repoRoot"

  $unmergedFiles = @(git diff --name-only --diff-filter=U)
  if ($unmergedFiles.Count -gt 0) {
    $issues.Add("Unresolved merge conflicts: $($unmergedFiles.Count)")
    $unmergedFiles | ForEach-Object { Write-Host "  conflict: $_" -ForegroundColor Red }
  }

  git ls-files --error-unmatch 'AGENTS.md' *> $null
  if ($LASTEXITCODE -eq 0) {
    $issues.Add('AGENTS.md is tracked. It must remain local-only.')
    Write-Host '  tracked: AGENTS.md' -ForegroundColor Red
  } else {
    Write-Host '  AGENTS.md: local-only' -ForegroundColor Green
  }

  $localAgentsPath = Join-Path $repoRoot 'AGENTS.md'
  $gitDirectory = git rev-parse --absolute-git-dir 2>$null
  $agentsBackupPath = if ($gitDirectory) { Join-Path $gitDirectory 'AGENTS.md.local' } else { $null }
  if (-not (Test-Path -LiteralPath $localAgentsPath)) {
    $issues.Add('Local AGENTS.md is missing.')
  } elseif (-not $agentsBackupPath -or -not (Test-Path -LiteralPath $agentsBackupPath)) {
    $issues.Add('The .git/AGENTS.md.local backup is missing.')
  } else {
    $localAgentsHash = (Get-FileHash -LiteralPath $localAgentsPath -Algorithm SHA256).Hash
    $backupAgentsHash = (Get-FileHash -LiteralPath $agentsBackupPath -Algorithm SHA256).Hash
    if ($localAgentsHash -ne $backupAgentsHash) {
      $issues.Add('Local AGENTS.md does not match .git/AGENTS.md.local.')
    } else {
      Write-Host '  AGENTS.md backup: hash matches' -ForegroundColor Green
    }
  }

  git rev-parse --verify --quiet $UpstreamRef *> $null
  if ($LASTEXITCODE -ne 0) {
    $issues.Add("Upstream ref is unavailable: $UpstreamRef")
  } else {
    git merge-base --is-ancestor $UpstreamRef 'HEAD' *> $null
    if ($LASTEXITCODE -ne 0) {
      $issues.Add("$UpstreamRef is not an ancestor of HEAD.")
    } else {
      Write-Host "  upstream ancestry: $UpstreamRef is merged" -ForegroundColor Green
    }
  }

  $upstreamTagOpt = git config --get 'remote.upstream.tagOpt' 2>$null
  if ($upstreamTagOpt -ne '--no-tags') {
    $issues.Add('remote.upstream.tagOpt must be --no-tags.')
  } else {
    Write-Host '  upstream tags: disabled' -ForegroundColor Green
  }

  git rev-parse --verify --quiet $CompareRef *> $null
  if ($LASTEXITCODE -eq 0) {
    $changedFiles = @(
      git diff --name-only "$CompareRef...HEAD" 2>$null
      git diff --name-only 2>$null
      git diff --cached --name-only 2>$null
      git ls-files --others --exclude-standard
    ) | Sort-Object -Unique
    Write-Host "  files changed from ${CompareRef}: $($changedFiles.Count)"
    if ($changedFiles -contains 'AGENTS.md') {
      $issues.Add("AGENTS.md appears in the diff from $CompareRef.")
    }

    $committedDiffCheck = @(git diff --check "$CompareRef...HEAD" 2>&1)
    if ($LASTEXITCODE -ne 0) {
      $issues.Add("git diff --check failed for $CompareRef...HEAD.")
      $committedDiffCheck | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    }
  } else {
    Write-Host "  compare ref unavailable: $CompareRef" -ForegroundColor Yellow
  }

  $workingDiffCheck = @(git diff --check 2>&1)
  if ($LASTEXITCODE -ne 0) {
    $issues.Add('git diff --check failed for unstaged changes.')
    $workingDiffCheck | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
  }
  $stagedDiffCheck = @(git diff --cached --check 2>&1)
  if ($LASTEXITCODE -ne 0) {
    $issues.Add('git diff --check failed for staged changes.')
    $stagedDiffCheck | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
  }

  $trackedPaths = @(git ls-files)
  $untrackedPaths = @(git ls-files --others --exclude-standard)
  $allPaths = @($trackedPaths) + @($untrackedPaths)
  $promotionPathPattern =
    '(^|/)(sponsor|sponsors|funding|donate|backer)(/|\.|$)|' +
    'src/features/providers/(code0|fennoai|qiniucloud|claudeapi|sponsor)'
  $promotionPaths = @($allPaths | Where-Object { $_ -imatch $promotionPathPattern })
  if ($promotionPaths.Count -gt 0) {
    $issues.Add("Suspected promotion paths: $($promotionPaths.Count)")
    $promotionPaths | Sort-Object -Unique | ForEach-Object {
      Write-Host "  promotion path: $_" -ForegroundColor Red
    }
  }

  $scanRoots = @('src', 'tests', '.github')
  $trackedScanRoots = @($scanRoots | Where-Object { Test-Path -LiteralPath $_ })
  $untrackedScanFiles = @(
    $untrackedPaths | Where-Object {
      $path = $_
      $scanRoots | Where-Object { $path -eq $_ -or $path.StartsWith("$_/") }
    }
  )
  $promotionTextPattern =
    'affiliate|referral|agent/register|register\?[^[:space:]"'']*(aff|ref)=|' +
    'github\.com/sponsors|buymeacoffee|opencollective|patreon'
  $promotionFiles = @()
  if ($trackedScanRoots.Count -gt 0) {
    $promotionFiles += @(git grep -I -l -i -E $promotionTextPattern -- $trackedScanRoots 2>$null)
  }
  if ($untrackedScanFiles.Count -gt 0) {
    $promotionFiles += @(
      git grep --no-index -I -l -i -E $promotionTextPattern -- $untrackedScanFiles 2>$null
    )
  }
  $promotionFiles = @($promotionFiles | Sort-Object -Unique)
  if ($promotionFiles.Count -gt 0) {
    $issues.Add("Suspected promotion text files: $($promotionFiles.Count)")
    $promotionFiles | ForEach-Object { Write-Host "  promotion text: $_" -ForegroundColor Red }
  }

  if ($issues.Count -gt 0) {
    Write-Host ''
    Write-Host 'Audit failed:' -ForegroundColor Red
    $issues | ForEach-Object { Write-Host "- $_" -ForegroundColor Red }
    exit 1
  }

  Write-Host ''
  Write-Host 'Audit passed.' -ForegroundColor Green
  $global:LASTEXITCODE = 0
} finally {
  Pop-Location
}
