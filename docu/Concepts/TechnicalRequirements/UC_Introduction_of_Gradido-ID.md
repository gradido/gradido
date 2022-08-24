# Introduction of Gradido-ID

## Motivation

The introduction of the Gradido-ID base on the requirement to identify an user account per technical key instead of using an email-address. Such a technical key ensures an exact identification of an user account without giving detailed information for possible missusage.

Additionally the Gradido-ID allows to administrade any user account data like changing the email address or define several email addresses without any side effects on the identification of the user account.

## Definition

The formalized definition of the Gradido-ID can be found in the document [BenutzerVerwaltung#Gradido-ID](../BusinessRequirements/BenutzerVerwaltung#Gradido-ID).

## Steps of Introduction

To Introduce the Gradido-ID there are several steps necessary. The first step is to define a proper database schema with additional columns and tables followed by data migration steps to add or initialize the new columns and tables by keeping valid data at all.

The second step is to decribe all concerning business logic processes, which have to be adapted by introducing the Gradido-ID.

### Database-Schema

#### Users-Table

The entity users has to be changed by adding the following columns. The column State gives a hint about the working state including the ticket number.

| State          | Column                 | Type   | Description                                                                                                                                                   |
| -------------- | ---------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| *done #2125* | gradidoID              | String | technical unique key of the user as UUID (version 4)                                                                                                          |
| *done #2125* | alias                  | String | a business unique key of the user                                                                                                                             |
| *open*       | passwordEncryptionType | int    | defines the type of encrypting the passphrase: 1 = email (default), 2 = gradidoID, ...                                                                        |
| *open*       | emailID                | int    | technical foreign key to the UserContacts-Table with the entry of type Email, which will be interpreted as the maincontact from the Users table point of view |

##### Email vs emailID

The existing column `email`, will now be changed to the primary email contact, which will be stored as a contact entry in the new `UserContacts` table.

###### ToDo:

It is necessary to decide if the content of the `email `will be changed to the foreign key `emailID `to the contact entry with the email address or if the email itself will be kept as a denormalized and duplicate value in the `users `table.

The **preferred and proper solution** will be to add the new column `Users.emailId `as foreign key to the `UserContacts `entry and delete the `Users.email` column after the migration of the email address in the `UserContacts `table.

#### new UserContacts-Table

A new entity `UserContacts `is introduced to store several contacts of different types like email, telephone or other kinds of contact addresses.

| Column | Type   | Description                                                  |
| ------ | ------ | ------------------------------------------------------------ |
| id     | int    | the technical key of a contact entity                        |
| type   | int    | Defines the type of contact entry as enum: Email, Phone, etc |
| userID | int    | Defines the foreign key to the `Users` table               |
| email  | String | defines the address of a contact entry of type Email         |
| phone  | String | defines the address of a contact entry of type Phone         |

##### ToDo:

The UserContacts, expecially the email contacts, will for future be categorized to communication channels for example to allow the user to define which information he will get on which email-contact (aspects of administration, contract, advertising, etc.)

### Database-Migration

After the adaption of the database schema and to keep valid consistent data, there must be several steps of data migration to initialize the new and changed columns and tables.

#### Initialize GradidoID (done #2125)

In a one-time migration create for each entry of the `Users `tabel an unique UUID (version4).

#### Primary Email Contact (ongoing #1798)

In a one-time migration read for each entry of the `Users `table the `Users.id` and `Users.email` and create for it a new entry in the `UserContacts `table, by initializing the contact-values with:

* id = new technical key
* type = Enum-Email
* userID =`Users.id`
* email =`Users.email`
* phone = null
* usedChannel = Enum-"main contact"

and update the `Users `entry with `Users.emailId = UserContacts.Id` and `Users.passwordEncryptionType = 1`

After this one-time migration the column `Users.email` can be deleted.

### Adaption of BusinessLogic

The following logic or business processes has to be adapted for introducing the Gradido-ID

#### Capturing of alias

To avoid using the email as primary identifier it is necessary to introduce a capturing of the alias. It is not a good solution to create for existing users an individual alias by a migration. So each user should capture his own alias during registration- and/or login-process.

These requirements are described in the concept document [../BusinessRequirements/UC_Set_UserAlias.md]() **(done #2144)** and the implementation of these requirements will be the prerequisite for changing the login-process from single email-identifier to the future identifiers alias / gradidoID / email.

#### Read-Write Access of Users-Table especially Email (ongoing #1798)

The ORM mapping has to be adapted to the changed and new database schema.

#### Registration Process

The logic of the registration process has to be adapted by

* creating a new User including with a unique UUID-V4 **(done #2125)**
* creating a new `UserContacts `entry with the given email address **(ongoing #2165)**
* set `emailID `in the `Users `table as foreign key to the new `UserContacts `entry **(ongoing #2165)**
* set `Users.passwordEncrpytionType = 2` and encrypt the password with the `Users.gradidoID` instead of the `UserContacts.email`

#### Login Process

The logic of the login process has to be adapted by

* search the users data by reading the `Users `and the `UsersContact` table with the `email` as input **(ongoing #2165)**
* depending on the `Users.passwordEncryptionType` decrypt the stored password
  * = 1 :  with the email and the existing cryptographical logic (asymetric encryption)
  * = 2 : with the gradidoID and the new cryptographical logic (hashing)

#### Password En/Decryption

The logic of the password en/decryption has to be adapted by encapsulate the logic to be controlled with an input parameter. The input parameter can be the email or the userID.

#### Change Password Process

The logic of change password has to be adapted by

* if the `Users.passwordEncryptionType` = 1, then

  * read the users email address from the `UsersContact `table
  * give the email address as input for the password decryption of the existing password
  * use the `Users.gradidoID` as input for the password hashing, which will be stored in `Users.password`
  * change the `Users.passwordEnrycptionType` to the new value =2
* if the `Users.passwordEncryptionType` = 2, then

  * give the `Users.gradidoID` as input for the password hashing anddecryption of the existing password
  * use the `Users.gradidoID` as input for the password encryption fo the new password

#### Search- and Access Logic

A new logic has to be introduced to search the user identity per different input values. That means searching the user data must be possible by

* searching per email (only with maincontact as contactchannel)
* searching per userID
* searching per alias

#### Identity-Mapping

A new mapping logic will be necessary to allow using unmigrated APIs like GDT-servers api. So it must be possible to give this identity-mapping logic the following input to get the respective output:

* email -> userID
* email -> gradidoID
* email -> alias
* userID -> gradidoID
* userID -> email
* userID -> alias
* alias -> gradidoID
* alias -> email
* alias -> userID
* gradidoID -> email
* gradidoID -> userID
* gradidoID -> alias

#### GDT-Access

To use the GDT-servers api the used identifier for GDT has to be switch from email to userID.
