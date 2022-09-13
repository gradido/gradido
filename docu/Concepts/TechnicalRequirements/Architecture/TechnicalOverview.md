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

At first the following pictures will show for each current existing resolver class its usage of the backend components - used = marked blue, not used = marked red. Afterwards an overview picture shows the dependencies between all resolver classes.

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

### Persistence-Layer

The persistence layer contains the relational database model, which is mapped with the typeorm model of entities between the javascript and database world. The entity model mirrors all database tables and their relations by using the typeorm dbTools. The following picture will give an overview about these two models and their associations.

#### ORM-Model

![img](../image/BE-PersistenceLayer.png)

#### Entity-Model

![img](../image/BE-EntityLayer.png)

### GraphQL-Model

The GraphQL-Model is used in the API between frontend and backend. It fulfills the requirements for the different frontend requests triggered by the user interface and the admin interface.

![img](../image/BE-GraphQLModel.png)

### DAO-Layer

The DAO-Layer will contain data-access classes, which encapsulate all data access on the persistence layer. They will offer a business oriented API for the upper resolver classes and business logic.

The following programming convention has to be observed:

* a data access class must be located in the modul `backend `in the directory `src/dao`
* a data access class must have the postfix `DAO`
* no other classes than DAO-classes are allowed to import `dbTools/typeorm`
* no other classes than DAO-classes or repository classes are allowed to referre to entity classes
* the api of a DAO-class must be designed with objects of type `graphql/model/*` or basic typescript/javascript types
* a DAO method with write access must handle a user transaction, means using a still existing user transaction in case of cascaded DAO invocation or open an user transaction
* the only allowed isolation levels of an user transaction are ~~"READ UNCOMMITTED"~~ | "READ COMMITTED" | "REPEATABLE READ" | "SERIALIZABLE", suggestion would be "REPEATABLE READ"

#### AbstractDAO

This DAO class should contain all general necessary parts like api definitions and implementations, which have to be used by the real implementation DAO classes like a super class. That means all predefined public api methods of this abstract class must be at least implemented by the derived classes. If not only a signature of a method but also an implementation exists, the derived class must implement a method with the same signature, but must invoke the same method of the AbstractDAO internally like a super class.

##### startTx

##### commitTx

##### rollbackTx

#### ContributionDAO

##### create

* **Input:**	of type `graphql/model/Contribution` with at least mandatory initialized attributes
* **Output:**	of type `graphql/model/Contribution `with all mandatory and default initialized attributes
* **Error:**	throws an exception if the contribution could not be written

##### count

##### read

##### save

##### delete

#### ContributionLinkDAO

#### ContributionMessageDAO

#### EventProtocolDAO

#### TransactionDAO

#### TransactionLinkDAO

#### UserDAO

#### UserContactDAO
