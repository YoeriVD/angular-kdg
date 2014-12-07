xcopy %DEPLOYMENT_SOURCE% %DEPLOYMENT_TARGET% /Y
cd %DEPLOYMENY_TARGET%
npm install bower grunt-cli karma-cli
npm install && bower install && grunt build
