@echo off
echo Deploying Firestore Security Rules...
echo.

firebase use kiro-4ff97
firebase deploy --only firestore:rules

echo.
echo Rules deployed successfully!
echo You can now refresh your browser and try creating a child.
pause
