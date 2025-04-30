# Working with Gradido Native

## Production
Called in Root-Directory
```bash
turbo start 
```

```mermaid
graph TD;
    %% Colors
    classDef cached fill:#dee,stroke:#dee,stroke-width:2px;
    classDef persistent fill:#d98,stroke:#b10,stroke-width:2px;
    classDef none fill:#bde,stroke:#acd,stroke-width:1px;
    classDef default fill:bbb,stroke:ccc,stroke-width:1px;
    
    %% Root
    TStart[turbo start] --> BStart[turbo backend#start]
    TStart --> FRStart[turbo frontend#start]
    TStart --> AStart[turbo admin#start]
    TStart --> DStart[turbo dht-node#start]
    TStart --> FEStart[turbo federation#start]

    class TStart default
    class BStart persistent
    class FRStart persistent
    class AStart persistent
    class DStart persistent
    class FEStart persistent
    
    %% Backend
    BStart --> DUp[turbo database#up]
    BStart --> BBuild[turbo backend#build]
    BBuild --> DBuild[turbo database#build]
    BBuild --> CBuild[turbo config-schema#build]

    class DUp none
    class BBuild cached
    class DBuild cached
    class CBuild cached

    %% Frontend
    FRStart --> FBuild[turbo frontend#build]
    FBuild --> FCompileCSS[turbo frontend#compile-css]
    FBuild --> CBuild[turbo config-schema#build]

    class FBuild cached
    class FCompileCSS cached

    %% Admin
    AStart --> ABuild[turbo admin#build]
    ABuild --> CBuild[turbo config-schema#build]

    class ABuild cached

    %% DHT Node
    DStart --> DHTBuild[turbo dht-node#build]
    DStart --> DUp[turbo database#up]
    DHTBuild --> DBuild[turbo database#build]
    DHTBuild --> CBuild[turbo config-schema#build]

    class DHTBuild cached

    %% Federation
    FEStart --> FEBuild[turbo federation#build]
    FEStart --> DUp[turbo database#up]
    FEBuild --> DBuild[turbo database#build]
    FEBuild --> CBuild[turbo config-schema#build]

    class FEBuild cached
```
### Legende
```mermaid
graph TD;
    %% Colors
    classDef cached fill:#dee,stroke:#dee,stroke-width:2px;
    classDef persistent fill:#d98,stroke:#b10,stroke-width:2px;
    classDef none fill:#bde,stroke:#acd,stroke-width:1px;

    CNP[cached, non-persistent]
    class CNP cached
    NCP[non-cached, persistent]
    class NCP persistent
    NCNP[non-cached, non-persistend]
    class NCNP none
```

- [Cached](https://turborepo.com/docs/crafting-your-repository/caching): Task will be only redone, if src, config or .env changed
- [Persistent](https://turborepo.com/docs/reference/configuration#persistent): will run a while, cannot be set as dependence

This will start all start jobs from all submodules (if executed in root directory).
Start Jobs usually have build as dependency.
Frontend has additional compile-css as dependency.
All backend modules have database:up as dependency which will make
sure that the db is running and the schema is up to date.

## Development
Called in Root-Directory
```bash
turbo dev 
```

```mermaid
graph TD;
    %% Colors
    classDef cached fill:#dee,stroke:#dee,stroke-width:2px;
    classDef persistent fill:#d98,stroke:#b10,stroke-width:2px;
    classDef none fill:#bde,stroke:#acd,stroke-width:1px;
    classDef default fill:bbb,stroke:ccc,stroke-width:1px;
    
    %% Root
    TDev[turbo dev] --> BDev[turbo backend#dev]
    TDev --> FRDev[turbo frontend#dev]
    TDev --> ADev[turbo admin#dev]
    TDev --> DDev[turbo dht-node#dev]
    TDev --> FEDev[turbo federation#dev]

    class TDev default
    class BDev persistent
    class FRDev persistent
    class ADev persistent
    class DDev persistent
    class FEDev persistent
    
    %% Backend
    BDev --> DUp[turbo database#up]
    BDev --> DBuild[turbo database#build]
    BDev --> CBuild[turbo config-schema#build]

    class DUp none
    class DBuild cached
    class CBuild cached

    %% Frontend
    FRDev --> CBuild[turbo config-schema#build]
    FRDev --> FCompileCSS[turbo frontend#compile-css]

    class FCompileCSS cached

    %% Admin
    ADev --> CBuild[turbo config-schema#build]

    %% DHT Node
    DDev --> DUp[turbo database#up]
    DDev --> DBuild[turbo database#build]
    DDev --> CBuild[turbo config-schema#build]        


    %% Federation
    FEDev --> DUp[turbo database#up]
    FEDev --> DBuild[turbo database#build]
    FEDev --> CBuild[turbo config-schema#build] 

```
### Legende
```mermaid
graph TD;
    %% Colors
    classDef cached fill:#dee,stroke:#dee,stroke-width:2px;
    classDef persistent fill:#d98,stroke:#b10,stroke-width:2px;
    classDef none fill:#bde,stroke:#acd,stroke-width:1px;

    CNP[cached, non-persistent]
    class CNP cached
    NCP[non-cached, persistent]
    class NCP persistent
    NCNP[non-cached, non-persistend]
    class NCNP none
```

- [Cached](https://turborepo.com/docs/crafting-your-repository/caching): Task will be only redone, if src, config or .env changed
- [Persistent](https://turborepo.com/docs/reference/configuration#persistent): will run a while, cannot be set as dependence

This will start all dev jobs from all submodules (if executed in root directory).
Dev Jobs use hot-reload so if you change some code, the module will automatically restart or reload
Frontend has additional compile-css as dependency.
All backend modules have database:up as dependency which will make
sure that the db is running and the schema is up to date.

##  Lint
Called in Root-Directory
```bash
turbo lint 
```
```mermaid
graph TD;
    %% Colors
    classDef cached fill:#dee,stroke:#dee,stroke-width:2px;
    classDef default fill:bbb,stroke:ccc,stroke-width:1px;
    
    %% Root
    TLint[turbo lint] --> BLint[turbo backend#lint]
    TLint --> FRLint[turbo frontend#lint]
    TLint --> ALint[turbo admin#lint]
    TLint --> DLint[turbo dht-node#lint]
    TLint --> FELint[turbo federation#lint]
    TLint --> DALint[turbo database#lint]
    TLint --> CLint[turbo config-schema#lint]

    class TLint default
    class BLint cached
    class FRLint cached
    class ALint cached
    class DLint cached
    class FELint cached
    class DAlint cached
    class CLint cached
    
    %% Backend
    BLint --> DBuild[turbo database#build]
    BLint --> BLocales[turbo backend#locales]

    class DBuild cached
    class BLocales cached

    %% Frontend
    FRLint --> FStyle[turbo frontend#stylelint]
    FRLint --> FLocales[turbo frontend#locales]

    class FStyle cached
    class FLocales cached

    %% Admin
    ALint --> AStyle[turbo admin#stylelint]
    ALint --> ALocales[turbo admin#locales]

    class AStyle cached
    class ALocales cached

```
### Legende
```mermaid
graph TD;
    %% Colors
    classDef cached fill:#dee,stroke:#dee,stroke-width:2px;
    
    CNP[cached, non-persistent]
    class CNP cached
```

- [Cached](https://turborepo.com/docs/crafting-your-repository/caching): Task will be only redone, if src, config or .env changed

This will run linting for all modules and additional stylelint (css linter)
for frontend and admin and locales for backend, frontend and admin.
Locales check if all translations are in alphabetic order

## Test
Called in Root-Directory
```
turbo test 
```

```mermaid
graph TD;
    %% Colors
    classDef cached fill:#dee,stroke:#dee,stroke-width:2px;
    classDef default fill:bbb,stroke:ccc,stroke-width:1px;
    classDef none fill:#bde,stroke:#acd,stroke-width:1px;
    
    %% Root
    TTest[turbo lint] --> BTest[turbo backend#test]
    TTest --> FRTest[turbo frontend#test]
    TTest --> ATest[turbo admin#test]
    TTest --> DTest[turbo dht-node#test]
    TTest --> FETest[turbo federation#test]

    class TTest default
    class BTest cached
    class FRTest cached
    class ATest cached
    class DTest cached
    class FETest cached

    %% Backend
    BTest --> CBuild[turbo config-schema#build]
    BTest --> DBuild[turbo database#build]
    BTest --> DUPBT[turbo database#up:backend_test]

    class CBuild cached
    class DBuild cached
    class DUPBT none

    %% DHT-Node
    DTest --> CBuild[turbo config-schema#build]
    DTest --> DBuild[turbo database#build]
    DTest --> DUPDHT[turbo database#up:dht_test]

    class DUPDHT none

    %% Federation
    FETest --> CBuild[turbo config-schema#build]
    FETest --> DBuild[turbo database#build]
    FETest --> DUPFe[turbo database#up:federation_test]

    class DUPFe none
```

### Legende
```mermaid
graph TD;
    %% Colors
    classDef cached fill:#dee,stroke:#dee,stroke-width:2px;
    classDef none fill:#bde,stroke:#acd,stroke-width:1px;

    CNP[cached, non-persistent]
    class CNP cached
    NCNP[non-cached, non-persistend]
    class NCNP none
```

- [Cached](https://turborepo.com/docs/crafting-your-repository/caching): Task will be only redone, if src, config or .env changed
- [Persistent](https://turborepo.com/docs/reference/configuration#persistent): will run a while, cannot be set as dependence

Run test for all modules expect config-schema (hasn't any tests yet),
Build config-schema and database if needed

## Turborepo Tips

### Call every module with every job
With turbo you can call any job for any module with this syntax:
```
turbo module#job
```
For example if you like to run backend and frontend, both in dev:
```
turbo backend#dev frontend#dev
```
[Running Multiple Task... ](https://turborepo.com/docs/crafting-your-repository/using-environment-variables)

### Call inside module
If you for example inside backend folder and you use
```
cd backend
turbo start
```
you will only start backend module, and of course all dependency

### Env-Variables
When you use .env files or ENV-Variables you need to call 
turbo with --env-mode=loose to make sure that turbo will redirect all
env variables to the jobs

For example: 
```
turbo backend#dev --env-mode=loose
```

[Using env...](https://turborepo.com/docs/crafting-your-repository/using-environment-variables)

