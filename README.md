# Leírás a projekt elindításához


## Kódsorok lokális futtatásához
### Frontend futtatásához szükség van a backend server futására

> cd fridge-management/src/app/openapi

> openapi-generator-cli generate -i http://localhost:3000/swagger.json -g typescript-angular -o ./generated-angular-sdk

> cd ../..

> ionic serve --configuration=development vagy ionic capacitor build android


## Kódsorok prod futtatáshoz

> cd fridge-management/src/app/openapi

> openapi-generator-cli generate -i https://varadinas.synology.me:3000/swagger.json -g typescript-angular -o ./generated-angular-sdk

> cd ../..

> ionic serve --configuration=production vagy ionic capacitor build android
