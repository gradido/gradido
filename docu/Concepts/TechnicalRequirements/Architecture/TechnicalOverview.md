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

The current implementation of the business logic is concentrated in Resolver classes. Each resolver contains the implementation to handle the data access per typeORM classes including all technical detailed about the explicit transaction handling especially for write access. There is no reuse of code in generalized classes to access for example the user data. Each resolver class, which needs user data has its own implementation of these more or less technical details.

The motivation of this refactoring is to extent the backend with a horizontal layer of data-access-objects (postfix DAO). There will be a DAO-class for each data object or in detail for each typeORM class and offer an api for the resolver classes to satify their business requirements.

## Business-Layer

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

### Overview Reolver Dependencies

![img](../image/BE-Overview-IST.png)
