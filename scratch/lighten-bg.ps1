# File list to update
$files = @("app/page.tsx", "app/login/page.tsx", "app/register/page.tsx")

foreach ($file in $files) {
    if (Test-Path $file) {
        $c = Get-Content $file -Raw
        
        # Replace base background colors
        $c = $c -replace '#02040a', '#09112a'
        $c = $c -replace 'bg-\[#02040a\]', 'bg-[#09112a]'
        
        # Replace card/box background colors
        $c = $c -replace '#080f25', '#111c3a'
        $c = $c -replace 'bg-\[#080f25\]', 'bg-[#111c3a]'
        
        # Replace sub-card background colors (e.g. input background or inner boxes)
        $c = $c -replace '#0c1530', '#16224f'
        $c = $c -replace 'bg-\[#0c1530\]', 'bg-[#16224f]'

        # Replace navbar rgba background colors
        $c = $c -replace 'rgba\(2, 4, 10,', 'rgba(9, 17, 42,'
        
        # Make borders a bit more visible with the lighter background
        $c = $c -replace 'border-\[#38bdf8\]/\[0\.08\]', 'border-[#38bdf8]/0.12'
        $c = $c -replace 'border-\[#38bdf8\]/\[0\.06\]', 'border-[#38bdf8]/0.08'
        $c = $c -replace 'border-\[#38bdf8\]/\[0\.05\]', 'border-[#38bdf8]/0.08'
        $c = $c -replace 'rgba\(56, 189, 248, 0\.08\)', 'rgba(56, 189, 248, 0.12)'
        $c = $c -replace 'rgba\(56, 189, 248, 0\.04\)', 'rgba(56, 189, 248, 0.08)'

        # Save file
        $c | Set-Content $file -NoNewline
        Write-Host "Updated colors in: $file"
    }
}
