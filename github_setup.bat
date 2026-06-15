@echo off
echo ====================================================
echo  SQL Quest - Push to GitHub Repository
echo ====================================================
echo.
echo This wizard will link your local repository and push it to GitHub.
echo.
echo Before proceeding, please:
echo  1. Go to https://github.com and log in.
echo  2. Create a new empty repository (do not add a README, license, or .gitignore).
echo  3. Copy the HTTPS repository URL (ends with .git).
echo.
set /p repo_url="Paste your GitHub Repository URL: "
if "%repo_url%"=="" goto error

echo.
echo Linking repository to origin...
git remote add origin %repo_url%
git branch -M main
echo.
echo Pushing code to GitHub...
git push -u origin main
echo.
echo ====================================================
echo  Success! Your code is now hosted on GitHub.
echo ====================================================
echo.
goto end

:error
echo.
echo Error: Repository URL cannot be empty.
echo.
:end
pause
