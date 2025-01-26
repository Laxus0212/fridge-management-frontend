# Leírás a projekt elindításához

> npm install ws szerveren a websockethez

## Kódsorok lokális futtatásához

> npm install

//> cd fridge-management/src/app/openapi

//> openapi-generator-cli generate -i http://localhost:3000/swagger.json -g typescript-angular -o ./generated-angular-sdk
> npm run generate:swagger

//> cd ../..

//> ionic serve --configuration=development vagy ionic capacitor build android
> npm run start:dev

## Prism mock szerver futtatása

> cd .\src\app\openapi\

> prism mock openapi.yaml

## Kódsorok prod futtatáshoz

> cd fridge-management/src/app/openapi

> openapi-generator-cli generate -i https://varadinas.synology.me:3000/swagger.json -g typescript-angular -o ./generated-angular-sdk

> cd ../..

> ionic serve --configuration=production vagy ionic capacitor build android

npm install @ionic/utils-process -> az ionic-nak, hogy lássa a telefont

kell még websocket a chat funkcióhoz
regisztrációs oldalt is megnézni
valahogy megoldani, hogy a család "tulajdonosa" meg tudjon hívni felhasználót emailcím alapján
ki lehessen lépni a családból
külön fül, ahol meg lehet nézni kik vannak a családban
hűtő megosztása a családdal az update oldalon és a hozzáadásnál is
backend kell a swagger alapján
tesztek
package json átnézése
ci/cd pipeline
dockert átnézni mi kell hozzá
dokumentáció
readme átnézése
inline teszt adatok kiírtása
mindent kitelepíteni nas-ra
mobilon tesztelni
admin felület
folyamat stb ábrák

ezek a service-ek segíthetnek még a familyid, userid adatok elérésében. 
A fridge component alapján szereném az owned és family shared, valamint 
az edit és new shopping list-et megoldani.

