$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName System.Drawing

$exe = Join-Path $PWD 'release\win-unpacked\Synapse Browser.exe'
$out = Join-Path $PWD 'artifacts\windows-smoke'
New-Item -ItemType Directory -Force -Path $out | Out-Null
if (-not (Test-Path $exe)) { throw "Packaged executable not found: $exe" }

function Get-AppWindow {
  $process = Get-Process | Where-Object { $_.Path -eq $exe -and $_.MainWindowHandle -ne 0 } | Select-Object -First 1
  if (-not $process) { return $null }
  return [System.Windows.Automation.AutomationElement]::FromHandle($process.MainWindowHandle)
}
function Find-Name($window, [string]$name, [int]$seconds = 8) {
  $condition = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, $name)
  $end = (Get-Date).AddSeconds($seconds)
  do { $element = $window.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $condition); if ($element) { return $element }; Start-Sleep -Milliseconds 250 } while ((Get-Date) -lt $end)
  return $null
}
function Invoke-Name($window, [string]$name, [int]$seconds = 8) {
  $element = Find-Name $window $name $seconds
  if (-not $element) { throw "Windows UI Automation could not find '$name'" }
  $pattern = $element.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
  $pattern.Invoke()
  return $element
}
function Set-Text($window, [string]$name, [string]$value) {
  $element = Find-Name $window $name
  if (-not $element) { throw "Windows UI Automation could not find textbox '$name'" }
  $pattern = $element.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
  $pattern.SetValue($value)
}
function Capture($window, [string]$name) {
  $rect = $window.Current.BoundingRectangle
  $bitmap = New-Object System.Drawing.Bitmap([int]$rect.Width, [int]$rect.Height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.CopyFromScreen([int]$rect.X, [int]$rect.Y, 0, 0, $bitmap.Size)
  $bitmap.Save((Join-Path $out "$name.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose(); $bitmap.Dispose()
}

$process = Start-Process -FilePath $exe -ArgumentList '--no-sandbox','--disable-gpu' -PassThru
try {
  Start-Sleep -Seconds 8
  $window = Get-AppWindow
  if (-not $window) { throw 'Packaged Synapse Browser did not expose a visible native window' }
  Capture $window '01-launch'

  $skip = Find-Name $window 'Skip Setup' 3
  if ($skip) { $skip.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke(); Start-Sleep -Seconds 2; Capture $window '02-after-skip' }
  $getStarted = Find-Name $window 'Get Started' 2
  if ($getStarted) { $getStarted.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke(); Start-Sleep -Seconds 1; $skip = Find-Name $window 'Skip Setup'; if ($skip) { $skip.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke(); Start-Sleep -Seconds 2 } }

  Invoke-Name $window 'Open Settings'
  Start-Sleep -Milliseconds 500
  Capture $window '03-settings'
  Invoke-Name $window 'Close Settings'
  Invoke-Name $window 'Toggle AI panel'
  Set-Text $window 'What do you want me to do?' 'Windows native UI smoke prompt'
  Capture $window '04-ai-input'
  Invoke-Name $window 'Run ORION'
  Start-Sleep -Seconds 2
  Capture $window '05-ai-running'
  Write-Output '{"nativeWindowsUI":"PASS","onboarding":"observed_or_already_complete","settings":"PASS","aiInput":"PASS","aiRun":"PASS"}'
} finally {
  if ($process -and -not $process.HasExited) { Stop-Process -Id $process.Id -Force }
}
