# GraDiDo-Transactions

## General Description

The GraDiDo-System offers the business processes "CreateGradido" and "TransferGradio". Both processes need data, which has to be transferred between the involved different systems, especially between the internal Gradido servers and the external "BlockChain"-Service - currently (07.2021) IOTA is in use.

The main topic for the Gradido-Transactions is to ensure a misusage of money creation and keep all changes on an account consistent.

The basic requirements on this transfer data should be encapsulated in a base type and the business details for the different processes should be extended in separated types, which inherited the basics from the base type.

## Transaction Processes

In this chapter the two business processes are described to understand the different requirements, which leads to the transaction model following below.

### CreateGradido

The creation of Gradido-money has to fulfill the following business rules:

* it can only be create for a *personal account* of a human being
* the account of the human being belongs to one Community
* per month
  * maximal 1.000 GDD for the personal account
  * maximal 1.000 GDD for the general welfare account of the community per community member
  * maximal 1.000 GDD for the compensation and environmental fund of the community per community member
  * use the configured community specific triple-amount for the three recipients
* the target month of creation must not be older than 3 month

### TransferGradido

## Type of Transactions

For the two business processes there are two different types of transactions necessary.

### Create-Transaction

The Create-Transaction is used to create GDDs for

### Transfer-Transaction

## Transaction-Model
