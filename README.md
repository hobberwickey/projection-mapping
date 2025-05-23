*run*

`npx webpack serve --port 3000`

*deploy*

`npx webpack build`
`aws s3 sync public  s3://sensorycontrols --profile hobberwickey --exclude 'videos/*'`