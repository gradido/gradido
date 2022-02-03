<!-- You can find the latest issue templates here https://github.com/ulfgebhardt/issue-templates -->

## 🍰 Pullrequest
This PR does not need to be memorised, it describes how to get to the decay start block in the developer environment. 

- important is that the database/src/index.ts  
  Line await runSeeder(DecayStartBlockSeed)
after the runSeeder() functions of the example user.

 - and that the date in the database/src/seeds/decay-start-block.seed.ts line 13 is set to one month later. 
 
 
 

![Bildschirmfoto von 2021-12-16 07-08-24](https://user-images.githubusercontent.com/1324583/146325149-06fb34a0-20e2-4258-a846-8949453731d7.png)

![Bildschirmfoto von 2021-12-16 08-16-40](https://user-images.githubusercontent.com/1324583/146325441-493f5b27-a7bc-4749-89a2-714238a4b830.png)


1. cd database 
2. yarn dev_down
3. database/src/seeds/decay-start-block.seed.ts und das datum ändern .. (einen monat höher)
4. yarn seed 
5. mit bibi@blocksberg.de einloggen und eine transaktion an peter@lustig.de machen. 
die erste transaktion sollte dann den Startblock Vergänglichkeit enthalten.

![Bildschirmfoto von 2021-12-16 07-27-18](https://user-images.githubusercontent.com/1324583/146325172-cab7d374-01ff-4c59-bfad-a31fa15c99d4.png)


![Bildschirmfoto von 2021-12-16 07-28-31](https://user-images.githubusercontent.com/1324583/146325273-8dc3f488-e0f1-44ac-8fcf-e1d845623aaa.png)


