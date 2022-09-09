# Technical Overview

This document describes the technical overview for the Gradido infrastructur. Beginning with a bird's eye view of all involved components, the following chapters will go in details of each component.

# Inventory Taking

![TechnicalOverview](../image/TechnicalOverview.png)

## Community-Server

### Public API

![CommunityServerAPI](../image/CommunityServerAPI.png)

### Database Skeema (outdated)

![CommunityDBSkeema](../image/CommunityDBSkeema.png)

# Ideas of future Architecture

## Moduls

![ModulsOverview](../image/ModulsOverview.png)

## ObjectModel

![BusinessObjectModel](../image/GradidoBusinessObjekte.png)

## DatabaseModel

![DatabaseModel](../image/GradidoBusinessDBSkeema.png)

# Backend Refactoring (09.2022)

The current implementation of the business logic is concentrated in Resolver classes. Each resolver contains the implementation to handle the data access per typeORM classes to the database including all technical detailed about the explicit transaction handling especially for write access. There is no reuse of code in generalized classes to access for example the user data. Each resolver class, which needs user data has its own implementation of these more or less technical details.

## current Business-Layer

At first the following pictures will show for each current existing resolver class its usage of the backend components. Afterwards an overview picture shows the dependencies between all resolver classes.

### AdminResolver

![img](../image/BE-AdminResolver-IST.png)

### BalanceResolver

![img](../image/BE-BalanceResolver-IST.png)

### CommunityResolver

![img](../image/BE-CommunityResolver-IST.png)

### ContributionMessageResolver

![img](../image/BE-ContributionMessageResolver-IST.png)

### ContributionResolver

![img](../image/BE-ContributionResolver-IST.png)

### GdtResolver

![img](../image/BE-GdtResolver-IST.png)

### KlicktippResolver

![img](../image/BE-KlicktippResolver-IST.png)

### StatisticsResolver

![img](../image/BE-StatisticsResolver-IST.png)

### TransactionLinkResolver

![img](../image/BE-TransactionLinkResolver-IST.png)

### TransactionsResolver

![img](../image/BE-TransactionResolver-IST.png)

### UserResolver

![img](../image/BE-UserResolver-IST.png)

### Overview Resolver Dependencies

![img](../image/BE-Overview-IST.png)

## future Business-Layer

The motivation of this refactoring is to extent the backend with a horizontal data-access-layer containing data-access-objects (postfix DAO). All data access implementations in the resolver classes will be shifted in these new data-access classes. There will be a DAO-class for each data object or in detail for each typeORM class and offer an api for the resolver classes to satify their business requirements. The necessary technical database classes like typeorm will be hidded from resolver access and will only be usable from the new data access layer dao classes.

It is still open, if the data, which is transferred between the resolver classes and the dao classes are from type *graphql model* or from a new business oriented *transfer object model*. In consequence there is always a mapping between the *typeorm* over *transfer object* to *graphql model* during data access throught the different layers necessary.

This seams to be a greate disadvantage, but it will encapsulate the *database/typeorm* model from the business logic. This offers the opportunity to change one model independent from the other and only the model mapping has to be adapted. It will also concentrate all efforts of model versioning especially for the future multi community readyness in the model mapping.

The current *graphql model* is designed for the requirements of the user UI and admin UI. The requirements for inter community communication will differ from the UI requirements. So it has to clarified if a business oriented *transfer object model* will help to implement an independent business logic and the *UI graphql model* or the *community graphql model* will serve the requirements for this special channel.

The business logic, which is currently implemented in the resolver classes too should in a later refactoring shifted in new generalized business logic service layer. The ui-resolver-layer and community-resolver-layer will invoke these business services to process their requests. The business services will use the data-access-layer to read and write the data from and to the database.

### Refactoring Overview

The following picture shows an overview and reorganisation of all business layer components including the new data-access-layer with the DAO classes. Next to the UI-Resolver-Layer there is a Community-Resolver-Layer planed for the requirements of the multi community readyness.

![img](../image/BE-Overview-SOLL.png)
