Write-Host "Starting local server..." -ForegroundColor Green
Write-Host ""
Write-Host "Open your browser and go to: http://localhost:8000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Try Python first
try {
    python -m http.server 8000
} catch {
    Write-Host "Python not found. Trying alternative..." -ForegroundColor Red
    # Alternative: Node.js http-server
    if (Get-Command http-server -ErrorAction SilentlyContinue) {
        http-server -p 8000
    } else {
        Write-Host "Please install Python or Node.js http-server" -ForegroundColor Red
        Write-Host "Python: https://www.python.org/downloads/" -ForegroundColor Cyan
        Write-Host "Or install http-server: npm install -g http-server" -ForegroundColor Cyan
        pause
    }
}

