@echo off
echo ====================================================
echo  SQL Quest - Automated Static Web Deployer (Surge)
echo ====================================================
echo.
echo [1/2] Syncing routing fallbacks (copying index.html to 200.html)...
copy index.html 200.html /y >nul
echo.
echo [2/2] Publishing to opensigma-sqlquest.surge.sh...
cmd.exe /c "npx surge ./ --domain opensigma-sqlquest.surge.sh"
echo.
echo ====================================================
echo  Success! Published to: https://opensigma-sqlquest.surge.sh
echo ====================================================
echo.
pause
