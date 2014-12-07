xcopy %DEPLOYMENT_SOURCE% %DEPLOYMENT_TARGET% /Y
cd %DEPLOYMENY_TARGET%
npm install
bower install
grunt build
