[CmdletBinding()]
param(
    [string]$ProjectRoot,
    [int]$TimeoutSeconds = 30
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

if (-not $ProjectRoot) {
    $ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
}

$backendDirectory = Join-Path $ProjectRoot 'backend'
$frontendDirectory = Join-Path $ProjectRoot 'frontend'
$logDirectory = Join-Path $ProjectRoot '.runlogs'
$runStamp = Get-Date -Format 'yyyyMMdd-HHmmss'

function Test-TcpPort {
    param([int]$Port)

    $client = [System.Net.Sockets.TcpClient]::new()
    try {
        $connection = $client.ConnectAsync('localhost', $Port)
        $completed = $connection.Wait(1000)
        if (-not $completed) {
            return $false
        }
        return $connection.Status -eq [System.Threading.Tasks.TaskStatus]::RanToCompletion
    }
    catch {
        return $false
    }
    finally {
        $client.Dispose()
    }
}

function Wait-TcpPort {
    param(
        [int]$Port,
        [string]$ServiceName
    )

    $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
    while ([DateTime]::UtcNow -lt $deadline) {
        if (Test-TcpPort -Port $Port) {
            return
        }
        Start-Sleep -Milliseconds 300
    }

    throw "$ServiceName did not begin listening on port $Port within $TimeoutSeconds seconds."
}

function Start-NodeService {
    param(
        [string]$ServiceName,
        [string]$WorkingDirectory,
        [string[]]$Arguments,
        [int]$Port,
        [string]$LogPrefix
    )

    if (Test-TcpPort -Port $Port) {
        Write-Host "[ready] $ServiceName already listens on port $Port."
        return
    }

    $nodeExecutable = (Get-Command node.exe -ErrorAction Stop).Source
    $stdoutLog = Join-Path $logDirectory "$LogPrefix-$runStamp.out.log"
    $stderrLog = Join-Path $logDirectory "$LogPrefix-$runStamp.err.log"

    Start-Process -FilePath $nodeExecutable `
        -ArgumentList $Arguments `
        -WorkingDirectory $WorkingDirectory `
        -RedirectStandardOutput $stdoutLog `
        -RedirectStandardError $stderrLog `
        -WindowStyle Hidden | Out-Null

    try {
        Wait-TcpPort -Port $Port -ServiceName $ServiceName
        Write-Host "[started] $ServiceName on port $Port."
    }
    catch {
        Write-Host "[log] $stdoutLog"
        Write-Host "[log] $stderrLog"
        if (Test-Path $stderrLog) {
            Get-Content $stderrLog -Tail 40
        }
        throw
    }
}

if (-not (Test-Path (Join-Path $backendDirectory 'package.json'))) {
    throw "Backend project not found under $backendDirectory."
}
if (-not (Test-Path (Join-Path $frontendDirectory 'package.json'))) {
    throw "Frontend project not found under $frontendDirectory."
}

New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null

if (Test-TcpPort -Port 3306) {
    Write-Host '[ready] MariaDB already listens on port 3306.'
}
else {
    $databaseService = Get-Service -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match 'mysql|maria' -or $_.DisplayName -match 'mysql|maria' } |
        Select-Object -First 1

    if ($databaseService) {
        if ($databaseService.Status -ne 'Running') {
            Start-Service -Name $databaseService.Name
        }
    }
    else {
        $databaseExecutable = Get-ChildItem 'C:\Program Files' -Directory -Filter 'MariaDB *' -ErrorAction SilentlyContinue |
            Sort-Object Name -Descending |
            ForEach-Object { Join-Path $_.FullName 'bin\mariadbd.exe' } |
            Where-Object { Test-Path $_ } |
            Select-Object -First 1

        if (-not $databaseExecutable) {
            throw 'MariaDB executable was not found under C:\Program Files.'
        }

        $databaseRoot = Split-Path (Split-Path $databaseExecutable -Parent) -Parent
        $databaseStdoutLog = Join-Path $logDirectory "database-$runStamp.out.log"
        $databaseStderrLog = Join-Path $logDirectory "database-$runStamp.err.log"

        Start-Process -FilePath $databaseExecutable `
            -ArgumentList @('--defaults-file=data/my.ini', '--console') `
            -WorkingDirectory $databaseRoot `
            -RedirectStandardOutput $databaseStdoutLog `
            -RedirectStandardError $databaseStderrLog `
            -WindowStyle Hidden | Out-Null
    }

    Wait-TcpPort -Port 3306 -ServiceName 'MariaDB'
    Write-Host '[started] MariaDB on port 3306.'
}

Start-NodeService `
    -ServiceName 'NestJS backend' `
    -WorkingDirectory $backendDirectory `
    -Arguments @('node_modules/@nestjs/cli/bin/nest.js', 'start', '--watch') `
    -Port 3000 `
    -LogPrefix 'backend'

Start-NodeService `
    -ServiceName 'Vite frontend' `
    -WorkingDirectory $frontendDirectory `
    -Arguments @('node_modules/vite/bin/vite.js', '--strictPort') `
    -Port 5173 `
    -LogPrefix 'frontend'

Write-Host ''
Write-Host 'EnterpriseManageSystem is ready:'
Write-Host '  Frontend: http://localhost:5173'
Write-Host '  Backend:  http://localhost:3000/api'
Write-Host "  Logs:     $logDirectory"
